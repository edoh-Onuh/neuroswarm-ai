"""
Custom Agent Builder - Advanced Feature
Allows users to create and configure custom agent teams
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

class AgentCapability(Enum):
    """Available agent capabilities"""
    MARKET_ANALYSIS = "market_analysis"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    RISK_MANAGEMENT = "risk_management"
    ARBITRAGE = "arbitrage"
    LENDING = "lending"
    LIQUIDITY_PROVISION = "liquidity_provision"
    NFT_TRADING = "nft_trading"
    GOVERNANCE = "governance"
    EXECUTION = "execution"
    LEARNING = "learning"

@dataclass
class AgentTemplate:
    """Template for creating custom agents"""
    name: str
    type: str
    capabilities: List[AgentCapability]
    risk_tolerance: float  # 0.0 (conservative) to 1.0 (aggressive)
    voting_weight: float  # Agent's voting power (0.0 to 1.0)
    specialization: Dict[str, Any]
    constraints: Dict[str, Any]

class CustomAgentBuilder:
    """
    Builder for creating custom agent configurations
    """
    
    def __init__(self):
        self.templates = self._load_default_templates()
        
    def _load_default_templates(self) -> Dict[str, AgentTemplate]:
        """Load predefined agent templates"""
        return {
            'conservative_trader': AgentTemplate(
                name="Conservative Trader",
                type="trading",
                capabilities=[
                    AgentCapability.MARKET_ANALYSIS,
                    AgentCapability.RISK_MANAGEMENT
                ],
                risk_tolerance=0.3,
                voting_weight=0.2,
                specialization={
                    'max_position_size': 0.1,  # 10% of portfolio
                    'stop_loss': 0.05,  # 5% stop loss
                    'preferred_assets': ['SOL', 'USDC']
                },
                constraints={
                    'no_leverage': True,
                    'no_memecoins': True
                }
            ),
            'aggressive_trader': AgentTemplate(
                name="Aggressive Trader",
                type="trading",
                capabilities=[
                    AgentCapability.MARKET_ANALYSIS,
                    AgentCapability.ARBITRAGE
                ],
                risk_tolerance=0.8,
                voting_weight=0.15,
                specialization={
                    'max_position_size': 0.3,
                    'stop_loss': 0.15,
                    'preferred_assets': ['all']
                },
                constraints={
                    'max_leverage': 2.0
                }
            ),
            'sentiment_specialist': AgentTemplate(
                name="Sentiment Specialist",
                type="analysis",
                capabilities=[
                    AgentCapability.SENTIMENT_ANALYSIS,
                    AgentCapability.MARKET_ANALYSIS
                ],
                risk_tolerance=0.5,
                voting_weight=0.2,
                specialization={
                    'sentiment_sources': ['twitter', 'reddit', 'news'],
                    'sentiment_threshold': 0.7
                },
                constraints={}
            ),
            'arbitrage_hunter': AgentTemplate(
                name="Arbitrage Hunter",
                type="arbitrage",
                capabilities=[
                    AgentCapability.ARBITRAGE,
                    AgentCapability.EXECUTION
                ],
                risk_tolerance=0.4,
                voting_weight=0.15,
                specialization={
                    'min_profit_bps': 50,
                    'dexes': ['raydium', 'orca', 'jupiter']
                },
                constraints={
                    'max_trade_size': 10000
                }
            ),
            'defi_strategist': AgentTemplate(
                name="DeFi Strategist",
                type="defi",
                capabilities=[
                    AgentCapability.LENDING,
                    AgentCapability.LIQUIDITY_PROVISION,
                    AgentCapability.MARKET_ANALYSIS
                ],
                risk_tolerance=0.6,
                voting_weight=0.3,
                specialization={
                    'yield_strategies': ['lending', 'staking', 'lp'],
                    'min_apr': 0.05
                },
                constraints={
                    'no_impermanent_loss': False
                }
            )
        }
    
    def create_custom_agent(
        self,
        name: str,
        capabilities: List[AgentCapability],
        risk_tolerance: float = 0.5,
        voting_weight: float = 0.2,
        **kwargs
    ) -> AgentTemplate:
        """Create a custom agent from scratch"""
        return AgentTemplate(
            name=name,
            type=kwargs.get('type', 'custom'),
            capabilities=capabilities,
            risk_tolerance=risk_tolerance,
            voting_weight=voting_weight,
            specialization=kwargs.get('specialization', {}),
            constraints=kwargs.get('constraints', {})
        )
    
    def clone_template(self, template_name: str, new_name: str, **overrides) -> AgentTemplate:
        """Clone and modify an existing template"""
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        template = self.templates[template_name]
        
        return AgentTemplate(
            name=new_name,
            type=overrides.get('type', template.type),
            capabilities=overrides.get('capabilities', template.capabilities),
            risk_tolerance=overrides.get('risk_tolerance', template.risk_tolerance),
            voting_weight=overrides.get('voting_weight', template.voting_weight),
            specialization={**template.specialization, **overrides.get('specialization', {})},
            constraints={**template.constraints, **overrides.get('constraints', {})}
        )
    
    def create_balanced_team(self, team_size: int = 5) -> List[AgentTemplate]:
        """Create a balanced team of agents"""
        if team_size < 3:
            raise ValueError("Team size must be at least 3")
        
        team = [
            self.templates['conservative_trader'],
            self.templates['aggressive_trader'],
            self.templates['sentiment_specialist']
        ]
        
        # Add additional specialists based on team size
        if team_size >= 4:
            team.append(self.templates['arbitrage_hunter'])
        if team_size >= 5:
            team.append(self.templates['defi_strategist'])
        
        return team[:team_size]
    
    def validate_team(self, team: List[AgentTemplate]) -> Dict[str, Any]:
        """Validate team composition"""
        total_weight = sum(agent.voting_weight for agent in team)
        
        # Check capabilities coverage
        all_capabilities = set()
        for agent in team:
            all_capabilities.update(agent.capabilities)
        
        essential_capabilities = {
            AgentCapability.MARKET_ANALYSIS,
            AgentCapability.RISK_MANAGEMENT,
            AgentCapability.EXECUTION
        }
        
        missing_capabilities = essential_capabilities - all_capabilities
        
        return {
            'valid': len(missing_capabilities) == 0,
            'total_voting_weight': total_weight,
            'missing_capabilities': list(missing_capabilities),
            'team_size': len(team),
            'average_risk_tolerance': sum(a.risk_tolerance for a in team) / len(team)
        }
    
    def export_team_config(self, team: List[AgentTemplate]) -> Dict:
        """Export team configuration as JSON"""
        return {
            'team_name': 'Custom Swarm',
            'agents': [
                {
                    'name': agent.name,
                    'type': agent.type,
                    'capabilities': [cap.value for cap in agent.capabilities],
                    'risk_tolerance': agent.risk_tolerance,
                    'voting_weight': agent.voting_weight,
                    'specialization': agent.specialization,
                    'constraints': agent.constraints
                }
                for agent in team
            ],
            'validation': self.validate_team(team)
        }

# Example usage
if __name__ == '__main__':
    builder = CustomAgentBuilder()
    
    # Create a balanced team
    team = builder.create_balanced_team(5)
    
    # Create a custom agent
    custom_agent = builder.create_custom_agent(
        name="My Custom Agent",
        capabilities=[AgentCapability.MARKET_ANALYSIS, AgentCapability.NFT_TRADING],
        risk_tolerance=0.7,
        voting_weight=0.25,
        specialization={'nft_collections': ['degods', 'okay_bears']}
    )
    
    team.append(custom_agent)
    
    # Validate and export
    config = builder.export_team_config(team)
    print("Team Configuration:")
    print(f"  Team Size: {config['validation']['team_size']}")
    print(f"  Valid: {config['validation']['valid']}")
    print(f"  Average Risk: {config['validation']['average_risk_tolerance']:.2f}")
    
    for agent in config['agents']:
        print(f"\n  Agent: {agent['name']}")
        print(f"    Type: {agent['type']}")
        print(f"    Capabilities: {', '.join(agent['capabilities'])}")
        print(f"    Risk Tolerance: {agent['risk_tolerance']:.2f}")
