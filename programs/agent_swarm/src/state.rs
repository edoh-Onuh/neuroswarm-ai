use anchor_lang::prelude::*;
use crate::{AgentType, ProposalType, VoteType};
use crate::constants::*;

/// Main swarm configuration and state
#[account]
pub struct SwarmState {
    pub authority: Pubkey,
    pub max_agents: u8,
    pub active_agents: u8,
    pub min_votes_required: u8,
    pub proposal_timeout: i64,
    pub total_proposals: u64,
    pub executed_proposals: u64,
    pub bump: u8,
}

impl SwarmState {
    pub const LEN: usize = 8 + // discriminator
        32 +  // authority
        1 +   // max_agents
        1 +   // active_agents
        1 +   // min_votes_required
        8 +   // proposal_timeout
        8 +   // total_proposals
        8 +   // executed_proposals
        1;    // bump
}

/// Individual agent registration and reputation
#[account]
pub struct Agent {
    pub owner: Pubkey,
    pub agent_type: AgentType,
    pub name: String,
    pub reputation: u16,
    pub proposals_created: u32,
    pub votes_cast: u32,
    pub successful_proposals: u32,
    pub registered_at: i64,
    pub last_active: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl Agent {
    pub const LEN: usize = 8 + // discriminator
        32 +  // owner
        1 +   // agent_type
        (4 + MAX_AGENT_NAME_LENGTH) + // name
        2 +   // reputation
        4 +   // proposals_created
        4 +   // votes_cast
        4 +   // successful_proposals
        8 +   // registered_at
        8 +   // last_active
        1 +   // is_active
        1;    // bump

    /// Calculate weighted vote based on reputation
    pub fn vote_weight(&self) -> u32 {
        // Higher reputation = more voting power
        // Base vote (1000) + bonus based on reputation
        1000 + (self.reputation as u32 * 10)
    }

    /// Update reputation after proposal outcome
    pub fn update_reputation(&mut self, performance_score: u16) {
        let new_reputation = if performance_score > 500 {
            // Good performance increases reputation
            self.reputation.saturating_add((performance_score - 500) / 10)
        } else {
            // Poor performance decreases reputation
            self.reputation.saturating_sub((500 - performance_score) / 10)
        };

        self.reputation = new_reputation.clamp(MIN_REPUTATION, MAX_REPUTATION);
    }
}

/// Proposal for agent coordination
#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub proposal_type: ProposalType,
    pub data: Vec<u8>,
    pub description: String,
    pub created_at: i64,
    pub expires_at: i64,
    pub executed: bool,
    pub executed_at: i64,
    pub votes_for: u32,
    pub votes_against: u32,
    pub votes_abstain: u32,
    pub weighted_votes_for: u64,
    pub weighted_votes_against: u64,
    pub total_voters: u8,
    pub voters: Vec<Pubkey>,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + // discriminator
        32 +  // proposer
        1 +   // proposal_type
        (4 + MAX_PROPOSAL_DATA_LENGTH) + // data
        (4 + MAX_DESCRIPTION_LENGTH) +   // description
        8 +   // created_at
        8 +   // expires_at
        1 +   // executed
        8 +   // executed_at
        4 +   // votes_for
        4 +   // votes_against
        4 +   // votes_abstain
        8 +   // weighted_votes_for
        8 +   // weighted_votes_against
        1 +   // total_voters
        (4 + 32 * 20) + // voters (max 20 agents)
        1;    // bump

    /// Check if proposal has reached quorum
    pub fn has_quorum(&self, min_votes: u8, total_agents: u8) -> bool {
        self.total_voters >= min_votes && 
        self.total_voters as f32 >= (total_agents as f32 * 0.51) // Need majority
    }

    /// Check if proposal is approved (weighted voting)
    pub fn is_approved(&self) -> bool {
        // Weighted votes for must exceed votes against
        self.weighted_votes_for > self.weighted_votes_against &&
        self.votes_for > self.votes_against
    }

    /// Check if proposal is expired
    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.expires_at
    }

    /// Check if agent has already voted
    pub fn has_voted(&self, agent: &Pubkey) -> bool {
        self.voters.contains(agent)
    }

    /// Record a vote
    pub fn record_vote(&mut self, agent: &Pubkey, vote: VoteType, weight: u32) {
        match vote {
            VoteType::Approve => {
                self.votes_for += 1;
                self.weighted_votes_for += weight as u64;
            }
            VoteType::Reject => {
                self.votes_against += 1;
                self.weighted_votes_against += weight as u64;
            }
            VoteType::Abstain => {
                self.votes_abstain += 1;
            }
        }
        
        self.voters.push(*agent);
        self.total_voters += 1;
    }
}

/// Execution outcome for learning
#[account]
pub struct Outcome {
    pub proposal: Pubkey,
    pub executed_by: Pubkey,
    pub success: bool,
    pub metrics: Vec<u8>,
    pub executed_at: i64,
    pub bump: u8,
}

impl Outcome {
    pub const LEN: usize = 8 + // discriminator
        32 +  // proposal
        32 +  // executed_by
        1 +   // success
        (4 + MAX_OUTCOME_METRICS_LENGTH) + // metrics
        8 +   // executed_at
        1;    // bump
}
