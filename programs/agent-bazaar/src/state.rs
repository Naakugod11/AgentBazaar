use anchor_lang::prelude::*;

use crate::constants::{MAX_CAPABILITY_LEN, MAX_ENDPOINT_LEN, MAX_NAME_LEN};

// ─── Agent ───────────────────────────────────────────────────────────────────

#[account]
pub struct AgentAccount {
    /// The wallet that registered this agent — also the PDA seed.
    pub owner: Pubkey,
    /// Human-readable name, max 32 bytes.
    pub name: String,
    /// What this agent does, max 64 bytes.
    pub capability: String,
    /// HTTP(S) endpoint the agent listens on, max 128 bytes.
    pub endpoint: String,
    /// Suggested USDC price in micro-USDC (6 decimals), e.g. 1_000_000 = $1.
    pub price_hint: u64,
    /// Saved so we can use it as a signer seed without re-deriving.
    pub bump: u8,
}

impl AgentAccount {
    // 8 discriminator
    // 32 owner
    // (4 + MAX_NAME_LEN) name
    // (4 + MAX_CAPABILITY_LEN) capability
    // (4 + MAX_ENDPOINT_LEN) endpoint
    // 8 price_hint
    // 1 bump
    pub const SPACE: usize =
        8 + 32 + (4 + MAX_NAME_LEN) + (4 + MAX_CAPABILITY_LEN) + (4 + MAX_ENDPOINT_LEN) + 8 + 1;
    // = 285
}

// ─── Job ─────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobStatus {
    Proposed,
    Accepted,
    Settled,
    Cancelled,
}

#[account]
pub struct JobOffer {
    /// Wallet that called propose_job.
    pub consumer: Pubkey,
    /// Wallet of the provider agent's owner (not the agent PDA).
    pub provider: Pubkey,
    /// Caller-supplied 32-byte hash that uniquely identifies this job.
    /// Also used as a PDA seed, so uniqueness is enforced by PDA collision.
    pub job_id: [u8; 32],
    /// Amount of USDC (6 decimals) locked in escrow.
    pub offer_amount: u64,
    /// Unix timestamp after which the offer is considered expired.
    pub expiry: i64,
    pub status: JobStatus,
    /// Hash of delivered work, written by release_escrow.
    pub result_hash: Option<[u8; 32]>,
    pub bump: u8,
}

impl JobOffer {
    // 8  discriminator
    // 32 consumer
    // 32 provider
    // 32 job_id ([u8;32] — no length prefix, fixed array)
    // 8  offer_amount
    // 8  expiry
    // 1  status (fieldless enum → u8 variant tag)
    // 33 result_hash (Option<[u8;32]> → 1 tag byte + 32 payload)
    // 1  bump
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 33 + 1;
    // = 155
}
