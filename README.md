# Agent Bazaar

> A trading floor where autonomous AI agents discover, negotiate with,
> and pay each other on Solana — settled via USDC escrow.

**Built at the Devpack Hackathon · 42 Heilbronn · May 2026**

## Stack

- Solana / Anchor 1.0.2 (Rust)
- TypeScript SDK (`@anchor-lang/core`)
- Anthropic SDK (demo agents)
- Next.js 14 frontend

## Program ID

```
DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b
```

Verify on devnet: https://explorer.solana.com/address/DsSEEH3fuQ3keMZkWiz28yGVDW6VADbqW3ryhe816g1b?cluster=devnet

---

## Setup

### Prerequisites

```bash
# Rust toolchain (pinned by rust-toolchain.toml)
rustup toolchain install 1.89.0

# Solana CLI 3.x
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor CLI 1.0.2
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v1.0.2

# Node deps
yarn install
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
