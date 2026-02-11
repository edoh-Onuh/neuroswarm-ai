"""
Base Agent Class for Solana Agent Swarm Intelligence Protocol

This module provides the foundation for all specialized agents in the swarm.
Each agent autonomously interacts with the Solana program to coordinate decisions.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from abc import ABC, abstractmethod

from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from anchorpy import Provider, Wallet, Program, Idl

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentType(Enum):
    """Types of agents in the swarm"""
    CONSENSUS = 0
    ANALYTICS = 1
    EXECUTION = 2
    RISK_MANAGEMENT = 3
    LEARNING = 4


class ProposalType(Enum):
    """Types of proposals agents can create"""
    REBALANCE = 0
    TRADE = 1
    RISK_LIMIT = 2
    STRATEGY = 3
    EMERGENCY = 4


class VoteType(Enum):
    """Vote options for proposals"""
    APPROVE = 0
    REJECT = 1
    ABSTAIN = 2


@dataclass
class ProposalData:
    """Structured proposal data"""
    proposal_type: ProposalType
    data: bytes
    description: str
    created_at: int
    expires_at: int
    votes_for: int
    votes_against: int
    votes_abstain: int
    weighted_votes_for: int
    weighted_votes_against: int
    executed: bool


class BaseAgent(ABC):
    """
    Base class for all autonomous agents in the swarm.
    
    Each agent:
    - Connects to the Solana network
    - Interacts with the agent_swarm program
    - Makes autonomous decisions based on their specialization
    - Coordinates with other agents through on-chain proposals and votes
    """
    
    def __init__(
        self,
        agent_type: AgentType,
        name: str,
        keypair_path: str,
        rpc_url: str = "https://api.devnet.solana.com",
        program_id: Optional[str] = None
    ):
        """
        Initialize the agent.
        
        Args:
            agent_type: The type of agent (consensus, analytics, etc.)
            name: Human-readable name for the agent
            keypair_path: Path to the agent's keypair file
            rpc_url: Solana RPC endpoint
            program_id: Agent swarm program ID
        """
        self.agent_type = agent_type
        self.name = name
        self.rpc_url = rpc_url
        
        # Load keypair
        with open(keypair_path, 'r') as f:
            keypair_data = json.load(f)
        self.keypair = Keypair.from_bytes(bytes(keypair_data))
        self.pubkey = self.keypair.pubkey()
        
        # Initialize Solana client
        self.client = AsyncClient(rpc_url, commitment=Confirmed)
        self.wallet = Wallet(self.keypair)
        
        # Program configuration
        self.program_id = Pubkey.from_string(program_id) if program_id else None
        self.program: Optional[Program] = None
        
        # Agent state
        self.reputation = 1000  # Initial reputation
        self.is_active = False
        self.last_decision_time = 0
        
        logger.info(f"Agent {self.name} ({self.agent_type.name}) initialized")
        logger.info(f"Public key: {self.pubkey}")
    
    async def initialize(self, idl_path: str):
        """
        Initialize connection to the Solana program.
        
        Args:
            idl_path: Path to the program's IDL file
        """
        try:
            with open(idl_path, 'r') as f:
                idl_dict = json.load(f)
            
            idl = Idl.from_json(json.dumps(idl_dict))
            provider = Provider(self.client, self.wallet)
            self.program = Program(idl, self.program_id, provider)
            
            logger.info(f"Agent {self.name} connected to program {self.program_id}")
        except Exception as e:
            logger.error(f"Failed to initialize agent: {e}")
            raise
    
    async def register(self):
        """Register this agent with the swarm"""
        try:
            if not self.program:
                raise RuntimeError("Agent not initialized. Call initialize() first.")
            
            # Derive agent PDA
            agent_pda = self._get_agent_pda()
            swarm_pda = self._get_swarm_pda()
            
            # Register agent
            tx = await self.program.rpc["register_agent"](
                self.agent_type.value,
                self.name,
                ctx={
                    "accounts": {
                        "swarm_state": swarm_pda,
                        "agent": agent_pda,
                        "owner": self.pubkey,
                        "system_program": Pubkey.default(),
                    },
                    "signers": [self.keypair],
                }
            )
            
            self.is_active = True
            logger.info(f"Agent {self.name} registered successfully. TX: {tx}")
            
        except Exception as e:
            logger.error(f"Failed to register agent: {e}")
            raise
    
    async def create_proposal(
        self,
        proposal_type: ProposalType,
        data: bytes,
        description: str
    ) -> Pubkey:
        """
        Create a new proposal for the swarm to vote on.
        
        Args:
            proposal_type: Type of proposal
            data: Serialized proposal data
            description: Human-readable description
            
        Returns:
            Pubkey of the created proposal
        """
        try:
            if not self.is_active:
                raise RuntimeError("Agent not registered")
            
            swarm_pda = self._get_swarm_pda()
            agent_pda = self._get_agent_pda()
            
            # Get next proposal ID
            swarm_state = await self.program.account["SwarmState"].fetch(swarm_pda)
            proposal_id = swarm_state.total_proposals
            
            # Derive proposal PDA
            proposal_pda = self._get_proposal_pda(proposal_id)
            
            # Create proposal
            tx = await self.program.rpc["create_proposal"](
                proposal_type.value,
                list(data),
                description,
                ctx={
                    "accounts": {
                        "swarm_state": swarm_pda,
                        "agent": agent_pda,
                        "proposal": proposal_pda,
                        "proposer": self.pubkey,
                        "system_program": Pubkey.default(),
                    },
                    "signers": [self.keypair],
                }
            )
            
            logger.info(f"Agent {self.name} created proposal: {description}")
            logger.info(f"Proposal PDA: {proposal_pda}, TX: {tx}")
            
            return proposal_pda
            
        except Exception as e:
            logger.error(f"Failed to create proposal: {e}")
            raise
    
    async def vote_on_proposal(
        self,
        proposal_pda: Pubkey,
        vote: VoteType,
        reasoning: str
    ):
        """
        Vote on an existing proposal.
        
        Args:
            proposal_pda: Public key of the proposal
            vote: Vote type (approve, reject, abstain)
            reasoning: Explanation for the vote
        """
        try:
            if not self.is_active:
                raise RuntimeError("Agent not registered")
            
            swarm_pda = self._get_swarm_pda()
            agent_pda = self._get_agent_pda()
            
            # Cast vote
            tx = await self.program.rpc["vote_proposal"](
                vote.value,
                reasoning,
                ctx={
                    "accounts": {
                        "swarm_state": swarm_pda,
                        "agent": agent_pda,
                        "proposal": proposal_pda,
                        "voter": self.pubkey,
                    },
                    "signers": [self.keypair],
                }
            )
            
            logger.info(f"Agent {self.name} voted {vote.name}: {reasoning}")
            logger.info(f"TX: {tx}")
            
        except Exception as e:
            logger.error(f"Failed to vote on proposal: {e}")
            raise
    
    async def get_proposal(self, proposal_pda: Pubkey) -> Optional[ProposalData]:
        """
        Fetch proposal data from the blockchain.
        
        Args:
            proposal_pda: Public key of the proposal
            
        Returns:
            ProposalData or None if not found
        """
        try:
            proposal = await self.program.account["Proposal"].fetch(proposal_pda)
            
            return ProposalData(
                proposal_type=ProposalType(proposal.proposal_type),
                data=bytes(proposal.data),
                description=proposal.description,
                created_at=proposal.created_at,
                expires_at=proposal.expires_at,
                votes_for=proposal.votes_for,
                votes_against=proposal.votes_against,
                votes_abstain=proposal.votes_abstain,
                weighted_votes_for=proposal.weighted_votes_for,
                weighted_votes_against=proposal.weighted_votes_against,
                executed=proposal.executed,
            )
        except Exception as e:
            logger.error(f"Failed to fetch proposal: {e}")
            return None
    
    async def get_active_proposals(self) -> List[Pubkey]:
        """Get all active (non-executed, non-expired) proposals"""
        try:
            swarm_pda = self._get_swarm_pda()
            swarm_state = await self.program.account["SwarmState"].fetch(swarm_pda)
            
            active_proposals = []
            for i in range(swarm_state.total_proposals):
                proposal_pda = self._get_proposal_pda(i)
                proposal = await self.get_proposal(proposal_pda)
                
                if proposal and not proposal.executed:
                    # Check if not expired
                    import time
                    if time.time() < proposal.expires_at:
                        active_proposals.append(proposal_pda)
            
            return active_proposals
            
        except Exception as e:
            logger.error(f"Failed to get active proposals: {e}")
            return []
    
    def _get_swarm_pda(self) -> Pubkey:
        """Get the swarm state PDA"""
        seeds = [b"swarm"]
        pda, _ = Pubkey.find_program_address(seeds, self.program_id)
        return pda
    
    def _get_agent_pda(self) -> Pubkey:
        """Get this agent's PDA"""
        seeds = [b"agent", bytes(self.pubkey)]
        pda, _ = Pubkey.find_program_address(seeds, self.program_id)
        return pda
    
    def _get_proposal_pda(self, proposal_id: int) -> Pubkey:
        """Get a proposal PDA by ID"""
        seeds = [b"proposal", proposal_id.to_bytes(8, 'little')]
        pda, _ = Pubkey.find_program_address(seeds, self.program_id)
        return pda
    
    @abstractmethod
    async def analyze_and_decide(self) -> Optional[Dict[str, Any]]:
        """
        Core decision-making logic for this agent.
        
        Each agent implements its own analysis and decision process.
        This method should:
        1. Gather relevant data
        2. Analyze the current state
        3. Make a decision (propose, vote, or wait)
        4. Return the decision or None if no action needed
        
        Returns:
            Decision dictionary or None
        """
        pass
    
    @abstractmethod
    async def evaluate_proposal(self, proposal: ProposalData) -> VoteType:
        """
        Evaluate a proposal and decide how to vote.
        
        Args:
            proposal: The proposal to evaluate
            
        Returns:
            Vote decision (approve, reject, abstain)
        """
        pass
    
    async def run(self):
        """
        Main agent loop - continuously monitors and makes decisions.
        
        This is the autonomous operation loop:
        1. Check for active proposals
        2. Evaluate and vote on proposals
        3. Analyze current state
        4. Create new proposals if needed
        5. Repeat
        """
        logger.info(f"Agent {self.name} starting autonomous operation...")
        
        import asyncio
        
        while True:
            try:
                # Check for proposals to vote on
                active_proposals = await self.get_active_proposals()
                
                for proposal_pda in active_proposals:
                    proposal = await self.get_proposal(proposal_pda)
                    if proposal:
                        # Evaluate and vote
                        vote = await self.evaluate_proposal(proposal)
                        reasoning = await self._generate_vote_reasoning(proposal, vote)
                        await self.vote_on_proposal(proposal_pda, vote, reasoning)
                
                # Perform agent-specific analysis and decision-making
                decision = await self.analyze_and_decide()
                
                if decision:
                    logger.info(f"Agent {self.name} made decision: {decision}")
                
                # Wait before next iteration
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in agent loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    @abstractmethod
    async def _generate_vote_reasoning(
        self,
        proposal: ProposalData,
        vote: VoteType
    ) -> str:
        """Generate reasoning for a vote"""
        pass
