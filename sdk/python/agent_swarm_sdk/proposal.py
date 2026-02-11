"""SDK Proposal Types"""
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional


class ProposalType(Enum):
    """Proposal types"""
    REBALANCE = "rebalance"
    TRADE = "trade"
    RISK_LIMIT = "risk_limit"
    STRATEGY = "strategy"
    EMERGENCY = "emergency"
    PARAMETER_CHANGE = "parameter_change"
    AGENT_ADD = "agent_add"
    AGENT_REMOVE = "agent_remove"


class VoteType(Enum):
    """Vote types"""
    APPROVE = "approve"
    REJECT = "reject"
    ABSTAIN = "abstain"


class Proposal:
    """Proposal instance"""
    
    def __init__(
        self,
        id: int,
        proposer: str,
        proposal_type: str,
        description: str,
        data: Optional[Dict] = None
    ):
        self.id = id
        self.proposer = proposer
        self.proposal_type = proposal_type
        self.description = description
        self.data = data or {}
        self.votes: Dict[str, str] = {}
        self.executed = False
        
    def record_vote(self, voter: str, vote: str):
        """Record a vote"""
        self.votes[voter] = vote
        
    def get_status(self) -> str:
        """Get proposal status"""
        if self.executed:
            return "executed"
        
        if not self.votes:
            return "pending"
            
        approve_count = sum(1 for v in self.votes.values() if v == "approve")
        reject_count = sum(1 for v in self.votes.values() if v == "reject")
        
        if approve_count > reject_count:
            return "approved"
        elif reject_count > approve_count:
            return "rejected"
        else:
            return "tied"
