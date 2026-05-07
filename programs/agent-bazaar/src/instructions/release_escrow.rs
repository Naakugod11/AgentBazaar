use anchor_lang::prelude::*;

use crate::state::JobOffer;

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    pub provider: Signer<'info>,
}

pub fn handler(
    _ctx: Context<ReleaseEscrow>,
    _job_id: [u8; 32],
    _result_hash: [u8; 32],
) -> Result<()> {
    todo!()
}
