use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;
use crate::ProposalType;

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(
        mut,
        seeds = [AGENT_SEED, proposer.key().as_ref()],
        bump = agent.bump,
        constraint = agent.is_active @ SwarmError::Unauthorized
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [PROPOSAL_SEED, swarm_state.total_proposals.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    proposal_type: ProposalType,
    data: Vec<u8>,
    description: String,
) -> Result<()> {
    require!(
        data.len() <= MAX_PROPOSAL_DATA_LENGTH,
        SwarmError::ProposalDataTooLong
    );

    require!(
        description.len() <= MAX_DESCRIPTION_LENGTH,
        SwarmError::DescriptionTooLong
    );

    let swarm_state = &mut ctx.accounts.swarm_state;
    let agent = &mut ctx.accounts.agent;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    proposal.proposer = ctx.accounts.proposer.key();
    proposal.proposal_type = proposal_type;
    proposal.data = data;
    proposal.description = description.clone();
    proposal.created_at = clock.unix_timestamp;
    proposal.expires_at = clock.unix_timestamp
        .checked_add(swarm_state.proposal_timeout)
        .ok_or(SwarmError::ArithmeticOverflow)?;
    proposal.executed = false;
    proposal.executed_at = 0;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.votes_abstain = 0;
    proposal.weighted_votes_for = 0;
    proposal.weighted_votes_against = 0;
    proposal.total_voters = 0;
    proposal.voters = Vec::new();
    proposal.bump = ctx.bumps.proposal;

    swarm_state.total_proposals += 1;
    agent.proposals_created += 1;
    agent.last_active = clock.unix_timestamp;

    msg!("Proposal created: {}", description);

    Ok(())
}
