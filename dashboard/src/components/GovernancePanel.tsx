'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, TrendingUp, Award } from 'lucide-react'

const votingData = [
  { method: 'Simple', count: 2 },
  { method: 'Supermajority', count: 1 },
  { method: 'Unanimous', count: 1 },
  { method: 'Quadratic', count: 0 },
  { method: 'Reputation', count: 2 },
]

const leaderboard = [
  { agent: 'Consensus Agent', reputation: 102.5, votes: 6, winRate: 100 },
  { agent: 'Analytics Agent', reputation: 101.0, votes: 6, winRate: 100 },
  { agent: 'Execution Agent', reputation: 100.5, votes: 6, winRate: 100 },
  { agent: 'Risk Management', reputation: 100.0, votes: 5, winRate: 100 },
  { agent: 'Learning Agent', reputation: 100.0, votes: 6, winRate: 100 },
]

export default function GovernancePanel() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Votes Cast</p>
              <p className="text-3xl font-bold text-white">29</p>
            </div>
          </div>
        </div>

        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Consensus Rate</p>
              <p className="text-3xl font-bold text-white">95%</p>
            </div>
          </div>
        </div>

        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg. Reputation</p>
              <p className="text-3xl font-bold text-white">100.8</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Methods Chart */}
        <div className="card-gradient rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Voting Methods Used</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={votingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="method" 
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(153,69,255,0.5)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="#9945FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card-gradient rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Agent Leaderboard</h3>
          <div className="space-y-3">
            {leaderboard.map((agent, index) => (
              <div 
                key={agent.agent}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{agent.agent}</div>
                    <div className="text-sm text-gray-400">
                      {agent.votes} votes • {agent.winRate}% win rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-solana-green">{agent.reputation}</div>
                  <div className="text-xs text-gray-400">reputation</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coalition Info */}
      <div className="card-gradient rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Coalition Governance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Available Voting Methods</h4>
            <div className="space-y-2">
              {['Simple Majority (>50%)', 'Supermajority (≥66%)', 'Unanimous (100%)', 'Quadratic Voting', 'Reputation-Weighted'].map((method) => (
                <div key={method} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-solana-purple rounded-full" />
                  <span className="text-gray-300">{method}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h4>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-300">Consensus Agent</span>
                <span className="text-gray-400"> voted </span>
                <span className="text-green-400">APPROVE</span>
                <span className="text-gray-400"> on Proposal #5</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">Risk Management</span>
                <span className="text-gray-400"> created </span>
                <span className="text-blue-400">Proposal #4</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-300">Analytics Agent</span>
                <span className="text-gray-400"> voted </span>
                <span className="text-green-400">APPROVE</span>
                <span className="text-gray-400"> on Proposal #3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
