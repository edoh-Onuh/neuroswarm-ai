use anchor_lang::prelude::*;

/// Constants for the agent swarm protocol
pub const SWARM_SEED: &[u8] = b"swarm";
pub const AGENT_SEED: &[u8] = b"agent";
pub const PROPOSAL_SEED: &[u8] = b"proposal";
pub const OUTCOME_SEED: &[u8] = b"outcome";

pub const MAX_AGENT_NAME_LENGTH: usize = 32;
pub const MAX_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_REASONING_LENGTH: usize = 512;
pub const MAX_PROPOSAL_DATA_LENGTH: usize = 1024;
pub const MAX_OUTCOME_METRICS_LENGTH: usize = 512;

pub const MIN_AGENTS: u8 = 3;
pub const MAX_AGENTS: u8 = 20;

pub const DEFAULT_PROPOSAL_TIMEOUT: i64 = 3600; // 1 hour
pub const MIN_PROPOSAL_TIMEOUT: i64 = 300;      // 5 minutes
pub const MAX_PROPOSAL_TIMEOUT: i64 = 86400;    // 24 hours

pub const INITIAL_REPUTATION: u16 = 1000;
pub const MIN_REPUTATION: u16 = 0;
pub const MAX_REPUTATION: u16 = 10000;

pub const BYZANTINE_FAULT_TOLERANCE: f32 = 0.33; // Can tolerate up to 1/3 malicious agents
