'use client'

import { X, ThumbsUp, ThumbsDown, Clock, FileText, User, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ProposalModalProps {
  proposal: any
  onClose: () => void
  onVote: (vote: 'approve' | 'reject') => void
}

export default function ProposalModal({ proposal, onClose, onVote }: ProposalModalProps) {
  const [copied, setCopied] = useState(false)
  const [voting, setVoting] = useState(false)
  const [selectedVote, setSelectedVote] = useState<'approve' | 'reject' | null>(null)

  const copyProposalId = () => {
    navigator.clipboard.writeText(`#${proposal.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVote = (vote: 'approve' | 'reject') => {
    setSelectedVote(vote)
    setVoting(true)
    setTimeout(() => {
      onVote(vote)
      setVoting(false)
    }, 1500)
  }

  const approvalRate = proposal.totalVotes > 0 
    ? (proposal.votesFor / proposal.totalVotes) * 100 
    : 0

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl max-w-3xl w-full border border-solana-purple/30 shadow-2xl glow animate-slideUp my-4 sm:my-0 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <code className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded">#{proposal.id}</code>
                <button
                  onClick={copyProposalId}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </button>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                proposal.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                proposal.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 line-clamp-2">{proposal.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Proposed by <span className="text-solana-purple">{proposal.proposer}</span></span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{proposal.timeLeft}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Voting Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <ThumbsUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Votes For</span>
              </div>
              <p className="text-3xl font-bold text-white">{proposal.votesFor}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-400">Votes Against</span>
              </div>
              <p className="text-3xl font-bold text-white">{proposal.votesAgainst}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Approval Rate</span>
              </div>
              <p className="text-3xl font-bold text-white">{approvalRate.toFixed(0)}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Voting Progress</span>
              <span className="text-sm text-white font-medium">{proposal.totalVotes} / 5 votes</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Proposal Details</h3>
            <p className="text-white leading-relaxed">
              This proposal aims to optimize the portfolio allocation by increasing SOL holdings. 
              The current market conditions show strong momentum for SOL, and the risk management 
              metrics are within acceptable parameters. Expected outcome: Improved portfolio 
              performance and better risk-adjusted returns.
            </p>
          </div>

          {/* Voting Breakdown */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Voting Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                    C
                  </div>
                  <span className="text-white">Consensus Agent</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  APPROVE
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                    A
                  </div>
                  <span className="text-white">Analytics Agent</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  APPROVE
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center font-bold text-white text-sm">
                    E
                  </div>
                  <span className="text-white">Execution Agent</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  APPROVE
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Voting */}
          {proposal.status === 'active' && (
            <div className="bg-gradient-to-br from-solana-purple/20 to-solana-green/20 rounded-lg p-6 border border-solana-purple/30 glow">
              <h3 className="text-lg font-medium text-white mb-4">Cast Your Vote</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleVote('approve')}
                  disabled={voting}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all ${
                    voting && selectedVote === 'approve'
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:scale-105'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{voting && selectedVote === 'approve' ? 'Voting...' : 'Approve'}</span>
                </button>
                <button
                  onClick={() => handleVote('reject')}
                  disabled={voting}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all ${
                    voting && selectedVote === 'reject'
                      ? 'bg-red-500 text-white scale-105'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:scale-105'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{voting && selectedVote === 'reject' ? 'Voting...' : 'Reject'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-gray-900/50 sticky bottom-0">
          <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            Type: <span className="text-white font-medium">{proposal.type}</span>
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-solana-purple to-solana-green text-white font-medium hover:scale-105 transition-transform glow flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Close & Return</span>
          </button>
        </div>
      </div>
    </div>
  )
}
