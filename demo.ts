import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

// ─── Env validation ───────────────────────────────────────────────────────────

const required = ["ANTHROPIC_API_KEY", "RESEARCHER_PRIVATE_KEY", "ANALYZER_PRIVATE_KEY", "USDC_MINT"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n  Missing env vars: ${missing.join(", ")}`);
  console.error("  Run: npm run create-mint → npm run fund-agents → npm run demo\n");
  process.exit(1);
}

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

const researcherKp = Keypair.fromSecretKey(bs58.decode(process.env.RESEARCHER_PRIVATE_KEY!));
const analyzerKp   = Keypair.fromSecretKey(bs58.decode(process.env.ANALYZER_PRIVATE_KEY!));

const ANALYZER_DIR  = path.join(__dirname, "agents/analyzer");
const RESEARCHER_DIR = path.join(__dirname, "agents/researcher");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hr = (label: string) =>
  console.log(`\n${"─".repeat(44)}\n  ${label}\n${"─".repeat(44)}`);

function writeEnv(filePath: string, vars: Record<string, string>) {
  fs.writeFileSync(filePath, Object.entries(vars).map(([k, v]) => `${k}=${v}`).join("\n"));
}

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () =>
      fetch(url)
        .then((r) => { if (r.ok) resolve(); else retry(); })
        .catch(retry);
    const retry = () => {
      if (Date.now() > deadline) { reject(new Error(`Server timeout: ${url}`)); return; }
      setTimeout(attempt, 1000);
    };
    attempt();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║        Agent Bazaar  —  Live Demo        ║");
  console.log("╚══════════════════════════════════════════╝");

  // ── 1. Wallets ────────────────────────────────────────────────────────────
  hr("1 / 5  Wallets");

  const [rSol, aSol] = await Promise.all([
    connection.getBalance(researcherKp.publicKey),
    connection.getBalance(analyzerKp.publicKey),
  ]);

  console.log(`  Researcher  ${researcherKp.publicKey.toBase58()}  (${(rSol / LAMPORTS_PER_SOL).toFixed(3)} SOL)`);
  console.log(`  Analyzer    ${analyzerKp.publicKey.toBase58()}  (${(aSol / LAMPORTS_PER_SOL).toFixed(3)} SOL)`);
  console.log(`  USDC mint   ${process.env.USDC_MINT}`);

  if (rSol < 0.05 * LAMPORTS_PER_SOL || aSol < 0.05 * LAMPORTS_PER_SOL) {
    console.error("\n  Not enough SOL — run: npx tsx scripts/transfer-sol.ts\n");
    process.exit(1);
  }

  // ── 2. Write agent .env files ─────────────────────────────────────────────
  hr("2 / 5  Agent config");

  const shared = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    SOLANA_RPC_URL: RPC_URL,
    PROGRAM_ID: "DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b",
    USDC_MINT: process.env.USDC_MINT!,
  };

  writeEnv(path.join(ANALYZER_DIR, ".env"), {
    ...shared,
    AGENT_PRIVATE_KEY: process.env.ANALYZER_PRIVATE_KEY!,
    PORT: "3001",
    AGENT_ENDPOINT: "http://localhost:3001",
    AGENT_NAME: "Wallet Analyzer",
  });
  writeEnv(path.join(RESEARCHER_DIR, ".env"), {
    ...shared,
    AGENT_PRIVATE_KEY: process.env.RESEARCHER_PRIVATE_KEY!,
    QUESTION: `Should I buy WIF right now? Analyze my wallet: ${researcherKp.publicKey.toBase58()}`,
  });

  console.log("  agents/analyzer/.env   ✓");
  console.log("  agents/researcher/.env ✓");

  // ── 3. Dependencies ───────────────────────────────────────────────────────
  hr("3 / 5  Dependencies");

  const { execSync } = await import("child_process");
  for (const dir of [ANALYZER_DIR, RESEARCHER_DIR]) {
    if (!fs.existsSync(path.join(dir, "node_modules"))) {
      console.log(`  Installing ${path.basename(dir)}...`);
      execSync("npm install", { cwd: dir, stdio: "pipe" });
    }
    console.log(`  ${path.basename(dir).padEnd(12)} node_modules ✓`);
  }

  // ── 4. Start Analyzer ─────────────────────────────────────────────────────
  hr("4 / 5  Analyzer (HTTP server)");

  execSync("lsof -ti:3001 | xargs kill -9 2>/dev/null || true");

  const analyzer = spawn("npx", ["tsx", "src/index.ts"], {
    cwd: ANALYZER_DIR,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env },
  });

  let analyzerAlive = true;
  analyzer.on("error", (e) => console.error("  [analyzer] error:", e.message));
  analyzer.on("exit", (code) => {
    analyzerAlive = false;
    // code 143 = SIGTERM from analyzer.kill() below — expected clean shutdown
    if (code !== 0 && code !== 143) console.error(`  [analyzer] exited unexpectedly (code ${code})`);
  });

  // Clean up analyzer on Ctrl+C so port 3001 is released immediately.
  process.on("SIGINT", () => {
    if (analyzerAlive) analyzer.kill();
    process.exit(1);
  });

  console.log("  Waiting for http://localhost:3001/health ...");
  try {
    await waitForServer("http://localhost:3001/health");
    console.log("  Analyzer is up ✓");
  } catch {
    analyzer.kill();
    console.error("  Analyzer did not start — check logs above.");
    process.exit(1);
  }

  // ── 5. Run Researcher (Claude agent) ─────────────────────────────────────
  hr("5 / 5  Researcher (Claude + tool-use)");
  console.log("  Claude will autonomously discover the Analyzer, pay for its");
  console.log("  service via on-chain escrow, and return a final recommendation.\n");

  const researcher = spawn("npx", ["tsx", "src/index.ts"], {
    cwd: RESEARCHER_DIR,
    stdio: "inherit",
    env: { ...process.env },
  });

  await new Promise<void>((resolve, reject) => {
    researcher.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Researcher exited ${code}`))));
    researcher.on("error", reject);
  });

  if (analyzerAlive) analyzer.kill();

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║              Demo complete!              ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log("  Solana Explorer (devnet):");
  console.log(`    Researcher  https://explorer.solana.com/address/${researcherKp.publicKey.toBase58()}?cluster=devnet`);
  console.log(`    Analyzer    https://explorer.solana.com/address/${analyzerKp.publicKey.toBase58()}?cluster=devnet\n`);
}

main().catch((e) => {
  console.error("\n  Fatal:", e.message ?? e, "\n");
  process.exit(1);
});
