"""SDK Agent Types"""
from enum import Enum
from dataclasses import dataclass
from solders.keypair import Keypair


class AgentType(Enum):
    """Agent types supported by the swarm"""
    CONSENSUS = "consensus"
    ANALYTICS = "analytics"
    EXECUTION = "execution"
    RISK_MANAGEMENT = "risk_management"
    LEARNING = "learning"
    GOVERNANCE = "governance"
    SECURITY = "security"
    LIQUIDITY = "liquidity"
    ARBITRAGE = "arbitrage"
    CUSTOM = "custom"


@dataclass
class AgentConfig:
    """Agent configuration"""
    agent_type: AgentType
    name: str
    reputation: float = 100.0
    is_active: bool = True


class Agent:
    """Agent instance"""
    
    def __init__(
        self,
        agent_type: AgentType,
        name: str,
        keypair: Keypair,
        reputation: float = 100.0
    ):
        self.agent_type = agent_type
        self.name = name
        self.keypair = keypair
        self.reputation = reputation
        self.is_active = True
        
    def __repr__(self):
        return f"Agent({self.name}, {self.agent_type.value})"
