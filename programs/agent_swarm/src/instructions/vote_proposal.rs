use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;
use crate::VoteType;

#[derive(Accounts)]
pub struct VoteProposal<'info> {
    #[account(
        seeds = [SWARM_SEED],
        bump = swarm_state.bump
    )]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(
        mut,
        seeds = [AGENT_SEED, voter.key().as_ref()],
        bump = agent.bump,
        constraint = agent.is_active @ SwarmError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    
    pub voter: Signer<'info>,
}

pub fn vote_proposal(
    ctx: Context<VoteProposal>,
    vote: VoteType,
    reasoning: String,
) -> Result<()> {
    require!(
        reasoning.len() <= MAX_REASONING_LENGTH,
        SwarmError::ReasoningTooLong
    );

    let proposal = &mut ctx.accounts.proposal;
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
        !proposal.has_voted(&ctx.accounts.voter.key()),
        SwarmError::AlreadyVoted
    );

    let vote_weight = agent.vote_weight();
    proposal.record_vote(&ctx.accounts.voter.key(), vote.clone(), vote_weight);

    agent.votes_cast += 1;
    agent.last_active = clock.unix_timestamp;

    msg!("Vote recorded: {:?} with weight {} - {}", vote, vote_weight, reasoning);

    Ok(())
}
