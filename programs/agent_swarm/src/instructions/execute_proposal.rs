use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(
        mut,
        seeds = [AGENT_SEED, executor.key().as_ref()],
        bump = agent.bump,
        constraint = agent.is_active @ SwarmError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    
    pub executor: Signer<'info>,
}

pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let swarm_state = &mut ctx.accounts.swarm_state;
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    require!(
        !proposal.executed,
        SwarmError::ProposalAlreadyExecuted
    );

    require!(
        !proposal.is_expired(clock.unix_timestamp),
        SwarmError::ProposalExpired
    );

    require!(
        proposal.has_quorum(swarm_state.min_votes_required, swarm_state.active_agents),
        SwarmError::InsufficientVotes
    );

    require!(
        proposal.is_approved(),
        SwarmError::InsufficientVotes
    );

    proposal.executed = true;
    proposal.executed_at = clock.unix_timestamp;

    swarm_state.executed_proposals += 1;
    agent.last_active = clock.unix_timestamp;

    msg!("Proposal executed successfully");
    msg!("Votes: {} for, {} against (weighted: {} vs {})", 
        proposal.votes_for, 
        proposal.votes_against,
        proposal.weighted_votes_for,
        proposal.weighted_votes_against
    );

    Ok(())
}
