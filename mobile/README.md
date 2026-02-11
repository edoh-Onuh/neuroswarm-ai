# NeuroSwarm AI Mobile App

React Native mobile app for monitoring your autonomous agent swarm on the go.

## Features

- 📊 **Real-Time Dashboard**: Monitor all agents and their performance
- 🔔 **Push Notifications**: Get instant alerts for proposals and trades
- 📈 **Portfolio Tracking**: View your holdings and profit/loss
- 🗳️ **Quick Voting**: Approve or reject proposals with one tap
- 🎯 **Agent Management**: Start, stop, and configure agents remotely
- 🔒 **Secure Authentication**: Biometric login with wallet integration
- 📱 **Offline Mode**: View cached data when offline

## Tech Stack

- **Framework**: React Native 0.74+
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation 6
- **Wallet Integration**: Solana Mobile SDK
- **UI Components**: React Native Paper
- **Charts**: Victory Native
- **Notifications**: Firebase Cloud Messaging

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- Solana Mobile SDK

## Installation

> **Note**: TypeScript errors are expected until dependencies are installed. The files are scaffolded for future development.

```bash
# Clone the repository
git clone https://github.com/edoh-Onuh/neuroswarm-ai.git
cd neuroswarm-ai/mobile

# Install dependencies (resolves TypeScript errors)
npm install

# iOS setup
cd ios && pod install && cd ..

# Android setup (if needed)
# Android dependencies are auto-linked
```

### Current Status
📋 **Scaffolded** - Project structure and example code created  
⏳ **Pending** - Dependencies need to be installed  
🔨 **TODO** - Missing modules (store, hooks, components) to be implemented

## Running the App

### iOS
```bash
npm run ios
# or
npx react-native run-ios
```

### Android
```bash
npm run android
# or
npx react-native run-android
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── AgentsScreen.tsx
│   │   ├── ProposalsScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── ProposalCard.tsx
│   │   ├── PerformanceChart.tsx
│   │   └── NotificationBadge.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── store/
│   │   ├── slices/
│   │   └── store.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── wallet.ts
│   │   └── notifications.ts
│   ├── hooks/
│   │   ├── useAgents.ts
│   │   ├── useProposals.ts
│   │   └── useWallet.ts
│   └── utils/
│       ├── formatters.ts
│       └── constants.ts
├── android/
├── ios/
└── package.json
```

## Key Features Implementation

### 1. Dashboard Screen
Real-time overview of all agents and portfolio performance.

### 2. Push Notifications
Receive alerts for:
- New proposals requiring vote
- Trade executions
- Agent status changes
- Profit milestones

### 3. Biometric Authentication
Secure login using Face ID, Touch ID, or fingerprint.

### 4. Wallet Integration
Connect and manage your Solana wallet on mobile.

## Configuration

Create `.env` file:

```env
API_URL=https://api.neuroswarm-ai.com
WEBSOCKET_URL=wss://api.neuroswarm-ai.com
SOLANA_NETWORK=mainnet-beta
FCM_SERVER_KEY=your_fcm_key
```

## Building for Production

### iOS
```bash
cd ios
xcodebuild -workspace NeuroSwarmAI.xcworkspace -scheme NeuroSwarmAI -configuration Release
```

### Android
```bash
cd android
./gradlew assembleRelease
```

## App Store Submission

### iOS
1. Update version in `ios/NeuroSwarmAI/Info.plist`
2. Archive in Xcode
3. Submit via App Store Connect

### Android
1. Update version in `android/app/build.gradle`
2. Generate signed APK/AAB
3. Submit via Google Play Console

## Screenshots

(Add screenshots here once available)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

MIT License - see [LICENSE](../LICENSE)

## Contact

- **Developer**: Adanu Brown
- **GitHub**: [@edoh-Onuh](https://github.com/edoh-Onuh/)
- **Twitter**: [@Adanubrown](https://twitter.com/Adanubrown)
- **Email**: adanu1947@gmail.com

## Roadmap

- [ ] iOS App Store release
- [ ] Android Play Store release
- [ ] Tablet optimization
- [ ] Apple Watch companion app
- [ ] Android Wear support
- [ ] Offline trading queue
- [ ] Multi-wallet support
- [ ] Dark mode theme
