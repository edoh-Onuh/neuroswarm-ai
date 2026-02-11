"""
Main orchestrator for running all agents in the swarm
"""

import asyncio
import logging
import os
from typing import List
from dotenv import load_dotenv

from agents.consensus_agent import ConsensusAgent
from agents.analytics_agent import AnalyticsAgent
from agents.risk_agent import RiskManagementAgent
from agents.learning_agent import LearningAgent

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentSwarm:
    """Orchestrator for all agents in the swarm"""
    
    def __init__(self):
        load_dotenv()
        
        self.rpc_url = os.getenv("RPC_URL", "https://api.devnet.solana.com")
        self.program_id = os.getenv("PROGRAM_ID")
        self.idl_path = os.getenv("IDL_PATH")
        
        self.agents = []
        
    async def initialize_agents(self):
        """Initialize all agents"""
        logger.info("Initializing agent swarm...")
        
        # Create agents
        agent_configs = [
            (ConsensusAgent, "CONSENSUS_AGENT_KEYPAIR"),
            (AnalyticsAgent, "ANALYTICS_AGENT_KEYPAIR"),
            (RiskManagementAgent, "RISK_AGENT_KEYPAIR"),
            (LearningAgent, "LEARNING_AGENT_KEYPAIR"),
        ]
        
        for agent_class, keypair_env in agent_configs:
            keypair_path = os.getenv(keypair_env)
            
            if not keypair_path or not os.path.exists(keypair_path):
                logger.warning(f"Keypair not found for {agent_class.__name__}")
                continue
            
            agent = agent_class(
                keypair_path=keypair_path,
                rpc_url=self.rpc_url,
                program_id=self.program_id
            )
            
            # Initialize connection
            await agent.initialize(self.idl_path)
            
            # Register agent
            try:
                await agent.register()
                logger.info(f"Registered {agent.name}")
            except Exception as e:
                logger.info(f"Agent {agent.name} already registered: {e}")
            
            self.agents.append(agent)
        
        logger.info(f"Initialized {len(self.agents)} agents")
    
    async def run_swarm(self):
        """Run all agents concurrently"""
        logger.info("Starting agent swarm autonomous operation...")
        
        # Create tasks for all agents
        tasks = [agent.run() for agent in self.agents]
        
        # Run all agents concurrently
        await asyncio.gather(*tasks)
    
    async def shutdown(self):
        """Gracefully shutdown the swarm"""
        logger.info("Shutting down agent swarm...")
        # Could add cleanup logic here


async def main():
    """Main entry point"""
    swarm = AgentSwarm()
    
    try:
        await swarm.initialize_agents()
        await swarm.run_swarm()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Error running swarm: {e}")
    finally:
        await swarm.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
