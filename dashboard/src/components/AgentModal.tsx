'use client'

import { X, Brain, TrendingUp, Award, Activity, Copy, Check, BarChart3, PieChart, Calendar, Target } from 'lucide-react'
import { useState } from 'react'

interface AgentModalProps {
  agent: any
  onClose: () => void
}

export default function AgentModal({ agent, onClose }: AgentModalProps) {
  const [copied, setCopied] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const copyAgentId = () => {
    navigator.clipboard.writeText(agent.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl max-w-2xl w-full border border-solana-purple/30 shadow-2xl glow animate-slideUp my-4 sm:my-0 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10 bg-gray-900/95 sticky top-0 z-10">
          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-solana-purple to-solana-green rounded-xl glow flex-shrink-0">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 truncate">{agent.name}</h2>
              <div className="flex items-center space-x-2">
                <code className="text-xs sm:text-sm text-gray-400 bg-white/5 px-2 py-1 rounded truncate">{agent.id}</code>
                <button
                  onClick={copyAgentId}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy Agent ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  )}
                </button>
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Reputation</span>
              </div>
              <p className="text-2xl font-bold text-white">{agent.reputation}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Votes Cast</span>
              </div>
              <p className="text-2xl font-bold text-white">{agent.votescast}</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{agent.successRate}%</p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Agent Type</span>
              </div>
              <p className="text-lg font-bold text-white">{agent.type}</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Current Status</h3>
            <div className="flex items-center space-x-3">
              <span className={`w-3 h-3 rounded-full ${
                agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                agent.status === 'voting' ? 'bg-blue-500 animate-pulse' :
                'bg-gray-500'
              }`} />
              <span className="text-white font-medium capitalize">{agent.status}</span>
              {agent.status === 'active' && (
                <span className="text-sm text-green-400">Processing proposals and executing tasks</span>
              )}
              {agent.status === 'voting' && (
                <span className="text-sm text-blue-400">Analyzing proposal #3</span>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white">Voted on Proposal #5</p>
                  <p className="text-xs text-gray-400">2 hours ago</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                  APPROVE
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white">Analyzed market conditions</p>
                  <p className="text-xs text-gray-400">4 hours ago</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                  ANALYSIS
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white">Reputation increased</p>
                  <p className="text-xs text-gray-400">6 hours ago</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                  +2.5
                </span>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Performance Trend (7 days)</h3>
            <div className="flex items-end space-x-2 h-24">
              {[85, 90, 88, 95, 100, 98, 100].map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-solana-purple to-solana-green rounded-t transition-all hover:scale-110"
                  style={{ height: `${value}%` }}
                  title={`Day ${index + 1}: ${value}%`}
                />
              ))}
            </div>
          </div>

          {/* Expanded Analytics Section */}
          {showAnalytics && (
            <div className="space-y-4 animate-slideDown">
              {/* Advanced Metrics */}
              <div className="bg-gradient-to-br from-solana-purple/20 to-solana-green/20 rounded-lg p-4 border border-solana-purple/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Advanced Analytics</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Accuracy Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-white">98.5%</p>
                    <p className="text-xs text-green-400">+2.3% this week</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-400">Avg Response Time</span>
                    </div>
                    <p className="text-2xl font-bold text-white">1.2s</p>
                    <p className="text-xs text-green-400">-0.3s improvement</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <PieChart className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-400">Consensus Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-white">95%</p>
                    <p className="text-xs text-blue-400">Above average</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold text-white">99.9%</p>
                    <p className="text-xs text-green-400">30 days</p>
                  </div>
                </div>
              </div>

              {/* Vote Distribution */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Vote Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Approve</span>
                      <span className="text-green-400 font-medium">83%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '83%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Reject</span>
                      <span className="text-red-400 font-medium">10%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Abstain</span>
                      <span className="text-gray-400 font-medium">7%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-500 rounded-full" style={{ width: '7%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposal Type Performance */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Performance by Proposal Type</h3>
                <div className="space-y-2">
                  {[
                    { type: 'Rebalance', success: 100, count: 3 },
                    { type: 'Trade', success: 95, count: 8 },
                    { type: 'Emergency', success: 100, count: 2 },
                    { type: 'Strategy', success: 90, count: 5 },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <span className="text-sm text-white">{item.type}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-400">{item.count} votes</span>
                        <span className="text-sm font-medium text-green-400">{item.success}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Performance Chart */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-3">30-Day Performance History</h3>
                <div className="flex items-end justify-between h-32 gap-1">
                  {[85, 88, 87, 90, 92, 89, 91, 93, 95, 94, 96, 98, 97, 99, 100, 98, 99, 100, 98, 99, 100, 99, 100, 98, 99, 100, 99, 100, 100, 100].map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t hover:from-solana-purple hover:to-solana-green transition-all cursor-pointer"
                      style={{ height: `${value}%` }}
                      title={`Day ${index + 1}: ${value}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Close Analytics Button */}
              <button
                onClick={() => setShowAnalytics(false)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Hide Analytics</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 bg-gray-900/50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-solana-purple to-solana-green text-white font-medium hover:scale-105 transition-transform glow flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Close & Return</span>
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-full sm:w-auto px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all hover:scale-105 flex items-center justify-center space-x-2 border border-solana-purple/50"
          >
            <BarChart3 className="w-5 h-5" />
            <span>{showAnalytics ? 'Hide' : 'View'} Full Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
