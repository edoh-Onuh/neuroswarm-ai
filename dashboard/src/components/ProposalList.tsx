'use client'

import { ThumbsUp, ThumbsDown, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import type { Proposal } from '@/types'
import { useSwarmAccounts } from '@/hooks/useSwarmAccounts'

const MOCK_PROPOSALS: Proposal[] = []

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
  onProposalClick?: (proposal: Proposal) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export default function ProposalList({ 
  limit, 
  onProposalClick, 
  searchQuery = '',
  onSearchChange 
}: ProposalListProps) {
  const { proposals: allProposals, isLoading, error, refresh } = useSwarmAccounts()

  let proposals = allProposals

  if (searchQuery) {
    proposals = proposals.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.proposer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  if (limit) proposals = proposals.slice(0, limit)

  return (
    <div className="card-gradient rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white">Proposals</h2>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          {!limit && (
            <button onClick={refresh} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

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
        {!isLoading && proposals.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No proposals found on-chain yet.</p>
          </div>
        ) : (
        proposals.map((proposal) => {
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
        })
        )}
      </div>
    </div>
  )
}
