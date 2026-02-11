'use client'

import { ThumbsUp, ThumbsDown, Clock, CheckCircle2 } from 'lucide-react'

interface Proposal {
  id: number
  title: string
  type: string
  proposer: string
  status: 'active' | 'passed' | 'rejected' | 'executed'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  timeLeft: string
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 0,
    title: 'Rebalance Portfolio: Increase SOL Allocation',
    type: 'Rebalance',
    proposer: 'Consensus Agent',
    status: 'executed',
    votesFor: 4,
    votesAgainst: 1,
    totalVotes: 5,
    timeLeft: 'Executed',
  },
  {
    id: 1,
    title: 'Emergency Stop: High Volatility Detected',
    type: 'Emergency',
    proposer: 'Risk Management',
    status: 'executed',
    votesFor: 5,
    votesAgainst: 0,
    totalVotes: 5,
    timeLeft: 'Executed',
  },
  {
    id: 2,
    title: 'Trade: Swap 0.5 SOL for USDC',
    type: 'Trade',
    proposer: 'Execution Agent',
    status: 'active',
    votesFor: 3,
    votesAgainst: 0,
    totalVotes: 3,
    timeLeft: '2h 15m',
  },
  {
    id: 3,
    title: 'Strategy Update: Enable Arbitrage Detection',
    type: 'Strategy',
    proposer: 'Analytics Agent',
    status: 'active',
    votesFor: 2,
    votesAgainst: 1,
    totalVotes: 3,
    timeLeft: '5h 42m',
  },
  {
    id: 4,
    title: 'Risk Limit: Set Max Position Size to 30%',
    type: 'Risk Limit',
    proposer: 'Risk Management',
    status: 'passed',
    votesFor: 4,
    votesAgainst: 0,
    totalVotes: 4,
    timeLeft: 'Awaiting Execution',
  },
  {
    id: 5,
    title: 'Rebalance: Reduce BONK Exposure',
    type: 'Rebalance',
    proposer: 'Learning Agent',
    status: 'active',
    votesFor: 1,
    votesAgainst: 0,
    totalVotes: 1,
    timeLeft: '8h 30m',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-blue-500/20 text-blue-400'
    case 'passed': return 'bg-green-500/20 text-green-400'
    case 'rejected': return 'bg-red-500/20 text-red-400'
    case 'executed': return 'bg-purple-500/20 text-purple-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

interface ProposalListProps {
  limit?: number
  onProposalClick?: (proposal: any) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function ProposalList({ 
  limit, 
  onProposalClick, 
  searchQuery = '',
  onSearchChange 
}: ProposalListProps) {
  let proposals = MOCK_PROPOSALS
  
  // Apply search filter
  if (searchQuery) {
    proposals = proposals.filter(proposal => 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.proposer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  if (limit) {
    proposals = proposals.slice(0, limit)
  }

  return (
    <div className="card-gradient rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Proposals</h2>

      {/* Search */}
      {!limit && onSearchChange && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-solana-purple transition-colors"
          />
        </div>
      )}

      <div className="space-y-4">
        {proposals.map((proposal) => {
          const approvalRate = proposal.totalVotes > 0 
            ? (proposal.votesFor / proposal.totalVotes) * 100 
            : 0

          return (
            <div
              key={proposal.id}
              onClick={() => onProposalClick?.(proposal)}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10 cursor-pointer hover:scale-[1.02] hover:border-solana-purple/50 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="text-gray-400 text-xs sm:text-sm">#{proposal.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm sm:text-base line-clamp-2">{proposal.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Proposed by <span className="text-solana-purple">{proposal.proposer}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-green-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{proposal.votesFor}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-red-400">
                    <ThumbsDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{proposal.votesAgainst}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {approvalRate.toFixed(0)}% approval
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  {proposal.status === 'active' && <Clock className="w-4 h-4" />}
                  {proposal.status === 'executed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  <span>{proposal.timeLeft}</span>
                </div>
              </div>

              {/* Progress bar */}
              {proposal.totalVotes > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${approvalRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
