"use client";

import { useState } from 'react';
import { ArrowRightLeft, ShoppingCart, DollarSign, Zap, Search, Info } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import type { ArbitrageOpportunity } from '@/types';

const MOCK_OPPORTUNITIES: ArbitrageOpportunity[] = [
  {
    tokenPair: 'SOL/USDC',
    buyDex: 'Orca',
    sellDex: 'Raydium',
    buyPrice: 98.45,
    sellPrice: 99.12,
    profitBps: 68,
    profitPercentage: 0.68,
    estimatedProfit: 67.50
  },
  {
    tokenPair: 'BONK/USDC',
    buyDex: 'Jupiter',
    sellDex: 'Lifinity',
    buyPrice: 0.000024,
    sellPrice: 0.000025,
    profitBps: 54,
    profitPercentage: 0.54,
    estimatedProfit: 45.20
  },
  {
    tokenPair: 'JUP/USDC',
    buyDex: 'Raydium',
    sellDex: 'Orca',
    buyPrice: 1.23,
    sellPrice: 1.24,
    profitBps: 51,
    profitPercentage: 0.51,
    estimatedProfit: 38.75
  }
];

export default function ArbitragePanel() {
  const [opportunities] = useState<ArbitrageOpportunity[]>(MOCK_OPPORTUNITIES);
  const [minProfitBps, setMinProfitBps] = useState(50);
  const { addNotification } = useDashboard();

  const filteredOpportunities = opportunities.filter(opp => opp.profitBps >= minProfitBps);

  const handleExecute = (opp: ArbitrageOpportunity) => {
    addNotification({
      type: 'info',
      title: 'Arbitrage Submitted',
      message: `Executing ${opp.tokenPair} arbitrage: buy on ${opp.buyDex}, sell on ${opp.sellDex}. Estimated profit: $${opp.estimatedProfit.toFixed(2)}.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <ArrowRightLeft className="w-6 h-6 text-green-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Arbitrage Opportunities</h2>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="min-profit" className="text-sm text-gray-400">Min Profit:</label>
          <select 
            id="min-profit"
            value={minProfitBps}
            onChange={(e) => setMinProfitBps(Number(e.target.value))}
            className="bg-gray-800 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-solana-purple"
          >
            <option value={25}>0.25%</option>
            <option value={50}>0.50%</option>
            <option value={75}>0.75%</option>
            <option value={100}>1.00%</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp, index) => (
            <div key={index} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:border-green-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{opp.tokenPair}</h3>
                  <p className="text-xs text-gray-400">Cross-DEX Arbitrage</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    +{opp.profitPercentage.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    ~${opp.estimatedProfit.toFixed(2)} profit
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Buy</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{opp.buyDex}</p>
                  <p className="text-lg font-bold text-white">${opp.buyPrice.toFixed(6)}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Sell</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{opp.sellDex}</p>
                  <p className="text-lg font-bold text-white">${opp.sellPrice.toFixed(6)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Profit: {opp.profitBps} bps</span>
                  <span>After fees: ${(opp.estimatedProfit * 0.95).toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => handleExecute(opp)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Execute
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-8 text-center">
            <Search className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No arbitrage opportunities above {minProfitBps / 100}% found</p>
            <p className="text-sm text-gray-500 mt-2">Try lowering the minimum profit threshold</p>
          </div>
        )}
      </div>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-400 mb-1">Arbitrage Agent Scanning</h4>
            <p className="text-sm text-gray-300">
              Monitoring prices across Raydium, Orca, Jupiter, Lifinity, and Meteora DEXes.
              Opportunities are executed automatically when profit exceeds thresholds after fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
