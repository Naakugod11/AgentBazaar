import "dotenv/config";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const conn = new Connection(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  "confirmed"
);
const researcher = Keypair.fromSecretKey(bs58.decode(process.env.RESEARCHER_PRIVATE_KEY!));
const analyzer = Keypair.fromSecretKey(bs58.decode(process.env.ANALYZER_PRIVATE_KEY!));

async function main() {
  const before = await conn.getBalance(analyzer.publicKey);
  console.log(`Analyzer before: ${(before / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: researcher.publicKey,
      toPubkey: analyzer.publicKey,
      lamports: LAMPORTS_PER_SOL, // 1 SOL
    })
  );

  const sig = await sendAndConfirmTransaction(conn, tx, [researcher]);
  const after = await conn.getBalance(analyzer.publicKey);
  console.log(`Transferred 1 SOL — tx: ${sig}`);
  console.log(`Analyzer after:  ${(after / LAMPORTS_PER_SOL).toFixed(4)} SOL ✓`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
