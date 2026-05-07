use anchor_lang::prelude::*;

#[error_code]
pub enum AgentBazaarError {
    /// propose_job: name/capability/endpoint strings exceed defined limits.
    #[msg("Agent name exceeds 32 characters")]
    NameTooLong,

    #[msg("Capability string exceeds 64 characters")]
    CapabilityTooLong,

    #[msg("Endpoint string exceeds 128 characters")]
    EndpointTooLong,

    /// accept_job: signer is not the provider listed in the JobOffer.
    /// (Anchor's has_one constraint fires this automatically when used with
    /// `constraint = ... @ AgentBazaarError::InvalidProvider`, but we also
    /// keep it for explicit manual checks.)
    #[msg("Signer is not the provider for this job")]
    InvalidProvider,

    /// accept_job / release_escrow: wrong status transition.
    #[msg("Job has already been accepted")]
    JobAlreadyAccepted,

    #[msg("Job is not in Accepted state")]
    JobNotAccepted,

    #[msg("Job is not in Proposed state")]
    JobNotProposed,

    /// accept_job: the offer window has closed.
    #[msg("Job offer has expired")]
    JobExpired,

    /// accept_job: consumer token account balance is below offer_amount.
    #[msg("Consumer has insufficient USDC balance")]
    InsufficientFunds,

    /// cancel_expired_job: called before expiry has passed.
    #[msg("Job offer has not expired yet")]
    JobNotExpired,
}
