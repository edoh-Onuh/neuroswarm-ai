use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = SwarmState::LEN,
        seeds = [SWARM_SEED],
        bump
    )]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    max_agents: u8,
    min_votes_required: u8,
    proposal_timeout: i64,
) -> Result<()> {
    require!(
        max_agents >= MIN_AGENTS && max_agents <= MAX_AGENTS,
        SwarmError::InvalidVoteCount
    );

    require!(
        min_votes_required >= (max_agents as f32 * 0.51) as u8,
        SwarmError::MinAgentsNotMet
    );

    require!(
        proposal_timeout >= MIN_PROPOSAL_TIMEOUT && proposal_timeout <= MAX_PROPOSAL_TIMEOUT,
        SwarmError::InvalidProposalTimeout
    );

    let swarm_state = &mut ctx.accounts.swarm_state;
    
    swarm_state.authority = ctx.accounts.authority.key();
    swarm_state.max_agents = max_agents;
    swarm_state.active_agents = 0;
    swarm_state.min_votes_required = min_votes_required;
    swarm_state.proposal_timeout = proposal_timeout;
    swarm_state.total_proposals = 0;
    swarm_state.executed_proposals = 0;
    swarm_state.bump = ctx.bumps.swarm_state;

    msg!("Agent Swarm initialized with max_agents: {}, min_votes: {}", max_agents, min_votes_required);

    Ok(())
}
