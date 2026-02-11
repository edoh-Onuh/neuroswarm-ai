# 🚀 Quick Start Guide - Windows

## Current Status

✅ Rust installed  
⏳ Solana CLI installing...  
❓ Anchor - to be installed  
❓ Node.js - to be checked  

---

## Next Steps After Solana Installs

### 1. Restart PowerShell

Close this window and open a new PowerShell window.

### 2. Verify Solana Installation

```powershell
solana --version
solana-keygen --version
```

### 3. Configure Solana

```powershell
solana config set --url devnet
solana-keygen new  # Create your keypair
```

### 4. Install Anchor

```powershell
# This takes 10-30 minutes on first install
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# After installation completes, restart PowerShell again
avm install latest
avm use latest
anchor --version
```

### 5. Check Node.js

```powershell
node --version
npm --version

# If not installed, download from: https://nodejs.org/
# Then install Yarn:
npm install -g yarn
```

### 6. Setup Project

```powershell
cd solana-agent-swarm

# Generate keypairs and setup
.\scripts\generate-keypairs.ps1

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Copy the Program ID from output and update .env
notepad .env  # Update PROGRAM_ID line
```

### 7. Setup Python Agents

```powershell
# Create virtual environment
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Initialize swarm
python scripts/initialize_swarm.py
```

### 8. Run!

```powershell
python run_swarm.py
```

---

## Alternative: Use WSL2 (Faster)

If you encounter issues or want better performance:

```powershell
# Install WSL2
wsl --install

# Restart computer
# Open Ubuntu from Start menu
# Follow Linux installation in SETUP.md
```

---

## Troubleshooting

### Anchor build fails
- Install Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/
- Select "Desktop development with C++"

### Command not found after installation
- Restart PowerShell
- Check PATH includes the installed tools

### Airdrop fails
- Wait a few minutes and try again
- Devnet can be rate-limited

---

## Estimated Time

- Solana CLI: 5 minutes
- Anchor: 20-30 minutes (first time)
- Build project: 10 minutes (first time)
- Total: ~45 minutes

---

## Help & Documentation

- **Full Windows Guide**: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
- **General Setup**: [SETUP.md](SETUP.md)
- **Commands**: [QUICKSTART.md](QUICKSTART.md)
- **Project Info**: [README.md](README.md)

---

**Tip**: While Anchor is installing (takes longest), you can read through the documentation to understand the project! 📚
