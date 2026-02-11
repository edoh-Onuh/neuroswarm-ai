use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;
pub mod cpi;

use instructions::*;

declare_id!("56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK");

/// Solana Agent Swarm Intelligence Protocol
/// 
/// This program enables multiple AI agents to coordinate autonomously through
/// on-chain consensus mechanisms. Agents can propose actions, vote on proposals,
/// and execute approved strategies in a Byzantine fault-tolerant manner.
#[program]
pub mod agent_swarm {
    use super::*;

    /// Initialize the agent swarm with configuration parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        max_agents: u8,
        min_votes_required: u8,
        proposal_timeout: i64,
    ) -> Result<()> {
        instructions::initialize(ctx, max_agents, min_votes_required, proposal_timeout)
    }

    /// Register a new agent in the swarm
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_type: AgentType,
        name: String,
    ) -> Result<()> {
        instructions::register_agent(ctx, agent_type, name)
    }

    /// Create a new proposal for agent coordination
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_type: ProposalType,
        data: Vec<u8>,
        description: String,
    ) -> Result<()> {
        instructions::create_proposal(ctx, proposal_type, data, description)
    }

    /// Vote on an existing proposal
    pub fn vote_proposal(
        ctx: Context<VoteProposal>,
        vote: VoteType,
        reasoning: String,
    ) -> Result<()> {
        instructions::vote_proposal(ctx, vote, reasoning)
    }

    /// Execute an approved proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal(ctx)
    }

    /// Update agent reputation based on performance
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        performance_score: u16,
    ) -> Result<()> {
        instructions::update_reputation(ctx, performance_score)
    }

    /// Record execution outcome for learning
    pub fn record_outcome(
        ctx: Context<RecordOutcome>,
        success: bool,
        metrics: Vec<u8>,
    ) -> Result<()> {
        instructions::record_outcome(ctx, success, metrics)
    }
}

/// Agent types in the swarm
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum AgentType {
    Consensus,      // Coordinates decision-making
    Analytics,      // Analyzes data and generates insights
    Execution,      // Executes approved transactions
    RiskManagement, // Monitors and enforces risk limits
    Learning,       // Adapts strategies based on outcomes
    // Phase 2: Custom agent types
    Governance,     // Manages coalition governance
    Security,       // Monitors security threats
    Liquidity,      // Manages liquidity positions
    Arbitrage,      // Identifies arbitrage opportunities
    Custom(u8),     // Custom community-defined agent types (0-255)
}

/// Proposal types that agents can create
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    Rebalance,      // Rebalance portfolio allocation
    Trade,          // Execute a specific trade
    RiskLimit,      // Update risk parameters
    Strategy,       // Change investment strategy
    Emergency,      // Emergency action (higher priority)
}

/// Vote types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum VoteType {
    Approve,
    Reject,
    Abstain,
}
