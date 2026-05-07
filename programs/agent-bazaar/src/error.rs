use anchor_lang::prelude::*;

#[error_code]
pub enum AgentBazaarError {
    // ── Registration ──────────────────────────────────────────────────────────
    #[msg("Agent name exceeds 32 characters")]
    NameTooLong,

    #[msg("Capability string exceeds 64 characters")]
    CapabilityTooLong,

    #[msg("Endpoint string exceeds 128 characters")]
    EndpointTooLong,

    // ── Offer validation ──────────────────────────────────────────────────────
    #[msg("Offer amount must be greater than zero")]
    ZeroAmount,

    #[msg("Expiry must be in the future")]
    ExpiryInPast,

    // ── Authorization ─────────────────────────────────────────────────────────
    /// Fires when the signer is not the provider stored in the JobOffer.
    /// Also used as the target of `has_one = provider @ AgentBazaarError::InvalidProvider`.
    #[msg("Signer is not the provider for this job")]
    InvalidProvider,

    #[msg("Signer is not the consumer for this job")]
    InvalidConsumer,

    // ── Status transitions ────────────────────────────────────────────────────
    #[msg("Job is not in Proposed state")]
    JobNotProposed,

    #[msg("Job is not in Accepted state")]
    JobNotAccepted,

    // ── Timing ────────────────────────────────────────────────────────────────
    #[msg("Job offer has expired")]
    JobExpired,

    #[msg("Job offer has not expired yet")]
    JobNotExpired,

    // ── Token ─────────────────────────────────────────────────────────────────
    #[msg("Consumer has insufficient USDC balance")]
    InsufficientFunds,
}
