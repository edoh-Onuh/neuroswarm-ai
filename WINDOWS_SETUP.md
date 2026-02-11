# Windows Installation Guide for Solana Agent Swarm

## Quick Start for Windows

### Step 1: Install Prerequisites

Run PowerShell **as Administrator** and execute our setup script:

```powershell
cd solana-agent-swarm
.\setup-windows.ps1
```

This will check and install:
- Rust
- Solana CLI
- Node.js & Yarn
- Anchor Framework

**If you prefer manual installation, follow the detailed steps below.**

---

## Manual Installation (Windows)

### 1. Install Rust

Open PowerShell and run:

```powershell
# Download and run rustup installer
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe"
```

Or download from: https://rustup.rs/

After installation, **restart PowerShell** and verify:

```powershell
cargo --version
rustc --version
```

### 2. Install Solana CLI

**Option A: Using Windows Installer (Recommended)**

1. Download the latest Windows installer from:
   https://github.com/solana-labs/solana/releases
   
2. Look for `solana-install-init-x86_64-pc-windows-msvc.exe`

3. Run the installer

**Option B: Using WSL (Windows Subsystem for Linux)**

If you have WSL installed:

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

**Verify installation:**

```powershell
solana --version
solana-keygen --version
```

### 3. Install Node.js and Yarn

**Node.js:**
1. Download from: https://nodejs.org/ (LTS version recommended)
2. Run the installer
3. Verify:

```powershell
node --version
npm --version
```

**Yarn:**

```powershell
npm install -g yarn
yarn --version
```

### 4. Install Anchor Framework

```powershell
# Install AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Close and reopen PowerShell to refresh PATH
# Then install Anchor

avm install latest
avm use latest
anchor --version
```

**Note:** Anchor installation may take 10-30 minutes on Windows.

**Troubleshooting Anchor Installation:**

If you get build errors, you may need:

1. **Visual Studio Build Tools:**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++"

2. **OpenSSL:**
   ```powershell
   # Using Chocolatey (if installed)
   choco install openssl
   
   # Or download from: https://slproweb.com/products/Win32OpenSSL.html
   ```

### 5. Install Python 3.11+

Download from: https://www.python.org/downloads/

**During installation:**
- ✅ Check "Add Python to PATH"
- ✅ Check "Install pip"

Verify:

```powershell
python --version
pip --version
```

---

## Project Setup

### 1. Configure Solana

```powershell
# Set to devnet
solana config set --url devnet

# Create keypair (if needed)
solana-keygen new
```

### 2. Generate Agent Keypairs

```powershell
.\scripts\generate-keypairs.ps1
```

This creates keypairs for all agents and airdrops SOL for testing.

### 3. Build the Solana Program

```powershell
anchor build
```

**First build may take 5-10 minutes.**

### 4. Deploy to Devnet

```powershell
anchor deploy --provider.cluster devnet
```

**Copy the Program ID from the output!**

### 5. Configure Environment

```powershell
# .env file already created by generate-keypairs.ps1
# Edit it to add your PROGRAM_ID

notepad .env
```

Update the `PROGRAM_ID` line with your deployed program ID.

### 6. Setup Python Environment

```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 7. Initialize the Swarm

```powershell
python scripts/initialize_swarm.py
```

### 8. Run the Agents!

```powershell
python run_swarm.py
```

---

## Common Windows Issues

### Issue: "anchor: command not found"

**Solution:**
1. Restart PowerShell after installing Anchor
2. Check PATH includes `.cargo\bin`:
   ```powershell
   $env:PATH -split ';' | Select-String cargo
   ```
3. If not found, add manually:
   ```powershell
   $env:PATH += ";$env:USERPROFILE\.cargo\bin"
   ```

### Issue: "Anchor build fails with linker error"

**Solution:**
Install Visual Studio Build Tools with C++ support:
https://visualstudio.microsoft.com/downloads/

### Issue: "solana: command not found"

**Solution:**
1. Restart PowerShell
2. Check installation:
   ```powershell
   Get-Command solana
   ```
3. If not found, add to PATH:
   ```powershell
   $env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   ```

### Issue: "Cannot activate Python venv"

**Solution:**
Enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Anchor build is very slow"

**Solution:**
1. This is normal on Windows (first build: 10-30 min)
2. Subsequent builds are much faster (1-2 min)
3. Consider using WSL2 for better performance

### Issue: "Airdrop failed"

**Solution:**
1. Devnet can be rate-limited
2. Try again after a few minutes
3. Or use: `solana airdrop 1 <PUBKEY> --url devnet`

---

## Using WSL2 (Alternative)

For better performance, consider using WSL2:

### 1. Install WSL2

```powershell
wsl --install
```

### 2. Install Ubuntu from Microsoft Store

### 3. Follow Linux setup instructions

Inside WSL2 terminal:

```bash
# Install dependencies
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked

# Continue with normal setup
avm install latest
avm use latest
```

---

## Testing Your Setup

Run this to verify everything works:

```powershell
# Check all tools
cargo --version
solana --version
anchor --version
node --version
python --version

# Check Solana config
solana config get

# Check balance
solana balance

# Try a test build
anchor test
```

---

## Next Steps

Once everything is installed:

1. ✅ Build: `anchor build`
2. ✅ Deploy: `anchor deploy --provider.cluster devnet`
3. ✅ Update `.env` with PROGRAM_ID
4. ✅ Initialize: `python scripts/initialize_swarm.py`
5. ✅ Run: `python run_swarm.py`

---

## Getting Help

- Check [SETUP.md](SETUP.md) for general setup
- Check [QUICKSTART.md](QUICKSTART.md) for command reference
- Check [README.md](README.md) for project overview

---

**For the best Windows experience, we recommend using WSL2 for development.**
