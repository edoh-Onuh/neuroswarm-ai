'use client'

import { useState, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
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
import { Activity, TrendingUp, Users, Vote, Loader2 } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'

const PROGRAM_ID = '56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK'
const RPC_URL = 'https://api.devnet.solana.com'

export default function Dashboard() {
  const { isConnected, isRefreshing } = useDashboard()
  const [connection] = useState(() => new Connection(RPC_URL, 'confirmed'))
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'proposals' | 'portfolio' | 'governance'>('overview')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle' | 'voting'>('all')
  const [swarmData, setSwarmData] = useState({
    totalAgents: 5,
    totalProposals: 6,
    activeProposals: 2,
    portfolioValue: 397.50,
  })

  useEffect(() => {
    // Fetch swarm state periodically
    const fetchSwarmState = async () => {
      try {
        const programId = new PublicKey(PROGRAM_ID)
        const [swarmPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('swarm')],
          programId
        )
        
        const accountInfo = await connection.getAccountInfo(swarmPda)
        if (accountInfo) {
          // Parse account data (simplified)
          console.log('Swarm account found:', swarmPda.toString())
        }
      } catch (error) {
        console.error('Error fetching swarm state:', error)
      }
    }

    fetchSwarmState()
    const interval = setInterval(fetchSwarmState, 10000)
    return () => clearInterval(interval)
  }, [connection])

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'agents' as const, label: 'Agents', icon: Users },
    { id: 'proposals' as const, label: 'Proposals', icon: Vote },
    { id: 'portfolio' as const, label: 'Portfolio', icon: TrendingUp },
    { id: 'governance' as const, label: 'Governance', icon: Users },
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
      <div className="border-b border-white/10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
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
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <MetricsPanel data={swarmData} />
            
            {/* AI Insights */}
            <AIInsights />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AgentGrid limit={5} onAgentClick={setSelectedAgent} />
              <ProposalList limit={6} onProposalClick={setSelectedProposal} />
            </div>
            
            {/* Export Panel */}
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

        {activeTab === 'portfolio' && (
          <PortfolioChart />
        )}

        {activeTab === 'governance' && (
          <GovernancePanel />
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
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div>
              <span className="font-semibold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">NeuroSwarm AI</span>
              {' '}- Autonomous Intelligence Protocol
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Connected to Devnet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
