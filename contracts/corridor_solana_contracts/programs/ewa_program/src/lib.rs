use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("EQTCgcNGg8NJk695rgjiBvhjYUoPvm2qxwKPVfo1XaM");

#[program]
pub mod ewa_program {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_liquidity = 0;
        pool.total_borrowed = 0;
        Ok(())
    }

    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        // Transfer tokens from depositor to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        let pool = &mut ctx.accounts.pool;
        pool.total_liquidity += amount;

        Ok(())
    }

    pub fn request_advance(ctx: Context<RequestAdvance>, amount: u64) -> Result<()> {
        // Store bump before mutable borrow
        let pool_bump = ctx.accounts.pool.bump;
        let pool_key = ctx.accounts.pool.key();
        
        let pool = &mut ctx.accounts.pool;
        let advance = &mut ctx.accounts.advance_account;

        // Check liquidity
        require!(pool.total_liquidity >= amount, EwaError::InsufficientLiquidity);

        // Transfer tokens from pool vault to employee
        let seeds = &[
            b"pool_signer",
            pool_key.as_ref(),
            &[pool_bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: ctx.accounts.pool_signer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update state
        pool.total_liquidity -= amount;
        pool.total_borrowed += amount;

        advance.employee = ctx.accounts.employee.key();
        advance.amount = amount;
        advance.due_date = Clock::get()?.unix_timestamp + 30 * 24 * 60 * 60; // 30 days
        advance.is_repaid = false;

        Ok(())
    }

    pub fn repay_advance(ctx: Context<RepayAdvance>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let advance = &mut ctx.accounts.advance_account;

        require!(!advance.is_repaid, EwaError::AlreadyRepaid);
        require!(amount >= advance.amount, EwaError::InsufficientRepayment);

        // Transfer tokens from employee to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.employee_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.employee.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update state
        pool.total_liquidity += amount;
        pool.total_borrowed -= advance.amount; // Only subtract principal
        
        advance.is_repaid = true;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8 + 1)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RequestAdvance<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    /// CHECK: PDA signer
    #[account(seeds = [b"pool_signer", pool.key().as_ref()], bump = pool.bump)]
    pub pool_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(init, payer = employee, space = 8 + 32 + 8 + 8 + 1)]
    pub advance_account: Account<'info, Advance>,
    #[account(mut)]
    pub employee: Signer<'info>,
    #[account(mut)]
    pub employee_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayAdvance<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub advance_account: Account<'info, Advance>,
    #[account(mut)]
    pub employee: Signer<'info>,
    #[account(mut)]
    pub employee_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct LiquidityPool {
    pub authority: Pubkey,
    pub total_liquidity: u64,
    pub total_borrowed: u64,
    pub bump: u8,
}

#[account]
pub struct Advance {
    pub employee: Pubkey,
    pub amount: u64,
    pub due_date: i64,
    pub is_repaid: bool,
}

#[error_code]
pub enum EwaError {
    #[msg("Insufficient liquidity in the pool")]
    InsufficientLiquidity,
    #[msg("Advance already repaid")]
    AlreadyRepaid,
    #[msg("Insufficient repayment amount")]
    InsufficientRepayment,
}
