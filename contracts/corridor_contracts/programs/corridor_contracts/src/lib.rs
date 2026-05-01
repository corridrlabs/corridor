use anchor_lang::prelude::*;

declare_id!("3CRnkccRQZvHHcyz1kit4LJ6JqxU2zFg9hkbtHdRS27u");

#[program]
pub mod corridor_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
