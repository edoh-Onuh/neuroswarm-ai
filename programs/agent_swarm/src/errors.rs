use anchor_lang::prelude::*;

#[error_code]
pub enum SwarmError {
    #[msg("Agent name exceeds maximum length")]
    AgentNameTooLong,
    
    #[msg("Description exceeds maximum length")]
    DescriptionTooLong,
    
    #[msg("Reasoning exceeds maximum length")]
    ReasoningTooLong,
    
    #[msg("Proposal data exceeds maximum length")]
    ProposalDataTooLong,
    
    #[msg("Maximum number of agents reached")]
    MaxAgentsReached,
    
    #[msg("Minimum number of agents not met")]
    MinAgentsNotMet,
    
    #[msg("Agent already registered")]
    AgentAlreadyRegistered,
    
    #[msg("Agent not found")]
    AgentNotFound,
    
    #[msg("Proposal not found")]
    ProposalNotFound,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Proposal already expired")]
    ProposalExpired,
    
    #[msg("Agent already voted on this proposal")]
    AlreadyVoted,
    
    #[msg("Insufficient votes to execute proposal")]
    InsufficientVotes,
    
    #[msg("Proposal voting still in progress")]
    VotingInProgress,
    
    #[msg("Unauthorized agent action")]
    Unauthorized,
    
    #[msg("Invalid proposal timeout")]
    InvalidProposalTimeout,
    
    #[msg("Invalid reputation score")]
    InvalidReputationScore,
    
    #[msg("Invalid vote count")]
    InvalidVoteCount,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Swarm not initialized")]
    SwarmNotInitialized,
}
