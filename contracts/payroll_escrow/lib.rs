use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Payro11Escrow1111111111111111111111111111111");

#[program]
pub mod payroll_escrow {
    use super::*;

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, payroll_id: String, bump: u8) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.authority = ctx.accounts.authority.key();
        escrow.payroll_id = payroll_id;
        escrow.total_amount = 0;
        escrow.is_released = false;
        escrow.bump = bump;
        Ok(())
    }

    pub fn deposit_payroll(ctx: Context<DepositPayroll>, amount: u64) -> Result<()> {
        // Transfer tokens from employer to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.employer_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.employer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        let escrow = &mut ctx.accounts.escrow_account;
        escrow.total_amount += amount;

        Ok(())
    }

    pub fn release_payment(ctx: Context<ReleasePayment>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        
        // Only authority (employer/admin) can release
        require!(ctx.accounts.authority.key() == escrow.authority, EscrowError::Unauthorized);
        require!(escrow.total_amount >= amount, EscrowError::InsufficientFunds);

        // Transfer tokens from escrow vault to employee
        let seeds = &[
            b"escrow_signer",
            escrow.to_account_info().key.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: ctx.accounts.escrow_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        escrow.total_amount -= amount;
        
        // If empty, mark as released
        if escrow.total_amount == 0 {
            escrow.is_released = true;
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(payroll_id: String, bump: u8)]
pub struct InitializeEscrow<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 50 + 8 + 1 + 1)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositPayroll<'info> {
    #[account(mut)]
    pub escrow_account: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub employer: Signer<'info>,
    #[account(mut)]
    pub employer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(mut)]
    pub escrow_account: Account<'info, EscrowAccount>,
    /// CHECK: PDA signer
    #[account(seeds = [b"escrow_signer", escrow_account.key().as_ref()], bump = escrow_account.bump)]
    pub escrow_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub employee_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowAccount {
    pub authority: Pubkey,
    pub payroll_id: String,
    pub total_amount: u64,
    pub is_released: bool,
    pub bump: u8,
}

#[error_code]
pub enum EscrowError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
}
