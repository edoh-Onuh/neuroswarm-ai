# 🎨 Dashboard Setup Guide

## 🚀 Quick Start

Your Solana Agent Swarm now has a beautiful real-time dashboard!

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Dashboard will open at: **http://localhost:3000**

## ✨ What You Get

### 📊 Overview Tab
- **4 Key Metrics Cards**: Agents, Proposals, Active Proposals, Portfolio Value
- **Agent Grid**: All 5 agents with status, reputation, votes
- **Proposal List**: Recent proposals with voting progress

### 🤖 Agents Tab
- Detailed agent information
- Real-time status indicators (active/voting/idle)
- Reputation scores and success rates
- Individual agent statistics

### 📋 Proposals Tab
- All proposals with complete details
- Voting progress bars
- Time remaining for active votes
- Execution status and results
- Approval percentages

### 💼 Portfolio Tab
- **Line Chart**: 24-hour portfolio value
- **Pie Chart**: Asset allocation visualization
- **Holdings Cards**: Individual token positions
- Real-time price updates

### 🏛️ Governance Tab
- **Bar Chart**: Voting methods distribution
- **Leaderboard**: Top agents by reputation
- **Activity Feed**: Recent governance actions
- Coalition information

## 🎨 Features

✅ **Modern UI** - Solana-themed with purple/green gradients  
✅ **Real-time Updates** - Auto-refresh every 10 seconds  
✅ **Responsive Design** - Works on desktop, tablet, mobile  
✅ **Beautiful Charts** - Interactive Recharts visualizations  
✅ **Live Data** - Connected to your deployed Solana program  
✅ **Status Indicators** - Animated pulse effects for active agents  

## 📁 Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   └── components/
│       ├── Header.tsx          # Top navigation
│       ├── MetricsPanel.tsx    # Key metrics cards
│       ├── AgentGrid.tsx       # Agent status grid
│       ├── ProposalList.tsx    # Proposals display
│       ├── PortfolioChart.tsx  # Charts & allocations
│       └── GovernancePanel.tsx # Governance dashboard
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Configuration

### Change Program ID
Edit `src/app/page.tsx`:
```typescript
const PROGRAM_ID = 'YOUR_PROGRAM_ID_HERE'
```

### Change RPC Endpoint
```typescript
const RPC_URL = 'https://api.devnet.solana.com' // or mainnet
```

### Customize Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  solana: {
    purple: '#9945FF',  // Main purple
    green: '#14F195',   // Accent green
    blue: '#80ecff',    // Secondary blue
  },
}
```

## 📦 Dependencies

Core packages installed:
- **next** (14.1.0) - React framework
- **react** (18.2.0) - UI library
- **@solana/web3.js** - Blockchain integration
- **recharts** - Chart library
- **lucide-react** - Icon library
- **tailwindcss** - Styling framework

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

Your dashboard will be live in minutes!

### Deploy to Netlify
```bash
npm run build
# Drag & drop the 'out' folder to Netlify
```

## 📊 Data Flow

1. **Connection**: Dashboard connects to Solana RPC
2. **Fetch**: Retrieves swarm state every 10 seconds
3. **Parse**: Decodes account data
4. **Display**: Updates UI with live data
5. **Repeat**: Auto-refresh loop

## 🎯 Next Steps

### Add Wallet Connection (Optional)
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
```

### Add More Charts
- Agent performance over time
- Proposal success rates
- Reputation trends
- Trading volume

### Add Notifications
- WebSocket for real-time updates
- Browser notifications for new proposals
- Agent status changes

### Add Admin Controls
- Create proposals from dashboard
- Vote on proposals
- Agent management

## 🐛 Common Issues

### Port Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Build Errors
```bash
# Clean install
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Charts Not Showing
```bash
# Reinstall recharts
npm uninstall recharts
npm install recharts@latest
```

## 📱 Mobile Optimization

The dashboard is fully responsive:
- Desktop: Full layout with sidebar
- Tablet: Stacked grid layout
- Mobile: Single column, touch-friendly

## 🎨 Customization Ideas

1. **Dark/Light Mode Toggle**
2. **Custom Agent Avatars**
3. **Sound Effects for Events**
4. **Export Data as CSV**
5. **Filter and Search**
6. **Historical Data Viewer**
7. **Performance Benchmarks**
8. **Social Sharing**

## 📚 Learning Resources

- [Next.js Tutorial](https://nextjs.org/learn)
- [Solana Cookbook](https://solanacookbook.com/)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/en-US/examples)

## 🎉 You're All Set!

Run `npm run dev` and visit http://localhost:3000 to see your dashboard in action!

---

**Questions?** Check the main [README.md](../README.md) or open an issue on GitHub.
