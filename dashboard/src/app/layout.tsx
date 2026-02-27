import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DashboardProvider } from '@/context/DashboardContext'
import { SolanaProvider } from '@/context/SolanaContext'
import { WalletStandardProvider } from '@/context/WalletContext'
import type { Cluster } from '@/lib/solana/client'

// display: swap prevents invisible text during font download (FOIT elimination)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: 'NeuroSwarm AI — Autonomous Intelligence Dashboard',
  description: 'Real-time monitoring and control for neural swarm intelligence on Solana blockchain',
  keywords: ['Solana', 'AI', 'Autonomous Agents', 'Blockchain', 'DeFi', 'Governance', 'NeuroSwarm'],
  authors: [{ name: 'NeuroSwarm AI Team' }],
  openGraph: {
    title: 'NeuroSwarm AI — Autonomous Intelligence Dashboard',
    description: 'Real-time monitoring and control for neural swarm intelligence on Solana blockchain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuroSwarm AI',
    description: 'Autonomous Intelligence on Solana',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#9945FF',
}

// Read cluster from env — falls back to 'mainnet' (matches Vercel NEXT_PUBLIC_CLUSTER=mainnet)
const cluster = (process.env.NEXT_PUBLIC_CLUSTER as Cluster | undefined) ?? 'mainnet'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
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
