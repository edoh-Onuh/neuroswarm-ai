"use client";

import { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Award, CheckCircle, TrendingUp, X, Target, Info } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import type { AgentListing } from '@/types';

const MOCK_AGENTS: AgentListing[] = [
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
];

export default function MarketplacePanel() {
  const [agents] = useState<AgentListing[]>(MOCK_AGENTS);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);
  const [rentalDays, setRentalDays] = useState(7);
  const { addNotification } = useDashboard();
  const listingModalRef = useRef<HTMLDivElement>(null);
  const rentalModalRef = useRef<HTMLDivElement>(null);

  // Close modals on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowListingModal(false);
        setShowRentalModal(false);
        setSelectedAgent(null);
      }
    };
    if (showListingModal || showRentalModal) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [showListingModal, showRentalModal]);

  const handleListAgent = () => {
    setShowListingModal(true);
  };

  const handleRentAgent = (agent: AgentListing) => {
    setSelectedAgent(agent);
    setRentalDays(7);
    setShowRentalModal(true);
  };

  const getRatingBadge = (rating: AgentListing['rating']) => {
    const badges: Record<AgentListing['rating'], { color: string; icon: React.ReactNode; label: string }> = {
      legendary: { color: 'from-yellow-500 to-orange-500', icon: <Trophy className="w-3 h-3" />, label: 'LEGENDARY' },
      elite: { color: 'from-purple-500 to-pink-500', icon: <Star className="w-3 h-3" />, label: 'ELITE' },
      expert: { color: 'from-blue-500 to-cyan-500', icon: <Award className="w-3 h-3" />, label: 'EXPERT' },
      proficient: { color: 'from-green-500 to-emerald-500', icon: <CheckCircle className="w-3 h-3" />, label: 'PROFICIENT' },
      developing: { color: 'from-gray-500 to-gray-600', icon: <TrendingUp className="w-3 h-3" />, label: 'DEVELOPING' }
    };
    return badges[rating];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
          <Trophy className="w-6 h-6 text-solana-purple" />
          <span>Agent Marketplace</span>
        </h2>
        <button 
          onClick={handleListAgent}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
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
                    {badge.icon}
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
                <button 
                  onClick={() => handleRentAgent(agent)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Rent Agent
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* List Agent Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowListingModal(false)}>
          <div ref={listingModalRef} className="bg-gray-800 border border-white/10 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="List Your Agent">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">List Your Agent</h3>
              <button 
                onClick={() => setShowListingModal(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="agent-name" className="block text-sm text-gray-400 mb-2">Agent Name</label>
                <input 
                  id="agent-name"
                  type="text" 
                  placeholder="e.g., Elite Day Trader"
                  maxLength={50}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="rental-price" className="block text-sm text-gray-400 mb-2">Rental Price (SOL/day)</label>
                <input 
                  id="rental-price"
                  type="number" 
                  placeholder="5.0"
                  step="0.1"
                  min="0.1"
                  max="100"
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="agent-desc" className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea 
                  id="agent-desc"
                  placeholder="Describe your agent's capabilities..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowListingModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    addNotification({
                      type: 'success',
                      title: 'Agent Listed',
                      message: 'Your agent has been listed on the marketplace.',
                    });
                    setShowListingModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  List Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rent Agent Modal */}
      {showRentalModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowRentalModal(false); setSelectedAgent(null); }}>
          <div ref={rentalModalRef} className="bg-gray-800 border border-white/10 rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Rent ${selectedAgent.name}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Rent Agent</h3>
              <button 
                onClick={() => {
                  setShowRentalModal(false);
                  setSelectedAgent(null);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-white">{selectedAgent.name}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-green-400 font-semibold">{selectedAgent.winRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Avg ROI:</span>
                  <span className="text-yellow-400 font-semibold">{selectedAgent.avgROI}%</span>
                </div>
              </div>

              <div>
                <label htmlFor="rental-period" className="block text-sm text-gray-400 mb-2">Rental Period (days)</label>
                <input 
                  id="rental-period"
                  type="number" 
                  placeholder="7"
                  min="1"
                  max="365"
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Price per day:</span>
                  <span className="font-semibold text-white">{selectedAgent.rentalPrice} SOL</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">Total Cost:</span>
                  <span className="text-purple-400">{(selectedAgent.rentalPrice * rentalDays).toFixed(1)} SOL</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowRentalModal(false);
                    setSelectedAgent(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    addNotification({
                      type: 'success',
                      title: 'Agent Rented',
                      message: `Successfully rented ${selectedAgent.name} for ${rentalDays} days (${(selectedAgent.rentalPrice * rentalDays).toFixed(1)} SOL).`,
                    });
                    setShowRentalModal(false);
                    setSelectedAgent(null);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  Confirm Rental
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">Compete and Earn</h4>
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
