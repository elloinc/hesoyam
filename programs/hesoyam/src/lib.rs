use anchor_lang::prelude::*;
use solana_program::{clock::Slot, program_error::ProgramError};

use anchor_spl::token::{TokenAccount, Token};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod hesoyam {
    use super::*;

    pub fn check(ctx: Context<Check>, value: u64) -> Result<u64> {
        let balance = ctx.accounts.token_account.amount;
        if balance >= value {
            Ok(balance - value)
        } else {
            // Err(error!(Errors::InsufficientBalance))
        }
    }
}

#[derive(Accounts)]
pub struct Check<'info> {
    authority: Signer<'info>,
    token_account: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>
}

#[error_codes]
pub enum Errors {
    InsufficientBalance
}