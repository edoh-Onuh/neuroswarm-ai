use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// CPI Helper for cross-program invocations
pub struct CPIHelper;

impl CPIHelper {
    /// Execute SPL token transfer via CPI
    pub fn transfer_tokens<'info>(
        from: &Account<'info, TokenAccount>,
        to: &Account<'info, TokenAccount>,
        authority: &AccountInfo<'info>,
        token_program: &Program<'info, Token>,
        amount: u64,
        signer_seeds: &[&[&[u8]]],
    ) -> Result<()> {
        let cpi_accounts = Transfer {
            from: from.to_account_info(),
            to: to.to_account_info(),
            authority: authority.clone(),
        };
        
        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
    
    /// Execute Jupiter swap via CPI
    /// Note: Actual Jupiter CPI requires their program ID and instruction format
    pub fn jupiter_swap<'info>(
        user: &AccountInfo<'info>,
        source_token: &Account<'info, TokenAccount>,
        destination_token: &Account<'info, TokenAccount>,
        jupiter_program: &AccountInfo<'info>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        msg!("CPI: Initiating Jupiter swap");
        msg!("  Amount in: {}", amount_in);
        msg!("  Minimum out: {}", minimum_amount_out);
        
        // In production, would construct actual Jupiter CPI call
        // For now, this is a framework placeholder
        Ok(())
    }
    
    /// Execute Orca swap via CPI
    pub fn orca_swap<'info>(
        user: &AccountInfo<'info>,
        source_token: &Account<'info, TokenAccount>,
        destination_token: &Account<'info, TokenAccount>,
        pool_account: &AccountInfo<'info>,
        orca_program: &AccountInfo<'info>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        msg!("CPI: Initiating Orca swap");
        msg!("  Amount in: {}", amount_in);
        msg!("  Minimum out: {}", minimum_amount_out);
        
        // In production, would construct actual Orca CPI call
        Ok(())
    }
    
    /// Execute Raydium swap via CPI
    pub fn raydium_swap<'info>(
        user: &AccountInfo<'info>,
        source_token: &Account<'info, TokenAccount>,
        destination_token: &Account<'info, TokenAccount>,
        pool_account: &AccountInfo<'info>,
        raydium_program: &AccountInfo<'info>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        msg!("CPI: Initiating Raydium swap");
        msg!("  Amount in: {}", amount_in);
        msg!("  Minimum out: {}", minimum_amount_out);
        
        // In production, would construct actual Raydium CPI call
        Ok(())
    }
    
    /// Execute generic protocol interaction via CPI
    pub fn execute_protocol_call<'info>(
        user: &AccountInfo<'info>,
        target_program: &AccountInfo<'info>,
        instruction_data: Vec<u8>,
        accounts: Vec<AccountInfo<'info>>,
    ) -> Result<()> {
        msg!("CPI: Executing generic protocol call");
        msg!("  Target program: {}", target_program.key());
        msg!("  Instruction size: {} bytes", instruction_data.len());
        
        // Generic CPI framework for any Solana program
        // Agents can propose CPI calls to any protocol
        Ok(())
    }
}

/// Whirlpool (Orca) integration helpers
pub mod whirlpool {
    use super::*;
    
    pub fn get_whirlpool_program_id() -> Pubkey {
        // Orca Whirlpool program ID
        Pubkey::from_str("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc").unwrap()
    }
}

/// Raydium integration helpers
pub mod raydium {
    use super::*;
    
    pub fn get_raydium_v4_program_id() -> Pubkey {
        // Raydium AMM V4 program ID
        Pubkey::from_str("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8").unwrap()
    }
}

/// Jupiter integration helpers
pub mod jupiter {
    use super::*;
    
    pub fn get_jupiter_v6_program_id() -> Pubkey {
        // Jupiter V6 aggregator program ID
        Pubkey::from_str("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4").unwrap()
    }
}
