use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::SwarmError;
use crate::AgentType;

#[derive(Accounts)]
#[instruction(agent_type: AgentType, name: String)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub swarm_state: Account<'info, SwarmState>,
    
    #[account(
        init,
        payer = owner,
        space = Agent::LEN,
        seeds = [AGENT_SEED, owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn register_agent(
    ctx: Context<RegisterAgent>,
    agent_type: AgentType,
    name: String,
) -> Result<()> {
    require!(
        name.len() <= MAX_AGENT_NAME_LENGTH,
        SwarmError::AgentNameTooLong
    );

    let swarm_state = &mut ctx.accounts.swarm_state;
    
    require!(
        swarm_state.active_agents < swarm_state.max_agents,
        SwarmError::MaxAgentsReached
    );

    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;
    
    agent.owner = ctx.accounts.owner.key();
    agent.agent_type = agent_type;
    agent.name = name.clone();
    agent.reputation = INITIAL_REPUTATION;
    agent.proposals_created = 0;
    agent.votes_cast = 0;
    agent.successful_proposals = 0;
    agent.registered_at = clock.unix_timestamp;
    agent.last_active = clock.unix_timestamp;
    agent.is_active = true;
    agent.bump = ctx.bumps.agent;

    swarm_state.active_agents += 1;

    msg!("Agent registered: {} (type: {:?})", name, agent_type);

    Ok(())
}
