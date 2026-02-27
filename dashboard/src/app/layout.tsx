import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DashboardProvider } from '@/context/DashboardContext'
import { SolanaProvider } from '@/context/SolanaContext'
import { WalletStandardProvider } from '@/context/WalletContext'
import type { Cluster } from '@/lib/solana/client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NeuroSwarm AI - Autonomous Intelligence Dashboard',
  description: 'Real-time monitoring and control for neural swarm intelligence on Solana blockchain',
  keywords: 'Solana, AI, Autonomous Agents, Blockchain, DeFi, Governance',
  authors: [{ name: 'NeuroSwarm AI Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Read cluster from env — falls back to 'mainnet' (matches Vercel NEXT_PUBLIC_CLUSTER=mainnet)
const cluster = (process.env.NEXT_PUBLIC_CLUSTER as Cluster | undefined) ?? 'mainnet'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaProvider cluster={cluster}>
          <WalletStandardProvider>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </WalletStandardProvider>
        </SolanaProvider>
      </body>
    </html>
  )
}
