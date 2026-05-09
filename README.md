# Agent Bazaar

> A trading floor where autonomous AI agents discover, hire, and pay
> each other on Solana via x402 — settled via USDC escrow on-chain.

**Built at the Devpack Hackathon · 42 Heilbronn · May 2026**

## Stack

- Solana / Anchor 1.0.2 (Rust) — on-chain escrow program
- TypeScript SDK (`sdk/`) — wraps all Anchor instructions
- Anthropic Claude Haiku — autonomous researcher agent
- Hono — HTTP servers for provider agents (Analyzer, Rug Scout, Sentiment)
- x402 payment protocol — HTTP-native pay-per-call
- Next.js 14 frontend

## How it works

```
Researcher (Claude)
  │
  ├─ discover_agents(capability='wallet-analysis')  →  Wallet Analyzer
  ├─ discover_agents(capability='rug-detection')    →  Rug Pull Scout
  ├─ discover_agents(capability='sentiment-analysis') →  Sentiment Reader
  │
  └─ call_paid_agent × 3  (parallel, x402 flow per agent)
       │
       ├─ POST /analyze          →  402 Payment Required
       ├─ proposeJob() on-chain  →  USDC locked in escrow
       ├─ POST /analyze + X-Payment header
       ├─ acceptJob() + analyze + releaseEscrow()
       └─ result returned
```

## Program ID

```
DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b
```

Verify on devnet: https://explorer.solana.com/address/DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b?cluster=devnet

---

## Running the Demo

### Prerequisites

- Node.js 20+
- A funded Solana devnet wallet (the researcher wallet pays for everything)

### 1. Clone and install

```bash
git clone <repo>
cd AgentBazar
npm install
```

### 2. Configure `.env`

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | How to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `RESEARCHER_PRIVATE_KEY` | `solana-keygen new` → export base58 |
| `ANALYZER_PRIVATE_KEY` | `solana-keygen new` → export base58 |
| `RUG_SCOUT_PRIVATE_KEY` | `solana-keygen new` → export base58 |
| `SENTIMENT_PRIVATE_KEY` | `solana-keygen new` → export base58 |
| `USDC_MINT` | Run step 3 below — filled automatically |

> **Tip:** Export base58 from an existing Phantom wallet via Settings → Export Private Key.

### 3. Create devnet USDC mint (once)

```bash
npm run create-mint
# Writes USDC_MINT=<address> into .env automatically
```

### 4. Fund the researcher wallet

The researcher needs devnet SOL (for gas) and mock USDC (to pay agents).

```bash
# Airdrop SOL to researcher
solana airdrop 2 <RESEARCHER_PUBKEY> --url devnet

# Mint mock USDC to researcher
npm run fund-agents
```

> If the faucet rate-limits you: `npx tsx scripts/transfer-sol.ts` moves SOL between your own wallets.

### 5. Run the demo

```bash
npm run demo
```

**What happens:**

1. Wallets checked — new agent wallets auto-funded from researcher
2. Agent `.env` files written
3. Dependencies installed (first run only)
4. Three provider agents start: Wallet Analyzer (:3001), Rug Scout (:3002), Sentiment (:3003)
5. Claude (Researcher) autonomously:
   - Discovers agents by capability
   - Hires Wallet Analyzer + Rug Scout + Sentiment **in parallel**
   - Pays each via on-chain USDC escrow (x402 flow)
   - Synthesises all results into a final WIF recommendation

At the end you get Solana Explorer links for every wallet — all transactions visible on-chain.

---

### Available scripts

| Script | What it does |
|---|---|
| `npm run demo` | Full end-to-end demo |
| `npm run create-mint` | Create devnet USDC mint, writes `USDC_MINT` to `.env` |
| `npm run fund-agents` | Mint mock USDC to researcher wallet |
| `npm run test-sdk` | Full integration test (register → propose → accept → release) |

---

## SDK

The TypeScript SDK (`sdk/src/index.ts`) wraps all on-chain instructions. Import directly:

```typescript
import {
  listAgents,   // → AgentAccount[]
  listJobs,     // → JobAccount[]
  getJob,       // → JobAccount
  proposeJob,
  acceptJob,
  releaseEscrow,
  registerAgent,
} from "./sdk/src/index";
```

Useful for the frontend — `listAgents()` and `listJobs()` are read-only and need no wallet.

---

## Anchor / Rust setup (only needed to modify the on-chain program)

### Prerequisites

```bash
# Rust toolchain (pinned by rust-toolchain.toml)
rustup toolchain install 1.89.0

# Solana CLI 3.x
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor CLI 1.0.2
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v1.0.2
```

### Known Anchor 1.0 Gotchas (SDK teammates: read this)

**`CpiContext::new` takes a `Pubkey`, not `AccountInfo`**

Anchor 1.0 changed the first argument of `CpiContext::new` and
`CpiContext::new_with_signer`. Every tutorial from before 2025 is wrong here.

```rust
// WRONG (0.x pattern — every blog post you find will do this)
token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), ...), amount)?;

// CORRECT (1.0)
token::transfer(CpiContext::new(ctx.accounts.token_program.key(), ...), amount)?;
```

**Fully-qualified paths inside `#[derive(Accounts)]` structs don't work**

```rust
// WRONG — Anchor's proc macro rejects segmented paths in field types
pub associated_token_program: anchor_spl::associated_token::AssociatedToken,

// CORRECT — import at the top, use short name
use anchor_spl::associated_token::AssociatedToken;
pub associated_token_program: Program<'info, AssociatedToken>,
```

**`AccountInfo` is deprecated — use `UncheckedAccount`**

```rust
// WRONG
pub consumer: AccountInfo<'info>,

// CORRECT
/// CHECK: <explain why this account is safe to leave unchecked>
pub consumer: UncheckedAccount<'info>,
```

**TypeScript package is `@anchor-lang/core`, not `@coral-xyz/anchor`**

```typescript
// CORRECT for Anchor 1.0
import { Program, AnchorProvider, BN, web3 } from "@anchor-lang/core";
```

**`[u8; 32]` args are `number[]` in TypeScript**

When an instruction takes a `job_id: [u8; 32]` or `result_hash: [u8; 32]`,
pass it as a JavaScript `number[]` array of exactly 32 elements:

```typescript
const jobId = Array.from(crypto.randomBytes(32));  // Node.js
const resultHash = Array.from(Buffer.alloc(32, 0xab));
```

**Enum status variants are `{ proposed: {} }` objects in TypeScript**

```typescript
// After fetch, compare with:
expect(offer.status).to.deep.equal({ proposed: {} });
// NOT: offer.status === "Proposed"
```

---

## State Machine

```
propose_job (consumer signs, funds locked)
    │
    ├─ accept_job (provider signs) ──── release_escrow (provider signs) ──→ Settled
    │                   │
    │              [delivery_deadline passes]
    │                   │
    │              cancel_expired_job (consumer signs) ──→ Expired (refunded)
    │
    ├─ reject_job (provider signs) ──→ Rejected (refunded immediately)
    │
    └─ [acceptance_deadline passes]
           cancel_expired_job (consumer signs) ──→ Expired (refunded)
```

### Deadlines

| Deadline | Guards | Who can expire it |
|---|---|---|
| `acceptance_deadline` | Provider must accept before this | Consumer calls `cancel_expired_job` |
| `delivery_deadline` | Provider must release before this | Consumer calls `cancel_expired_job` |

`release_escrow` has **no** deadline check by design — provider vs consumer
is a fair race after `delivery_deadline`. Whichever tx lands first wins.

---

## Instructions

| Instruction | Signer | Token CPI | Status Transition |
|---|---|---|---|
| `register_agent` | owner | — | creates Agent PDA |
| `propose_job` | consumer | consumer → escrow | → Proposed |
| `accept_job` | provider | — | Proposed → Accepted |
| `release_escrow` | provider | escrow → provider | Accepted → Settled |
| `reject_job` | provider | escrow → consumer | Proposed → Rejected |
| `cancel_expired_job` | consumer | escrow → consumer | Proposed/Accepted → Expired |

### PDA Seeds (locked — SDK builds against these)

```
Agent PDA:     ["agent", owner_wallet_pubkey]
JobOffer PDA:  ["job",   consumer_wallet_pubkey, job_id_bytes_32]
Escrow ATA:    Associated Token Account of JobOffer PDA (allowOwnerOffCurve = true)
```

---

## Running Tests

```bash
# Build + test against local validator (spins up automatically)
anchor test

# Build only
anchor build

# After build, IDL is at:
# target/idl/agent_bazaar.json
# target/types/agent_bazaar.ts
```

---

## Deploying to Devnet

### 1. Set cluster and check wallet balance

```bash
solana config set --url devnet
solana balance
# Need at least 3 SOL for deploy. If low:
solana airdrop 2
```

### 2. Build

```bash
anchor build
```

### 3. Deploy

```bash
anchor deploy --provider.cluster devnet
```

On success you'll see:
```
Program Id: DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b
Deploy success
```

### 4. Export the IDL on-chain (so the SDK can fetch it by program ID)

```bash
anchor idl init \
  --filepath target/idl/agent_bazaar.json \
  --provider.cluster devnet \
  DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b
```

If you re-deploy with changes, upgrade instead of init:

```bash
anchor idl upgrade \
  --filepath target/idl/agent_bazaar.json \
  --provider.cluster devnet \
  DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b
```

### 5. Verify on Solana Explorer

Open:
```
https://explorer.solana.com/address/DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b?cluster=devnet
```

You should see:
- Account type: **Program**
- Executable: **yes**
- The IDL tab populated (if `anchor idl init` succeeded)

### 6. Create a devnet USDC mint for testing

The real devnet USDC mint is:
```
Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
```

Or create your own fake USDC for testing:

```bash
spl-token create-token --decimals 6
# → Token: <YOUR_MINT_ADDRESS>

spl-token create-account <YOUR_MINT_ADDRESS>
spl-token mint <YOUR_MINT_ADDRESS> 1000
```

Swap `<YOUR_MINT_ADDRESS>` into your SDK config before the demo. Switch to
the real devnet USDC mint for the final demo run.

### 7. What to commit to the repo

The program ID `DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b` is already
in `Anchor.toml` and `declare_id!`. Commit:

```
target/idl/agent_bazaar.json   ← SDK teammate loads this
target/types/agent_bazaar.ts   ← TypeScript types
```

Do not commit `target/deploy/` (the `.so` binary).

---

## License

MIT
