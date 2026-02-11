"""
Agent Swarm SDK - Main Swarm Class
"""
import asyncio
from typing import Dict, List, Optional
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from .agent import Agent
from .proposal import Proposal


class AgentSwarm:
    """
    Main class for interacting with Agent Swarm Protocol
    
    Example:
        ```python
        swarm = AgentSwarm(
            program_id="56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK",
            rpc_url="https://api.devnet.solana.com"
        )
        
        await swarm.initialize(max_agents=10, min_votes_required=6)
        ```
    """
    
    def __init__(
        self,
        program_id: str,
        rpc_url: str = "https://api.devnet.solana.com",
        authority: Optional[Keypair] = None
    ):
        self.program_id = Pubkey.from_string(program_id)
        self.rpc_url = rpc_url
        self.client = AsyncClient(rpc_url)
        self.authority = authority
        
        # Cached data
        self._agents: Dict[str, Agent] = {}
        self._proposals: Dict[int, Proposal] = {}
    
    async def initialize(
        self,
        max_agents: int = 5,
        min_votes_required: int = 3,
        proposal_timeout: int = 3600
    ) -> str:
        """
        Initialize a new agent swarm on-chain
        
        Args:
            max_agents: Maximum number of agents in swarm
            min_votes_required: Minimum votes needed for consensus
            proposal_timeout: Proposal expiration time in seconds
            
        Returns:
            Transaction signature
        """
        if not self.authority:
            raise ValueError("Authority keypair required for initialization")
        
        # Implementation would build and send initialize transaction
        print(f"🚀 Initializing swarm: {max_agents} agents, {min_votes_required} min votes")
        return "initialize_tx_signature"
    
    async def register_agent(self, agent: Agent) -> str:
        """
        Register an agent with the swarm
        
        Args:
            agent: Agent instance to register
            
        Returns:
            Transaction signature
        """
        agent_key = str(agent.keypair.pubkey())
        self._agents[agent_key] = agent
        
        print(f"📝 Registering agent: {agent.name} ({agent.agent_type})")
        return "register_tx_signature"
    
    async def create_proposal(
        self,
        agent: Agent,
        proposal_type: str,
        description: str,
        data: Optional[Dict] = None
    ) -> Proposal:
        """
        Create a new proposal
        
        Args:
            agent: Agent creating the proposal
            proposal_type: Type of proposal
            description: Human-readable description
            data: Additional proposal data
            
        Returns:
            Proposal instance
        """
        proposal_id = len(self._proposals)
        proposal = Proposal(
            id=proposal_id,
            proposer=str(agent.keypair.pubkey()),
            proposal_type=proposal_type,
            description=description,
            data=data or {}
        )
        
        self._proposals[proposal_id] = proposal
        print(f"📋 Created proposal #{proposal_id}: {description}")
        
        return proposal
    
    async def vote(
        self,
        agent: Agent,
        proposal_id: int,
        vote: str,
        reasoning: str = ""
    ) -> str:
        """
        Vote on a proposal
        
        Args:
            agent: Agent casting vote
            proposal_id: ID of proposal to vote on
            vote: "approve", "reject", or "abstain"
            reasoning: Optional reasoning for vote
            
        Returns:
            Transaction signature
        """
        if proposal_id not in self._proposals:
            raise ValueError(f"Proposal {proposal_id} not found")
        
        proposal = self._proposals[proposal_id]
        proposal.record_vote(str(agent.keypair.pubkey()), vote)
        
        print(f"🗳️  {agent.name} voted {vote.upper()} on proposal #{proposal_id}")
        return "vote_tx_signature"
    
    async def get_swarm_state(self) -> Dict:
        """Get current swarm state from on-chain"""
        return {
            "program_id": str(self.program_id),
            "total_agents": len(self._agents),
            "total_proposals": len(self._proposals),
            "rpc_url": self.rpc_url
        }
    
    async def get_agent(self, agent_pubkey: str) -> Optional[Agent]:
        """Get agent by public key"""
        return self._agents.get(agent_pubkey)
    
    async def get_proposal(self, proposal_id: int) -> Optional[Proposal]:
        """Get proposal by ID"""
        return self._proposals.get(proposal_id)
    
    async def list_agents(self) -> List[Agent]:
        """List all registered agents"""
        return list(self._agents.values())
    
    async def list_proposals(
        self,
        status: Optional[str] = None
    ) -> List[Proposal]:
        """
        List proposals, optionally filtered by status
        
        Args:
            status: Filter by "pending", "approved", "rejected", or None for all
        """
        proposals = list(self._proposals.values())
        
        if status:
            proposals = [
                p for p in proposals
                if p.get_status() == status
            ]
        
        return proposals
    
    async def close(self):
        """Close RPC client connection"""
        await self.client.close()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
