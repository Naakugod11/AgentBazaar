/**
 * scripts/fund-agents.ts
 *
 * Ensures both agents have:
 *   - SOL (airdrops if below threshold)
 *   - An ATA for the mock-USDC mint
 *
 * Then mints 50 mock-USDC to the researcher (consumer).
 * The analyzer does not need pre-funded USDC — it earns it via released escrow.
 *
 * Run:  npx tsx scripts/fund-agents.ts
 *
 * Requires: USDC_MINT, RESEARCHER_PRIVATE_KEY, ANALYZER_PRIVATE_KEY in .env
 */

import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

const missing = ["USDC_MINT", "RESEARCHER_PRIVATE_KEY", "ANALYZER_PRIVATE_KEY"].filter(
  (k) => !process.env[k]
);
if (missing.length > 0) {
  console.error(`❌  Missing env vars: ${missing.join(", ")}`);
  console.error("   Run scripts/create-mint.ts first, then fill in the private keys.");
  process.exit(1);
}

const usdcMint = new PublicKey(process.env.USDC_MINT!);
const researcher = Keypair.fromSecretKey(bs58.decode(process.env.RESEARCHER_PRIVATE_KEY!));
const analyzer = Keypair.fromSecretKey(bs58.decode(process.env.ANALYZER_PRIVATE_KEY!));
const connection = new Connection(RPC_URL, "confirmed");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function airdropWithRetry(pubkey: PublicKey, label: string): Promise<void> {
  const pubStr = pubkey.toBase58();
  console.log(`  ${label}: balance low — airdropping 2 SOL...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      });
      const after = await connection.getBalance(pubkey);
      console.log(`  ${label}: ${(after / LAMPORTS_PER_SOL).toFixed(4)} SOL ✓`);
      return;
    } catch (e: unknown) {
      console.log(`    Attempt ${attempt}/3 failed: ${(e as Error).message?.slice(0, 60)}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Solana CLI fallback
  try {
    const { execSync } = await import("child_process");
    execSync(`solana airdrop 2 ${pubStr} --url devnet`, { stdio: "pipe" });
    const after = await connection.getBalance(pubkey);
    console.log(`  ${label}: ${(after / LAMPORTS_PER_SOL).toFixed(4)} SOL (via CLI) ✓`);
    return;
  } catch { /* fall through */ }

  console.error(`\n❌  Airdrop failed for ${label}.`);
  console.error(`    Fund manually: https://faucet.solana.com  →  ${pubStr}`);
  console.error(`    or: solana airdrop 2 ${pubStr} --url devnet`);
  process.exit(1);
}

async function ensureSol(kp: Keypair, label: string): Promise<void> {
  const balance = await connection.getBalance(kp.publicKey);
  if (balance >= 0.1 * LAMPORTS_PER_SOL) {
    console.log(`  ${label}: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL ✓`);
    return;
  }
  await airdropWithRetry(kp.publicKey, label);
}

async function getUsdcBalance(ata: PublicKey): Promise<number> {
  try {
    const acc = await getAccount(connection, ata);
    return Number(acc.amount) / 1_000_000;
  } catch {
    return 0;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── fund-agents.ts ───────────────────────────────");
  console.log(`USDC mint:  ${usdcMint.toBase58()}`);
  console.log(`Researcher: ${researcher.publicKey.toBase58()}`);
  console.log(`Analyzer:   ${analyzer.publicKey.toBase58()}`);
  console.log(`RPC:        ${RPC_URL}`);

  // ── 1. SOL balances ────────────────────────────────────────────────────────
  console.log("\nChecking SOL balances...");
  // Airdrop sequentially to avoid rate-limiting.
  await ensureSol(researcher, "researcher");
  await ensureSol(analyzer, "analyzer");

  // ── 2. Create ATAs if needed ───────────────────────────────────────────────
  // Researcher pays for ATA creation (they're already funded with SOL).
  console.log("\nCreating ATAs...");

  const researcherAta = await getOrCreateAssociatedTokenAccount(
    connection,
    researcher, // payer
    usdcMint,
    researcher.publicKey
  );
  console.log(`  Researcher ATA: ${researcherAta.address.toBase58()} ✓`);

  // Analyzer ATA — researcher pays creation cost so analyzer doesn't need SOL upfront.
  const analyzerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    researcher, // payer (researcher covers this small rent cost)
    usdcMint,
    analyzer.publicKey
  );
  console.log(`  Analyzer ATA:   ${analyzerAta.address.toBase58()} ✓`);

  // ── 3. Mint 50 mock-USDC to researcher ────────────────────────────────────
  // Researcher is the mint authority (set in create-mint.ts), so they can mint freely.
  console.log("\nMinting 50 mock-USDC to researcher...");
  const mintSig = await mintTo(
    connection,
    researcher, // payer
    usdcMint,
    researcherAta.address,
    researcher, // mint authority
    50_000_000  // 50 × 10^6
  );
  console.log(`  Mint tx: ${mintSig}`);

  // ── 4. Final balances ──────────────────────────────────────────────────────
  console.log("\nFinal balances:");

  const [researcherUsdc, analyzerUsdc] = await Promise.all([
    getUsdcBalance(researcherAta.address),
    getUsdcBalance(analyzerAta.address),
  ]);

  const researcherSol = await connection.getBalance(researcher.publicKey);
  const analyzerSol = await connection.getBalance(analyzer.publicKey);

  console.log(
    `  Researcher: ${(researcherSol / LAMPORTS_PER_SOL).toFixed(4)} SOL | ${researcherUsdc.toFixed(4)} mock-USDC`
  );
  console.log(
    `  Analyzer:   ${(analyzerSol / LAMPORTS_PER_SOL).toFixed(4)} SOL | ${analyzerUsdc.toFixed(4)} mock-USDC`
  );

  console.log("\n✅  Agents funded. Ready to run the demo.");
}

main().catch((e) => {
  console.error("Fatal:", e.message ?? e);
  process.exit(1);
});
