# Setup and Build Instructions for Solana Agent Swarm

## Prerequisites

### 1. Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version
```

### 2. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
cargo --version
```

### 3. Install Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
anchor --version
```

### 4. Install Node.js and Yarn
```bash
# Download from https://nodejs.org/ or use nvm
node --version
npm install -g yarn
```

### 5. Install Python 3.11+
```bash
python --version  # Should be 3.11 or higher
pip install --upgrade pip
```

## Building the Project

### 1. Clone and Setup
```bash
cd solana-agent-swarm
```

### 2. Build Solana Program
```bash
# Build the program
anchor build

# This will:
# - Compile the Rust program
# - Generate IDL (Interface Definition Language)
# - Create deploy artifacts
```

### 3. Generate Keypairs
```bash
mkdir -p keys

# Generate keypairs for all agents
solana-keygen new --outfile keys/authority-keypair.json
solana-keygen new --outfile keys/consensus-keypair.json
solana-keygen new --outfile keys/analytics-keypair.json
solana-keygen new --outfile keys/execution-keypair.json
solana-keygen new --outfile keys/risk-keypair.json
solana-keygen new --outfile keys/learning-keypair.json
```

### 4. Airdrop SOL for Testing (Devnet)
```bash
# Set to devnet
solana config set --url devnet

# Airdrop SOL to each keypair
solana airdrop 2 $(solana-keygen pubkey keys/authority-keypair.json)
solana airdrop 1 $(solana-keygen pubkey keys/consensus-keypair.json)
solana airdrop 1 $(solana-keygen pubkey keys/analytics-keypair.json)
solana airdrop 1 $(solana-keygen pubkey keys/risk-keypair.json)
solana airdrop 1 $(solana-keygen pubkey keys/learning-keypair.json)
```

### 5. Deploy Program
```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the Program ID from output
# Update PROGRAM_ID in .env file
```

### 6. Setup Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 7. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env and update:
# - PROGRAM_ID (from anchor deploy output)
# - RPC_URL (if using different endpoint)
# - All keypair paths
```

### 8. Initialize the Swarm
```bash
# Run initialization script
python scripts/initialize_swarm.py
```

## Running the Agent Swarm

### Start All Agents
```bash
python run_swarm.py
```

### Start Individual Agents
```bash
# Terminal 1: Consensus Agent
python agents/consensus_agent.py

# Terminal 2: Analytics Agent
python agents/analytics_agent.py

# Terminal 3: Risk Agent
python agents/risk_agent.py

# Terminal 4: Learning Agent
python agents/learning_agent.py
```

## Testing

### Run Tests
```bash
# Rust tests
anchor test

# Python tests
pytest tests/
```

### Simulation Mode
```bash
# Set in .env
SIMULATION_MODE=true

# Run swarm
python run_swarm.py --mode simulation
```

## Troubleshooting

### Common Issues

**1. "Program ID mismatch"**
- Rebuild: `anchor build`
- Update Anchor.toml with new program ID
- Redeploy: `anchor deploy`

**2. "Insufficient funds"**
- Airdrop more SOL: `solana airdrop 2 <pubkey>`

**3. "Anchor version mismatch"**
- Update Anchor: `avm use latest`
- Rebuild: `anchor clean && anchor build`

**4. "Python module not found"**
- Activate venv: `source venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

## Development

### Local Validator (Optional)
```bash
# Start local validator
solana-test-validator

# In another terminal
solana config set --url localhost
anchor build
anchor deploy
```

### Code Formatting
```bash
# Rust
cargo fmt

# Python
black agents/
```

## Production Deployment

### Mainnet Deployment (Not Recommended Yet)
```bash
# Set to mainnet
solana config set --url mainnet-beta

# Deploy (requires mainnet SOL)
anchor deploy --provider.cluster mainnet

# Update .env with mainnet RPC and Program ID
```

**⚠️ Warning:** Thoroughly test on devnet before considering mainnet deployment!
