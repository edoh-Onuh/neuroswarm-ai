'use client'

import { useState, useEffect } from 'react'
import { useSolana } from '@/context/SolanaContext'
import { useWallet } from '@/context/WalletContext'
import { fetchSwarmState, type SwarmStateData } from '@/lib/solana/client'
import AgentGrid from '@/components/AgentGrid'
import ProposalList from '@/components/ProposalList'
import MetricsPanel from '@/components/MetricsPanel'
import Header from '@/components/Header'
import PortfolioChart from '@/components/PortfolioChart'
import GovernancePanel from '@/components/GovernancePanel'
import AgentModal from '@/components/AgentModal'
import ProposalModal from '@/components/ProposalModal'
import NotificationCenter from '@/components/NotificationCenter'
import CommandPalette from '@/components/CommandPalette'
import ExportPanel from '@/components/ExportPanel'
import AIInsights from '@/components/AIInsights'
import SentimentPanel from '@/components/SentimentPanel'
import ArbitragePanel from '@/components/ArbitragePanel'
import MarketplacePanel from '@/components/MarketplacePanel'
import { Activity, TrendingUp, Users, Vote, Loader2, BarChart3, Building, Search, ArrowRightLeft, ShoppingBag } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import type { Agent, Proposal } from '@/types'

export default function Dashboard() {
  const { isConnected: isDashboardConnected, isRefreshing, refreshCounter, activeTab, setActiveTab } = useDashboard()
  const { rpc } = useSolana()
  const { isConnected: isWalletConnected, connectedAddress } = useWallet()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'voting' | 'error'>('all')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [swarmData, setSwarmData] = useState({
    totalAgents: 0,
    totalProposals: 0,
    activeProposals: 0,
    portfolioValue: 0,
  })

  // Fetch swarm state using Kit RPC (no web3.js leakage)
  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await fetchSwarmState(rpc)
        if (state) {
          setSwarmData((prev) => ({
            ...prev,
            totalAgents: state.activeAgents,
            totalProposals: Number(state.totalProposals),
          }))
        }
      } catch (error) {
        console.error('Error fetching swarm state:', error)
      } finally {
        setIsInitialLoad(false)
      }
    }

    fetchState()
    // Poll every 30s (be respectful of public RPC rate limits)
    const interval = setInterval(fetchState, 30_000)
    return () => clearInterval(interval)
  }, [rpc, refreshCounter])

  // Keyboard shortcuts for tab switching
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't fire when inside an input/textarea or when modifier keys are pressed (except for Ctrl+K)
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'r': e.preventDefault(); break // handled by DashboardContext
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'agents' as const, label: 'Agents', icon: Users },
    { id: 'proposals' as const, label: 'Proposals', icon: Vote },
    { id: 'portfolio' as const, label: 'Portfolio', icon: TrendingUp },
    { id: 'governance' as const, label: 'Governance', icon: Building },
    { id: 'sentiment' as const, label: 'Sentiment', icon: Search },
    { id: 'arbitrage' as const, label: 'Arbitrage', icon: ArrowRightLeft },
    { id: 'marketplace' as const, label: 'Marketplace', icon: ShoppingBag },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Header />
      <NotificationCenter />
      <CommandPalette />
      
      {/* Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 border border-solana-purple/50 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-solana-purple animate-spin" />
            <span className="text-white font-medium">Refreshing data...</span>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <nav className="border-b border-white/10 overflow-x-auto" role="tablist" aria-label="Dashboard sections">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-solana-purple text-solana-purple'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
        {/* Initial loading skeleton */}
        {isInitialLoad ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
            </div>
            <div className="h-48 skeleton rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 skeleton rounded-xl" />
              <div className="h-80 skeleton rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <MetricsPanel data={swarmData} />
                <AIInsights />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AgentGrid limit={5} onAgentClick={setSelectedAgent} />
                  <ProposalList limit={6} onProposalClick={setSelectedProposal} />
                </div>
                <ExportPanel />
              </div>
            )}

            {activeTab === 'agents' && (
              <AgentGrid 
                onAgentClick={setSelectedAgent}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                onSearchChange={setSearchQuery}
                onFilterChange={setFilterStatus}
              />
            )}

            {activeTab === 'proposals' && (
              <ProposalList 
                onProposalClick={setSelectedProposal}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'portfolio' && <PortfolioChart />}
            {activeTab === 'governance' && <GovernancePanel />}
            {activeTab === 'sentiment' && <SentimentPanel />}
            {activeTab === 'arbitrage' && <ArbitragePanel />}
            {activeTab === 'marketplace' && <MarketplacePanel />}
          </>
        )}
      </main>

      {/* Modals */}
      {selectedAgent && (
        <AgentModal 
          agent={selectedAgent} 
          onClose={() => setSelectedAgent(null)} 
        />
      )}
      {selectedProposal && (
        <ProposalModal 
          proposal={selectedProposal} 
          onClose={() => setSelectedProposal(null)}
          onVote={(vote) => {
            console.log('Vote cast:', vote)
            setSelectedProposal(null)
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 safe-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-400">
            <div>
              <span className="font-semibold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">NeuroSwarm AI</span>
              {' '}- Autonomous Intelligence Protocol
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isDashboardConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span>
                {isDashboardConnected
                  ? `Connected to ${process.env.NEXT_PUBLIC_CLUSTER === 'mainnet' ? 'Mainnet' : process.env.NEXT_PUBLIC_CLUSTER === 'testnet' ? 'Testnet' : 'Devnet'}`
                  : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
