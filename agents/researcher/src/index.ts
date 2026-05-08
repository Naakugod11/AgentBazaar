import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import * as crypto from "crypto";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

import {
  listAgents,
  proposeJob,
  AgentAccount,
} from "../../../sdk/src/index";

// ─── Config ───────────────────────────────────────────────────────────────────

if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
if (!process.env.AGENT_PRIVATE_KEY) throw new Error("AGENT_PRIVATE_KEY is required");
if (!process.env.USDC_MINT) throw new Error("USDC_MINT is required");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.AGENT_PRIVATE_KEY));
const usdcMint = new PublicKey(process.env.USDC_MINT);
const QUESTION =
  process.env.QUESTION ??
  `Should I buy WIF right now? Analyze my wallet: ${keypair.publicKey.toBase58()}`;

// ─── Tool definitions (what Claude can call) ──────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "discover_agents",
    description:
      "Discover all registered AI agents on the Agent Bazaar marketplace. " +
      "Returns a list of agents with their capabilities, endpoints, and pricing. " +
      "Use this first to find an appropriate agent for a task.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "call_paid_agent",
    description:
      "Hire a specific agent from the marketplace to perform a task. " +
      "This automatically handles the on-chain escrow payment: " +
      "1) proposes a job (locks USDC), 2) sends the request to the agent's HTTP endpoint, " +
      "3) the agent accepts + delivers + releases escrow in one atomic HTTP call. " +
      "Returns the agent's analysis result.",
    input_schema: {
      type: "object" as const,
      properties: {
        agentEndpoint: {
          type: "string",
          description: "The HTTP endpoint URL of the agent (from discover_agents)",
        },
        agentOwner: {
          type: "string",
          description: "The agent owner's wallet pubkey (from discover_agents)",
        },
        question: {
          type: "string",
          description: "The specific question or task to send to the agent",
        },
      },
      required: ["agentEndpoint", "agentOwner", "question"],
    },
  },
];

// ─── Tool implementations ─────────────────────────────────────────────────────

async function toolDiscoverAgents(): Promise<string> {
  const agents = await listAgents();
  if (agents.length === 0) {
    return "No agents registered on-chain yet.";
  }
  const myPubkey = keypair.publicKey.toBase58();
  const simplified = agents
    .filter((a: AgentAccount) => a.owner.toBase58() !== myPubkey)
    .map((a: AgentAccount) => ({
      pubkey: a.pubkey.toBase58(),
      owner: a.owner.toBase58(),
      name: a.name,
      capability: a.capability,
      endpoint: a.endpoint,
      priceHintUsdc: (a.priceHint / 1_000_000).toFixed(4),
    }));
  if (simplified.length === 0) return "No agents available (excluding self).";
  return JSON.stringify(simplified, null, 2);
}

async function toolCallPaidAgent(
  agentEndpoint: string,
  agentOwner: string,
  question: string
): Promise<string> {
  // ── Step 1: Probe — expect 402 with payment requirements (x402) ───────────
  console.log(`[researcher] Probing ${agentEndpoint}/analyze (x402)...`);
  const probe = await fetch(`${agentEndpoint}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(10_000),
  });

  if (probe.status !== 402) {
    throw new Error(`x402: expected 402 Payment Required, got ${probe.status}`);
  }

  const requirements = (await probe.json()) as {
    accepts: Array<{
      maxAmountRequired: string;
      payTo: string;
      asset: string;
      maxTimeoutSeconds: number;
    }>;
  };

  const offer = requirements.accepts?.[0];
  if (!offer) throw new Error("x402: no payment offer in 402 response");

  if (offer.asset !== usdcMint.toBase58()) {
    throw new Error(`x402: agent requested unknown asset ${offer.asset}, expected ${usdcMint.toBase58()}`);
  }

  const amountUsdc = Number(offer.maxAmountRequired) / 1_000_000;
  if (amountUsdc > 1.0) {
    throw new Error(`x402: agent requested ${amountUsdc} USDC, exceeds safety cap of 1.0 USDC`);
  }

  console.log(
    `[researcher] 402 received — required: ${amountUsdc} USDC → ${offer.payTo.slice(0, 8)}...`
  );

  // ── Step 2: Propose job on-chain (lock USDC in escrow) ────────────────────
  const providerWallet = new PublicKey(agentOwner);
  const jobId = crypto.randomBytes(32);
  const now = Math.floor(Date.now() / 1000);

  const { jobPda, signature } = await proposeJob({
    signer: keypair,
    providerWallet,
    jobId,
    amount: amountUsdc,
    acceptanceDeadline: now + 120,
    deliveryDeadline: now + offer.maxTimeoutSeconds,
    usdcMint,
  });

  console.log(
    `[researcher] Job on-chain — PDA: ${jobPda.toBase58().slice(0, 12)}... tx: ${signature}`
  );

  // ── Step 3: Retry with X-Payment proof header ─────────────────────────────
  // Format: "<jobIdHex>:<consumerPubkey>"
  const xPayment = `${jobId.toString("hex")}:${keypair.publicKey.toBase58()}`;

  const res = await fetch(`${agentEndpoint}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment": xPayment,
    },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agent ${agentEndpoint} responded ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    analysis: string;
    resultHash: string;
    releaseTx: string;
  };

  console.log(`[researcher] Result received. Release tx: ${data.releaseTx}`);
  return data.analysis;
}

// ─── Claude tool-use loop ─────────────────────────────────────────────────────

async function run() {
  console.log("[researcher] Starting Token Researcher Agent");
  console.log("[researcher] Wallet:", keypair.publicKey.toBase58());
  console.log("[researcher] Question:", QUESTION);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: QUESTION },
  ];

  const system =
    "You are an AI financial research agent operating on the Solana blockchain. " +
    "You have access to a decentralised marketplace of AI agents (Agent Bazaar). " +
    "When asked investment questions, you should: " +
    "1) Use discover_agents to find a wallet analyzer agent. " +
    "2) Use call_paid_agent to hire it and get real on-chain wallet analysis. " +
    "3) Combine the analysis with your own market knowledge to give a final recommendation. " +
    "Always ground your answer in the actual wallet data you received.";

  // Agentic loop: keep calling Claude until stop_reason is 'end_turn'.
  const MAX_ITERATIONS = 10;
  let iterations = 0;
  while (iterations++ < MAX_ITERATIONS) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // fast + cheap for the loop
      max_tokens: 4096,
      tools,
      messages,
      system,
    });

    // Accumulate assistant turn.
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      // Print the final text answer.
      for (const block of response.content) {
        if (block.type === "text") {
          console.log("\n" + "═".repeat(60));
          console.log("FINAL ANSWER");
          console.log("═".repeat(60));
          console.log(block.text);
          console.log("═".repeat(60) + "\n");
        }
      }
      break;
    }

    if (response.stop_reason !== "tool_use") {
      console.warn("[researcher] Unexpected stop_reason:", response.stop_reason);
      break;
    }

    // Process tool calls and collect results.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      console.log(`[researcher] Tool: ${block.name}`, block.input);

      let result: string;
      try {
        if (block.name === "discover_agents") {
          result = await toolDiscoverAgents();
        } else if (block.name === "call_paid_agent") {
          const inp = block.input as {
            agentEndpoint: string;
            agentOwner: string;
            question: string;
          };
          result = await toolCallPaidAgent(
            inp.agentEndpoint,
            inp.agentOwner,
            inp.question
          );
        } else {
          result = `Unknown tool: ${block.name}`;
        }
      } catch (e: unknown) {
        result = `Error: ${(e as Error).message}`;
        console.error(`[researcher] Tool ${block.name} failed:`, (e as Error).message);
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }
}

run().catch((e) => {
  console.error("[researcher] Fatal:", e);
  process.exit(1);
});
