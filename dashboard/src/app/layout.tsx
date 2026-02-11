import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DashboardProvider } from '@/context/DashboardContext'

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
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  )
}
