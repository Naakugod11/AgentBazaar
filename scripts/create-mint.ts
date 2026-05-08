/**
 * scripts/create-mint.ts
 *
 * Creates a devnet SPL Token mint with 6 decimals (same as real USDC).
 * The researcher keypair acts as mint authority so the same wallet can top
 * up balances during development without needing a separate authority key.
 *
 * Run:  npx tsx scripts/create-mint.ts
 *
 * Reads:  RESEARCHER_PRIVATE_KEY, SOLANA_RPC_URL   (from .env)
 * Writes: USDC_MINT=<address>                      (into .env)
 */

import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const ENV_PATH = path.resolve(process.cwd(), ".env");

if (!process.env.RESEARCHER_PRIVATE_KEY) {
  console.error("❌  RESEARCHER_PRIVATE_KEY is not set in .env");
  process.exit(1);
}

const authority = Keypair.fromSecretKey(
  bs58.decode(process.env.RESEARCHER_PRIVATE_KEY)
);
const connection = new Connection(RPC_URL, "confirmed");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function explorerLink(type: "address" | "tx", value: string): string {
  return `https://explorer.solana.com/${type}/${value}?cluster=devnet`;
}

function updateEnv(key: string, value: string): void {
  const raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : "";
  const lines = raw.split("\n");
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx >= 0) {
    lines[idx] = `${key}=${value}`;
  } else {
    lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(ENV_PATH, lines.join("\n"));
}

// ─── Airdrop with retry ───────────────────────────────────────────────────────
// The public devnet RPC rate-limits airdrops. We try 3 times, then fall back
// to the Solana CLI command, then tell the user to use faucet.solana.com.

async function airdropWithRetry(pubkey: PublicKey, lamports = 2 * LAMPORTS_PER_SOL): Promise<void> {
  const pubStr = pubkey.toBase58();
  console.log(`Balance low — airdropping 2 SOL to ${pubStr.slice(0, 8)}...`);

  // Try via RPC (3 attempts, 3s apart)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, lamports);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      });
      console.log(`Airdrop confirmed ✓`);
      return;
    } catch (e: unknown) {
      console.log(`  Attempt ${attempt}/3 failed: ${(e as Error).message?.slice(0, 60)}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // Fall back to Solana CLI if available
  try {
    const { execSync } = await import("child_process");
    console.log("  Trying Solana CLI airdrop...");
    execSync(`solana airdrop 2 ${pubStr} --url devnet`, { stdio: "pipe" });
    console.log("  CLI airdrop succeeded ✓");
    return;
  } catch {
    // CLI not available or also failed
  }

  // Give up and instruct the user
  console.error(`\n❌  Airdrop failed. Please fund the wallet manually:`);
  console.error(`    https://faucet.solana.com  →  paste: ${pubStr}`);
  console.error(`    or run: solana airdrop 2 ${pubStr} --url devnet`);
  console.error(`    Then re-run: npm run create-mint\n`);
  process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── create-mint.ts ───────────────────────────────");
  console.log(`Authority: ${authority.publicKey.toBase58()}`);
  console.log(`RPC:       ${RPC_URL}`);

  // Ensure authority has SOL to pay rent + fees.
  const balance = await connection.getBalance(authority.publicKey);
  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    await airdropWithRetry(authority.publicKey);
  } else {
    console.log(`Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL ✓`);
  }

  // Create a new mint. 6 decimals = same as real USDC.
  console.log("\nCreating mint...");
  const mint = await createMint(
    connection,
    authority,        // fee payer
    authority.publicKey, // mint authority
    null,             // freeze authority (none)
    6                 // decimals
  );
  console.log(`Mint address: ${mint.toBase58()}`);
  console.log(`Explorer:     ${explorerLink("address", mint.toBase58())}`);

  // Create ATA for authority and mint 1000 tokens.
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    authority.publicKey
  );

  const mintSig = await mintTo(
    connection,
    authority,
    mint,
    ata.address,
    authority,
    1_000_000_000 // 1000 tokens × 10^6 (6 decimals)
  );
  console.log(`\nMinted 1000 mock-USDC → ${ata.address.toBase58()}`);
  console.log(`Mint tx: ${explorerLink("tx", mintSig)}`);

  const account = await getAccount(connection, ata.address);
  console.log(
    `Authority ATA balance: ${Number(account.amount) / 1_000_000} mock-USDC`
  );

  // Persist mint address into .env.
  updateEnv("USDC_MINT", mint.toBase58());
  console.log(`\n✅  USDC_MINT written to .env: ${mint.toBase58()}`);
}

main().catch((e) => {
  console.error("Fatal:", e.message ?? e);
  process.exit(1);
});
