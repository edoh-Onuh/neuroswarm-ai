"use client";

import { useState } from 'react';

interface AgentListing {
  id: string;
  name: string;
  rating: 'legendary' | 'elite' | 'expert' | 'proficient' | 'developing';
  reputation: number;
  winRate: number;
  totalProposals: number;
  avgROI: number;
  rentalPrice: number;
  capabilities: string[];
}

export default function MarketplacePanel() {
  const [agents] = useState<AgentListing[]>([
    {
      id: '1',
      name: 'Elite Day Trader',
      rating: 'elite',
      reputation: 2450,
      winRate: 85,
      totalProposals: 156,
      avgROI: 12.5,
      rentalPrice: 5.0,
      capabilities: ['Market Analysis', 'Arbitrage', 'Execution']
    },
    {
      id: '2',
      name: 'Sentinel Risk Guard',
      rating: 'expert',
      reputation: 2180,
      winRate: 92,
      totalProposals: 89,
      avgROI: 8.3,
      rentalPrice: 3.5,
      capabilities: ['Risk Management', 'Portfolio Protection']
    },
    {
      id: '3',
      name: 'Alpha Sentiment Scout',
      rating: 'expert',
      reputation: 1920,
      winRate: 78,
      totalProposals: 134,
      avgROI: 15.2,
      rentalPrice: 4.0,
      capabilities: ['Sentiment Analysis', 'Social Monitoring']
    },
    {
      id: '4',
      name: 'DeFi Yield Hunter',
      rating: 'proficient',
      reputation: 1550,
      winRate: 81,
      totalProposals: 67,
      avgROI: 9.8,
      rentalPrice: 2.5,
      capabilities: ['Lending', 'Liquidity Provision', 'Yield Farming']
    }
  ]);

  const getRatingBadge = (rating: string) => {
    const badges = {
      legendary: { color: 'from-yellow-500 to-orange-500', icon: '👑', label: 'LEGENDARY' },
      elite: { color: 'from-purple-500 to-pink-500', icon: '⭐', label: 'ELITE' },
      expert: { color: 'from-blue-500 to-cyan-500', icon: '💎', label: 'EXPERT' },
      proficient: { color: 'from-green-500 to-emerald-500', icon: '✓', label: 'PROFICIENT' },
      developing: { color: 'from-gray-500 to-gray-600', icon: '📈', label: 'DEVELOPING' }
    };
    return badges[rating as keyof typeof badges];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🏆 Agent Marketplace</h2>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
          List Your Agent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const badge = getRatingBadge(agent.rating);
          return (
            <div key={agent.id} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${badge.color} text-white`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-400">{agent.rentalPrice} SOL</div>
                  <div className="text-xs text-gray-400">per day</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                  <div className="text-lg font-bold text-green-400">{agent.winRate}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                  <div className="text-lg font-bold text-blue-400">{agent.totalProposals}</div>
                  <div className="text-xs text-gray-400">Proposals</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <div className="text-lg font-bold text-yellow-400">{agent.avgROI}%</div>
                  <div className="text-xs text-gray-400">Avg ROI</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Reputation:</span>
                  <span className="text-sm font-semibold text-purple-400">{agent.reputation}</span>
                </div>
                <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Rent Agent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">Compete & Earn</h4>
            <p className="text-sm text-gray-300">
              List your agents on the marketplace to earn passive income. Top performers gain reputation,
              climb the leaderboard, and command premium rental prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
