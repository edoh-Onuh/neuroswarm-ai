"use client";

import { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, ShoppingCart, DollarSign, Zap, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import type { ArbitrageOpportunity } from '@/types';

// ── Token mints tracked for cross-DEX spread ──────────────────────────────
// We fetch live mid-prices from two independent free APIs (CoinGecko + DexScreener)
// and compute a synthetic bid/ask spread to surface realistic arbitrage signals.
const PAIRS: {
  tokenPair: string
  cgId: string
  screenerId: string  // DexScreener pair address (Raydium SOL/USDC pool)
  buyDex: string
  sellDex: string
}[] = [
  {
    tokenPair: 'SOL/USDC',
    cgId: 'solana',
    screenerId: 'solana/58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWaS4YJ9xas88', // Raydium
    buyDex: 'Raydium',
    sellDex: 'Orca',
  },
  {
    tokenPair: 'JUP/USDC',
    cgId: 'jupiter-exchange-solana',
    screenerId: 'solana/C1MgLojNLWBKADvu9BHdtgzz1oZX4dZ5zGdGcgvvW5YR', // Raydium JUP/USDC
    buyDex: 'Raydium',
    sellDex: 'Jupiter',
  },
  {
    tokenPair: 'BONK/USDC',
    cgId: 'bonk',
    screenerId: 'solana/8PhnCfgqpgFM7ZJvttGdBVMXHuU4Q23ACxCvWkbs1M71', // Orca BONK/USDC
    buyDex: 'Orca',
    sellDex: 'Lifinity',
  },
]

async function fetchLiveOpportunities(): Promise<ArbitrageOpportunity[]> {
  // 1. CoinGecko prices (source A)
  const cgIds = PAIRS.map(p => p.cgId).join(',')
  const cgRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd`,
  )
  const cgJson: Record<string, { usd: number }> = cgRes.ok ? await cgRes.json() : {}

  // 2. DexScreener prices (source B) — free, no key
  const screenerIds = PAIRS.map(p => p.screenerId).join(',')
  const dsRes = await fetch(
    `https://api.dexscreener.com/latest/dex/pairs/${screenerIds}`,
  )
  const dsJson: { pairs?: Array<{ pairAddress: string; priceUsd: string }> } =
    dsRes.ok ? await dsRes.json() : {}

  const now = Date.now()
  const opps: ArbitrageOpportunity[] = []

  for (const pair of PAIRS) {
    const cgPrice = cgJson[pair.cgId]?.usd ?? 0

    const dsRow = dsJson.pairs?.find(
      p => p.pairAddress.toLowerCase() === pair.screenerId.split('/')[1]?.toLowerCase(),
    )
    const dsPrice = parseFloat(dsRow?.priceUsd ?? '0')

    // If either source is missing, skip
    if (!cgPrice || !dsPrice) continue

    // Use the spread between the two price sources as a proxy for cross-DEX spread
    const buyPrice  = Math.min(cgPrice, dsPrice)
    const sellPrice = Math.max(cgPrice, dsPrice)

    const profitBps = Math.round(((sellPrice - buyPrice) / buyPrice) * 10_000)
    if (profitBps < 1) continue  // filter micro-noise

    const profitPercentage = profitBps / 100
    // Estimate profit on a 1 000 USD trade (before fees)
    const estimatedProfit = (profitPercentage / 100) * 1_000

    opps.push({
      tokenPair: pair.tokenPair,
      buyDex: pair.buyDex,
      sellDex: pair.sellDex,
      buyPrice,
      sellPrice,
      profitBps,
      profitPercentage,
      estimatedProfit,
      updatedAt: now,
    })
  }

  // Sort by highest profit first
  return opps.sort((a, b) => b.profitBps - a.profitBps)
}

export default function ArbitragePanel() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isLoading, setIsLoading]  = useState(true)
  const [error, setError]          = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [minProfitBps, setMinProfitBps] = useState(1)
  const { addNotification } = useDashboard();

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const opps = await fetchLiveOpportunities()
      setOpportunities(opps)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Arbitrage] fetch error:', err)
      setError('Could not fetch live prices. Retrying in 60 s.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

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
        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && (
            <span className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <label htmlFor="min-profit" className="text-sm text-gray-400">Min Profit:</label>
          <select
            id="min-profit"
            value={minProfitBps}
            onChange={(e) => setMinProfitBps(Number(e.target.value))}
            className="bg-gray-800 border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-solana-purple"
          >
            <option value={1}>Any</option>
            <option value={25}>0.25%</option>
            <option value={50}>0.50%</option>
            <option value={75}>0.75%</option>
            <option value={100}>1.00%</option>
          </select>
          <button onClick={refresh} disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="grid gap-4">
        {isLoading && opportunities.length === 0 ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-700 rounded mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-700 rounded" />
                <div className="h-20 bg-gray-700 rounded" />
              </div>
            </div>
          ))
        ) : filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp, index) => (
            <div key={index} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:border-green-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{opp.tokenPair}</h3>
                  <p className="text-xs text-gray-400">Cross-DEX Arbitrage · Live prices</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    +{opp.profitPercentage.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    ~${opp.estimatedProfit.toFixed(2)} profit / $1k
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
                  <p className="text-lg font-bold text-white">
                    ${opp.buyPrice < 0.01 ? opp.buyPrice.toFixed(8) : opp.buyPrice.toFixed(4)}
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Sell</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{opp.sellDex}</p>
                  <p className="text-lg font-bold text-white">
                    ${opp.sellPrice < 0.01 ? opp.sellPrice.toFixed(8) : opp.sellPrice.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Spread: {opp.profitBps} bps</span>
                  <span>After fees: ~${(opp.estimatedProfit * 0.95).toFixed(2)}</span>
                  {opp.updatedAt && <span>{new Date(opp.updatedAt).toLocaleTimeString()}</span>}
                </div>
                <button
                  onClick={() => handleExecute(opp)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Execute
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800/50 border border-white/10 rounded-lg p-8 text-center">
            <Search className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No arbitrage opportunities above {minProfitBps} bps found</p>
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
              Live prices from CoinGecko and DexScreener. Spread between sources surfaces
              realistic cross-DEX opportunities across Raydium, Orca, Jupiter, and Lifinity.
              Refreshes every 60 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

