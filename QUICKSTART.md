# Quick Reference Guide - Solana Agent Swarm

## Common Commands

### Building
```bash
# Build Solana program
anchor build

# Clean and rebuild
anchor clean && anchor build

# Build Python (lint check)
python -m py_compile agents/*.py
```

### Deployment
```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to localnet
anchor deploy --provider.cluster localnet

# Deploy to mainnet (⚠️ use with caution)
anchor deploy --provider.cluster mainnet
```

### Testing
```bash
# Run Anchor tests
anchor test

# Run Python tests
pytest tests/ -v

# Run specific test
pytest tests/test_consensus.py -v

# Run with coverage
pytest --cov=agents tests/
```

### Running Agents
```bash
# All agents together
python run_swarm.py

# Simulation mode
python run_swarm.py --mode simulation

# Individual agents
python agents/consensus_agent.py
python agents/analytics_agent.py
python agents/risk_agent.py
python agents/learning_agent.py
```

### Keypair Management
```bash
# Generate new keypair
solana-keygen new --outfile keys/my-keypair.json

# Get public key from keypair
solana-keygen pubkey keys/my-keypair.json

# Check balance
solana balance $(solana-keygen pubkey keys/my-keypair.json)

# Airdrop (devnet only)
solana airdrop 2 $(solana-keygen pubkey keys/my-keypair.json)
```

### Solana Configuration
```bash
# Set cluster
solana config set --url devnet
solana config set --url mainnet-beta
solana config set --url localhost

# Get current config
solana config get

# Set keypair
solana config set --keypair keys/authority-keypair.json
```

### Program Interaction
```bash
# Get program account
solana program show <PROGRAM_ID>

# View account data
solana account <ACCOUNT_ADDRESS>

# Get recent blockhash
solana block-time

# View transaction
solana confirm <SIGNATURE>
```

### Monitoring
```bash
# View logs
tail -f logs/agent_swarm.log

# Monitor program logs (if deployed locally)
solana logs

# Check agent status
python scripts/check_agent_status.py
```

### Development
```bash
# Start local validator
solana-test-validator

# In another terminal
solana config set --url localhost
anchor build
anchor deploy

# Reset local validator
solana-test-validator --reset
```

## Environment Variables

### Required
```bash
PROGRAM_ID=<your-deployed-program-id>
RPC_URL=https://api.devnet.solana.com
IDL_PATH=./target/idl/agent_swarm.json
```

### Agent Keypairs
```bash
CONSENSUS_AGENT_KEYPAIR=./keys/consensus-keypair.json
ANALYTICS_AGENT_KEYPAIR=./keys/analytics-keypair.json
RISK_AGENT_KEYPAIR=./keys/risk-keypair.json
LEARNING_AGENT_KEYPAIR=./keys/learning-keypair.json
```

### Optional
```bash
SIMULATION_MODE=true
LOG_LEVEL=INFO
MAX_AGENTS=5
MIN_VOTES_REQUIRED=3
PROPOSAL_TIMEOUT=3600
```

## Directory Structure
```
solana-agent-swarm/
├── programs/           # Solana program (Rust)
│   └── agent_swarm/
│       └── src/
│           ├── lib.rs
│           ├── state.rs
│           ├── errors.rs
│           ├── constants.rs
│           └── instructions/
├── agents/            # Python agents
│   ├── base_agent.py
│   ├── consensus_agent.py
│   ├── analytics_agent.py
│   ├── risk_agent.py
│   └── learning_agent.py
├── tests/             # Test files
├── keys/              # Keypairs (gitignored)
├── target/            # Build outputs
├── .env               # Environment config
└── run_swarm.py       # Main runner
```

## Troubleshooting

### "Program ID mismatch"
```bash
# Rebuild and update Program ID
anchor build
# Copy new Program ID from lib.rs
anchor deploy
# Update PROGRAM_ID in .env
```

### "Insufficient funds"
```bash
# Airdrop more SOL
solana airdrop 2 <PUBKEY>
```

### "Cannot connect to RPC"
```bash
# Check RPC URL
solana config get
# Try different RPC
export RPC_URL=https://api.devnet.solana.com
```

### "Agent already registered"
```bash
# This is normal if agent was previously registered
# Agent will continue to operate
```

### "Python module not found"
```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

## Performance Tips

1. **Use devnet for testing** - Free transactions
2. **Run simulation mode** - No real funds needed
3. **Monitor logs** - Understand agent behavior
4. **Start with one agent** - Debug individually
5. **Check balances** - Ensure sufficient SOL

## Security Reminders

- ⚠️ **Never commit private keys**
- ⚠️ **Use devnet for testing**
- ⚠️ **Review all transactions**
- ⚠️ **Audit code before mainnet**
- ⚠️ **Keep backups of keys**

## Getting Help

1. Check [SETUP.md](SETUP.md) for detailed setup
2. Read [README.md](README.md) for overview
3. Review [AUTONOMY.md](AUTONOMY.md) for agent details
4. Open issue on GitHub
5. Ask in Discord community

---

**Quick Start:** `anchor build && anchor deploy && python run_swarm.py`
