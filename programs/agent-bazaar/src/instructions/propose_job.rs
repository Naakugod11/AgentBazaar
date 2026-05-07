use anchor_lang::prelude::*;

use crate::state::{AgentAccount, JobOffer};

#[derive(Accounts)]
pub struct ProposeJob<'info> {
    pub consumer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    _ctx: Context<ProposeJob>,
    _job_id: [u8; 32],
    _offer_amount: u64,
    _expiry: i64,
) -> Result<()> {
    todo!()
}
