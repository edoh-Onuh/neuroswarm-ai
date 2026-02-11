use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;

#[derive(Accounts)]
pub struct RecordOutcome<'info> {
    #[account(
        seeds = [AGENT_SEED, executor.key().as_ref()],
        bump = agent.bump
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(
        constraint = proposal.executed @ SwarmError::VotingInProgress
    )]
    pub proposal: Account<'info, Proposal>,
    
    #[account(
        init,
        payer = executor,
        space = Outcome::LEN,
        seeds = [OUTCOME_SEED, proposal.key().as_ref()],
        bump
    )]
    pub outcome: Account<'info, Outcome>,
    
    #[account(mut)]
    pub executor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn record_outcome(
    ctx: Context<RecordOutcome>,
    success: bool,
    metrics: Vec<u8>,
) -> Result<()> {
    require!(
        metrics.len() <= MAX_OUTCOME_METRICS_LENGTH,
        SwarmError::ProposalDataTooLong
    );

    let outcome = &mut ctx.accounts.outcome;
    let clock = Clock::get()?;

    outcome.proposal = ctx.accounts.proposal.key();
    outcome.executed_by = ctx.accounts.executor.key();
    outcome.success = success;
    outcome.metrics = metrics;
    outcome.executed_at = clock.unix_timestamp;
    outcome.bump = ctx.bumps.outcome;

    msg!("Outcome recorded: success={}", success);

    Ok(())
}
