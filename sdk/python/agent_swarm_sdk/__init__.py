"""
Agent Swarm SDK - Build Custom Multi-Agent Systems on Solana
"""
from .swarm import AgentSwarm
from .agent import Agent, AgentType, AgentConfig
from .proposal import Proposal, ProposalType, VoteType
from .governance import GovernanceCoalition
from .utils import generate_keypair, load_keypair, get_token_balance

__version__ = "0.1.0"

__all__ = [
    "AgentSwarm",
    "Agent",
    "AgentType",
    "AgentConfig",
    "Proposal",
    "ProposalType",
    "VoteType",
    "GovernanceCoalition",
    "generate_keypair",
    "load_keypair",
    "get_token_balance",
]
