'use client'

import { Brain, TrendingUp, Shield, Zap, BookOpen, CheckCircle, Activity } from 'lucide-react'

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'idle' | 'voting'
  reputation: number
  votescast: number
  successRate: number
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '69916v2L...',
    name: 'Consensus Agent',
    type: 'Consensus',
    status: 'active',
    reputation: 102.5,
    votescast: 6,
    successRate: 100,
  },
  {
    id: '8KynhjH...',
    name: 'Analytics Agent',
    type: 'Analytics',
    status: 'active',
    reputation: 101.0,
    votescast: 6,
    successRate: 100,
  },
  {
    id: '7AoGPKJ...',
    name: 'Execution Agent',
    type: 'Execution',
    status: 'voting',
    reputation: 100.5,
    votescast: 6,
    successRate: 100,
  },
  {
    id: 'C63K45x...',
    name: 'Risk Management',
    type: 'Risk',
    status: 'active',
    reputation: 100.0,
    votescast: 5,
    successRate: 100,
  },
  {
    id: '2NDikeJ...',
    name: 'Learning Agent',
    type: 'Learning',
    status: 'idle',
    reputation: 100.0,
    votescast: 6,
    successRate: 100,
  },
]

const getAgentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'consensus': return Brain
    case 'analytics': return TrendingUp
    case 'execution': return Zap
    case 'risk': return Shield
    case 'learning': return BookOpen
    default: return Activity
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'voting': return 'bg-blue-500 animate-pulse'
    case 'idle': return 'bg-gray-500'
    default: return 'bg-gray-500'
  }
}

interface AgentGridProps {
  limit?: number
  onAgentClick?: (agent: any) => void
  searchQuery?: string
  filterStatus?: 'all' | 'active' | 'idle' | 'voting'
  onSearchChange?: (query: string) => void
  onFilterChange?: (status: 'all' | 'active' | 'idle' | 'voting') => void
}

export default function AgentGrid({ 
  limit, 
  onAgentClick, 
  searchQuery = '', 
  filterStatus = 'all',
  onSearchChange,
  onFilterChange 
}: AgentGridProps) {
  let agents = MOCK_AGENTS
  
  // Apply filters
  if (searchQuery) {
    agents = agents.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  if (filterStatus !== 'all') {
    agents = agents.filter(agent => agent.status === filterStatus)
  }
  
  if (limit) {
    agents = agents.slice(0, limit)
  }

  return (
    <div className="card-gradient rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white">Agent Network</h2>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-400">
          <CheckCircle className="w-4 h-4 animate-pulse" />
          <span>All Systems Operational</span>
        </div>
      </div>

      {/* Search and Filter */}
      {!limit && onSearchChange && onFilterChange && (
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-solana-purple transition-colors"
          />
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-solana-purple transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="voting">Voting</option>
            <option value="idle">Idle</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        {agents.map((agent) => {
          const Icon = getAgentIcon(agent.type)
          
          return (
            <div
              key={agent.id}
              onClick={() => onAgentClick?.(agent)}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10 cursor-pointer hover:scale-[1.02] hover:border-solana-purple/50 hover:shadow-lg group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-br from-solana-purple to-solana-green rounded-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">{agent.name}</h3>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(agent.status)}`} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2 truncate">{agent.id}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-400">Reputation:</span>
                        <span className="text-green-400 ml-1 font-medium">{agent.reputation}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Votes:</span>
                        <span className="text-blue-400 ml-1 font-medium">{agent.votescast}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Success:</span>
                        <span className="text-green-400 ml-1 font-medium">{agent.successRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  agent.status === 'voting' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
