use anchor_lang::prelude::*;

use crate::state::JobOffer;

#[derive(Accounts)]
#[instruction(job_id: [u8; 32])]
pub struct CancelExpiredJob<'info> {
    pub consumer: Signer<'info>,
}

pub fn handler(_ctx: Context<CancelExpiredJob>, _job_id: [u8; 32]) -> Result<()> {
    todo!()
}
