"use client";

import { useState } from 'react';

interface ArbitrageOpportunity {
  tokenPair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  profitBps: number;
  profitPercentage: number;
  estimatedProfit: number;
}

export default function ArbitragePanel() {
  const [opportunities] = useState<ArbitrageOpportunity[]>([
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
  ]);

  const [minProfitBps, setMinProfitBps] = useState(50);

  const filteredOpportunities = opportunities.filter(opp => opp.profitBps >= minProfitBps);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💰 Arbitrage Opportunities</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Min Profit:</label>
          <select 
            value={minProfitBps}
            onChange={(e) => setMinProfitBps(Number(e.target.value))}
            className="bg-gray-800 border border-white/10 rounded px-3 py-1 text-sm"
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
                  <h3 className="text-lg font-semibold">{opp.tokenPair}</h3>
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
                    <span className="text-xl">🛒</span>
                    <span className="text-sm font-semibold text-blue-400">Buy</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{opp.buyDex}</p>
                  <p className="text-lg font-bold">${opp.buyPrice.toFixed(6)}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💵</span>
                    <span className="text-sm font-semibold text-green-400">Sell</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{opp.sellDex}</p>
                  <p className="text-lg font-bold">${opp.sellPrice.toFixed(6)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Profit: {opp.profitBps} bps</span>
                  <span>•</span>
                  <span>After fees: ${(opp.estimatedProfit * 0.95).toFixed(2)}</span>
                </div>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Execute
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-8 text-center">
            <span className="text-4xl mb-2 block">🔍</span>
            <p className="text-gray-400">No arbitrage opportunities above {minProfitBps / 100}% found</p>
            <p className="text-sm text-gray-500 mt-2">Try lowering the minimum profit threshold</p>
          </div>
        )}
      </div>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
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
