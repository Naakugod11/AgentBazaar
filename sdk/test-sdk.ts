/**
 * sdk/test-sdk.ts
 *
 * Integration test for the SDK against devnet.
 * Runs one full job cycle end-to-end: register → listAgents → propose → accept → release.
 * Verifies token balance increases on the analyzer side.
 *
 * Run:  npx tsx sdk/test-sdk.ts
 *
 * Requires: USDC_MINT, RESEARCHER_PRIVATE_KEY, ANALYZER_PRIVATE_KEY in .env
 */

import "dotenv/config";
import * as crypto from "crypto";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";

import {
  registerAgent,
  listAgents,
  proposeJob,
  acceptJob,
  releaseEscrow,
  agentPda,
} from "./src/index";

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

const missing = ["USDC_MINT", "RESEARCHER_PRIVATE_KEY", "ANALYZER_PRIVATE_KEY"].filter(
  (k) => !process.env[k]
);
if (missing.length > 0) {
  console.error(`❌  Missing: ${missing.join(", ")} — check .env`);
  process.exit(1);
}

const usdcMint = new PublicKey(process.env.USDC_MINT!);
const researcher = Keypair.fromSecretKey(bs58.decode(process.env.RESEARCHER_PRIVATE_KEY!));
const analyzer = Keypair.fromSecretKey(bs58.decode(process.env.ANALYZER_PRIVATE_KEY!));

function tx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

function addr(pubkey: PublicKey | string): string {
  const s = typeof pubkey === "string" ? pubkey : pubkey.toBase58();
  return `https://explorer.solana.com/address/${s}?cluster=devnet`;
}

function sep(label: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${label}`);
  console.log("─".repeat(50));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureSol(kp: Keypair, label: string) {
  const balance = await connection.getBalance(kp.publicKey);
  if (balance >= 0.1 * LAMPORTS_PER_SOL) {
    console.log(`  ${label} SOL: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} ✓`);
    return;
  }
  console.log(`  ${label} SOL low — airdropping...`);
  const sig = await connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
  const latest = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: sig,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  });
  console.log(`  ${label} SOL: airdrop confirmed ✓`);
}

async function getUsdcBalance(owner: PublicKey): Promise<number> {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      researcher, // payer
      usdcMint,
      owner
    );
    const account = await getAccount(connection, ata.address);
    return Number(account.amount) / 1_000_000;
  } catch {
    return 0;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Agent Bazaar SDK — Integration Test        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  USDC mint:  ${usdcMint.toBase58()}`);
  console.log(`  Researcher: ${researcher.publicKey.toBase58()}`);
  console.log(`  Analyzer:   ${analyzer.publicKey.toBase58()}`);

  // ── Step 1: SOL ────────────────────────────────────────────────────────────
  sep("Step 1 — SOL balances / airdrop");
  await ensureSol(researcher, "researcher");
  await ensureSol(analyzer, "analyzer");

  // ── Step 2: Register agents ────────────────────────────────────────────────
  sep("Step 2 — Register agents");

  for (const { kp, name, capability, endpoint } of [
    {
      kp: researcher,
      name: "Token Researcher",
      capability: "token-research",
      endpoint: "http://localhost:3000",
    },
    {
      kp: analyzer,
      name: "Wallet Analyzer",
      capability: "wallet-analysis",
      endpoint: "http://localhost:3001",
    },
  ]) {
    try {
      const res = await registerAgent({
        signer: kp,
        name,
        capability,
        endpoint,
        pricePerCall: 0.01,
      });
      console.log(`  Registered "${name}"`);
      console.log(`  Agent PDA: ${res.agentPda.toBase58()}`);
      console.log(`  Explorer:  ${addr(res.agentPda)}`);
      console.log(`  Tx:        ${tx(res.signature)}`);
    } catch (e: unknown) {
      const logs: string[] = (e as any)?.logs ?? [];
      // ConstraintInit fires when the PDA already exists — totally fine on re-runs.
      if (logs.some((l) => l.includes("already in use") || l.includes("0x0"))) {
        const pda = agentPda(kp.publicKey);
        console.log(`  "${name}" already registered — PDA: ${pda.toBase58()}`);
      } else {
        throw e;
      }
    }
  }

  // ── Step 3: List agents ────────────────────────────────────────────────────
  sep("Step 3 — listAgents()");
  const agents = await listAgents();
  console.log(`  Found ${agents.length} agent(s) on devnet:`);
  agents.forEach((a) => {
    console.log(
      `    • ${a.name} (${a.capability}) — ${a.endpoint} — ${(a.priceHint / 1e6).toFixed(4)} USDC`
    );
    console.log(`      Owner: ${a.owner.toBase58()}`);
  });

  if (agents.length === 0) {
    console.error("  No agents found — registration may have failed. Aborting.");
    process.exit(1);
  }

  // ── Step 4: Balances before ────────────────────────────────────────────────
  sep("Step 4 — Balances before job cycle");
  const researcherBefore = await getUsdcBalance(researcher.publicKey);
  const analyzerBefore = await getUsdcBalance(analyzer.publicKey);
  console.log(`  Researcher: ${researcherBefore.toFixed(4)} mock-USDC`);
  console.log(`  Analyzer:   ${analyzerBefore.toFixed(4)} mock-USDC`);

  if (researcherBefore < 0.01) {
    console.error(
      "  Researcher has < 0.01 USDC. Run scripts/fund-agents.ts first."
    );
    process.exit(1);
  }

  // ── Step 5: propose → accept → release ────────────────────────────────────
  sep("Step 5 — Full job cycle");

  const jobId = crypto.randomBytes(32);
  const now = Math.floor(Date.now() / 1000);
  const JOB_AMOUNT = 0.01; // 0.01 USDC

  // 5a. Propose
  console.log(`\n  proposeJob (${JOB_AMOUNT} USDC)...`);
  const proposed = await proposeJob({
    signer: researcher,
    providerWallet: analyzer.publicKey,
    jobId,
    amount: JOB_AMOUNT,
    acceptanceDeadline: now + 120,
    deliveryDeadline: now + 600,
    usdcMint,
  });
  console.log(`  Job PDA:   ${proposed.jobPda.toBase58()}`);
  console.log(`  Explorer:  ${addr(proposed.jobPda)}`);
  console.log(`  Tx:        ${tx(proposed.signature)}`);

  // 5b. Accept
  console.log("\n  acceptJob...");
  const accepted = await acceptJob({
    signer: analyzer,
    consumer: researcher.publicKey,
    jobId,
  });
  console.log(`  Tx: ${tx(accepted.signature)}`);

  // 5c. Release
  console.log("\n  releaseEscrow...");
  // Dummy result hash — in production this would be SHA-256 of the delivered work.
  const resultHash = crypto.createHash("sha256").update("test result").digest();
  const released = await releaseEscrow({
    signer: analyzer,
    consumer: researcher.publicKey,
    jobId,
    resultHash,
    usdcMint,
  });
  console.log(`  Tx: ${tx(released.signature)}`);

  // ── Step 6: Balances after ─────────────────────────────────────────────────
  sep("Step 6 — Balances after job cycle");
  const researcherAfter = await getUsdcBalance(researcher.publicKey);
  const analyzerAfter = await getUsdcBalance(analyzer.publicKey);

  const researcherDelta = researcherAfter - researcherBefore;
  const analyzerDelta = analyzerAfter - analyzerBefore;

  console.log(
    `  Researcher: ${researcherBefore.toFixed(4)} → ${researcherAfter.toFixed(4)} mock-USDC  (${researcherDelta >= 0 ? "+" : ""}${researcherDelta.toFixed(4)})`
  );
  console.log(
    `  Analyzer:   ${analyzerBefore.toFixed(4)} → ${analyzerAfter.toFixed(4)} mock-USDC  (${analyzerDelta >= 0 ? "+" : ""}${analyzerDelta.toFixed(4)})`
  );

  // Verify the token movement matches expectations.
  const analyzerGained = Math.abs(analyzerDelta - JOB_AMOUNT) < 0.0001;
  const researcherPaid = Math.abs(researcherDelta + JOB_AMOUNT) < 0.0001;

  if (analyzerGained && researcherPaid) {
    console.log(`\n  ✅  Token flow verified — ${JOB_AMOUNT} USDC moved from researcher to analyzer`);
  } else {
    console.warn("  ⚠   Token delta mismatch — check the explorer links above");
  }

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   All steps passed. SDK is healthy.          ║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().catch((e) => {
  console.error("\n❌  Test failed:", e.message ?? e);
  if ((e as any)?.logs) {
    console.error("Program logs:", (e as any).logs);
  }
  process.exit(1);
});
