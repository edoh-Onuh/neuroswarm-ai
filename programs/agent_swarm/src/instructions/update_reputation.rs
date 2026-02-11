use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(
        seeds = [SWARM_SEED],
        bump = swarm_state.bump
    )]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(
        mut,
        seeds = [AGENT_SEED, agent.owner.as_ref()],
        bump = agent.bump
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(constraint = authority.key() == swarm_state.authority @ SwarmError::Unauthorized)]
    pub authority: Signer<'info>,
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    performance_score: u16,
) -> Result<()> {
    require!(
        performance_score <= 1000,
        SwarmError::InvalidReputationScore
    );

    let agent = &mut ctx.accounts.agent;
    let old_reputation = agent.reputation;
    
    agent.update_reputation(performance_score);
    
    let clock = Clock::get()?;
    agent.last_active = clock.unix_timestamp;

    msg!(
        "Agent reputation updated: {} -> {} (performance: {})",
        old_reputation,
        agent.reputation,
        performance_score
    );

    Ok(())
}
