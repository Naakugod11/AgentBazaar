use anchor_lang::prelude::*;

use crate::state::AgentAccount;

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    _ctx: Context<RegisterAgent>,
    _name: String,
    _capability: String,
    _endpoint: String,
    _price_hint: u64,
) -> Result<()> {
    todo!()
}
