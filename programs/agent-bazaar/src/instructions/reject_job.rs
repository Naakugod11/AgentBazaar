use anchor_lang::prelude::*;

use crate::state::JobOffer;

#[derive(Accounts)]
#[instruction(job_id: [u8; 32])]
pub struct RejectJob<'info> {
    pub provider: Signer<'info>,
}

pub fn handler(_ctx: Context<RejectJob>, _job_id: [u8; 32]) -> Result<()> {
    todo!()
}
