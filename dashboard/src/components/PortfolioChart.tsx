'use client'

import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw, Zap, Wallet } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'

// ─── Token mints (devnet) ───────────────────────────────────────────
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const TOKEN_COLORS: Record<string, string> = {
  SOL: '#9945FF',
  USDC: '#14F195',
  JUP: '#80ecff',
  BONK: '#FF6B6B',
}

interface Holding {
  name: string
  balance: number
  valueUsd: number
  allocation: number
  change24h: number
  color: string
}

interface HistoryPoint {
  time: string
  value: number
}

export default function PortfolioChart() {
  const { isConnected, connectedAddress } = useWallet()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(new Set())
  const [isRebalancing, setIsRebalancing] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    if (!connectedAddress) return
    setIsLoading(true)
    try {
      // Fetch SOL balance via RPC.
      // Solana's public api.mainnet-beta.solana.com blocks browser requests (403).
      // Use free browser-friendly endpoints with fallback chain.
      const RPC_ENDPOINTS = [
        process.env.NEXT_PUBLIC_RPC_URL,
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://rpc.ankr.com/solana',
        'https://solana.public-rpc.com',
      ].filter(Boolean) as string[]

      let balJson: { result?: { value?: number } } | null = null
      for (const rpcUrl of RPC_ENDPOINTS) {
        try {
          const balRes = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1,
              method: 'getBalance',
              params: [connectedAddress],
            }),
          })
          if (balRes.ok) {
            balJson = await balRes.json()
            if (balJson?.result?.value !== undefined) {
              console.log('[Portfolio] RPC ok:', rpcUrl)
              break
            }
          }
        } catch { /* try next endpoint */ }
      }
      const solBalance = ((balJson?.result?.value) ?? 0) / 1e9

      // Fetch SOL price — try multiple free APIs (Jupiter v2 now requires an API key)
      let solPrice = 0
      try {
        // 1. CoinGecko free API (no key needed, 30 req/min)
        const cgRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        )
        if (cgRes.ok) {
          const cgJson = await cgRes.json()
          solPrice = cgJson?.solana?.usd ?? 0
        }
      } catch { /* CoinGecko failed */ }

      if (!solPrice) {
        try {
          // 2. Fallback: Jupiter Price API v2 (may 401 without key)
          const priceRes = await fetch(`https://api.jup.ag/price/v2?ids=${SOL_MINT}`)
          if (priceRes.ok) {
            const priceJson = await priceRes.json()
            solPrice = parseFloat(priceJson?.data?.[SOL_MINT]?.price ?? '0')
          }
        } catch { /* price fetch failed */ }
      }

      const solValue = solBalance * solPrice
      const total = solValue // extend when SPL token balances added

      const holdingsList: Holding[] = []
      if (solBalance > 0) {
        holdingsList.push({
          name: 'SOL',
          balance: solBalance,
          valueUsd: solValue,
          allocation: total > 0 ? (solValue / total) * 100 : 0,
          change24h: 0, // would need historical price for real change
          color: TOKEN_COLORS.SOL ?? '#9945FF',
        })
      }

      setHoldings(holdingsList)
      // Only set prevValue after we already have a baseline — avoid showing
      // a false +100% change on first load
      setPrevValue((prev) => (prev === null ? total : totalValue))
      setTotalValue(total)

      // Build simple history (append current value)
      setHistory(prev => {
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const next = [...prev, { time: timeStr, value: total }]
        return next.slice(-24) // keep last 24 data points
      })
    } catch (err) {
      console.error('Portfolio fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [connectedAddress, totalValue])

  // Fetch on connect and periodically
  useEffect(() => {
    if (!isConnected || !connectedAddress) {
      setHoldings([])
      setHistory([])
      setTotalValue(0)
      setPrevValue(null)
      return
    }
    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, 30_000) // refresh every 30s
    return () => clearInterval(interval)
  }, [isConnected, connectedAddress, fetchPortfolio])

  const dayChange = prevValue !== null ? totalValue - prevValue : 0
  const dayChangePercent = prevValue && prevValue > 0 ? (dayChange / prevValue) * 100 : 0

  const toggleToken = (tokenName: string) => {
    const newHidden = new Set(hiddenTokens)
    if (newHidden.has(tokenName)) {
      newHidden.delete(tokenName)
    } else {
      newHidden.add(tokenName)
    }
    setHiddenTokens(newHidden)
  }

  const handleRebalance = () => {
    setIsRebalancing(true)
    setTimeout(() => setIsRebalancing(false), 2000)
  }

  const rpcNetwork = (process.env.NEXT_PUBLIC_RPC_URL ?? '').includes('devnet')
    ? 'Devnet'
    : (process.env.NEXT_PUBLIC_RPC_URL ?? '').includes('testnet')
    ? 'Testnet'
    : 'Mainnet Beta'

  const visibleHoldings = holdings.filter(h => !hiddenTokens.has(h.name))

  // ─── Not connected ─────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="card-gradient rounded-xl p-12 text-center">
        <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Connect a Solana wallet to view your portfolio holdings, balances, and allocation in real time.
        </p>
      </div>
    )
  }

  // ─── Loading state ─────────────────────────────────────────────
  if (isLoading && holdings.length === 0) {
    return (
      <div className="card-gradient rounded-xl p-12 text-center">
        <RefreshCw className="w-10 h-10 text-solana-purple mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Loading portfolio...</p>
      </div>
    )
  }

  // ─── Empty portfolio ────────────────────────────────────────────
  if (!isLoading && holdings.length === 0) {
    return (
      <div className="card-gradient rounded-xl p-12 text-center">
        <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Holdings Found</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-4">
          This wallet has no SOL balance on {rpcNetwork}.
        </p>
        <button
          onClick={fetchPortfolio}
          className="px-4 py-2 rounded-lg bg-solana-purple/20 hover:bg-solana-purple/30 border border-solana-purple/50 text-white text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Value Card */}
      <div className="card-gradient rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Portfolio Value</h2>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-white">${totalValue.toFixed(2)}</span>
              <div className={`flex items-center space-x-1 ${dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dayChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-semibold">{dayChange >= 0 ? '+' : '-'}${Math.abs(dayChange).toFixed(2)}</span>
                <span className="text-sm">({dayChangePercent >= 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%)</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {rpcNetwork} &middot; Last 24 hours
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9945FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9945FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(153,69,255,0.5)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#9945FF" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Asset Allocation</h3>
            <button
              onClick={handleRebalance}
              disabled={isRebalancing}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-solana-purple/20 hover:bg-solana-purple/30 border border-solana-purple/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRebalancing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{isRebalancing ? 'Rebalancing...' : 'Rebalance'}</span>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center relative">
            {visibleHoldings.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visibleHoldings.map(h => ({ name: h.name, value: h.allocation, color: h.color }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} ${Math.round(entry.value)}%`}
                      outerRadius={selectedToken ? 75 : 80}
                      innerRadius={selectedToken ? 40 : 0}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={800}
                      onMouseEnter={(data) => setSelectedToken(data.name)}
                      onMouseLeave={() => setSelectedToken(null)}
                    >
                      {visibleHoldings.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          opacity={selectedToken ? (selectedToken === entry.name ? 1 : 0.3) : 1}
                          className="cursor-pointer transition-all hover:scale-110"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        border: '1px solid rgba(153,69,255,0.5)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {selectedToken && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-gray-900/90 rounded-lg p-4 border border-solana-purple/50">
                      <p className="text-white font-bold text-xl">{selectedToken}</p>
                      <p className="text-gray-400 text-sm">
                        {holdings.find(t => t.name === selectedToken)?.allocation.toFixed(0)}% allocation
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400">
                <EyeOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All tokens hidden</p>
                <p className="text-sm">Click to show tokens</p>
              </div>
            )}
          </div>
        </div>

        {/* Holdings List */}
        <div className="card-gradient rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Holdings</h3>
            <div className="text-xs text-gray-400">
              {visibleHoldings.length} / {holdings.length} visible
            </div>
          </div>
          <div className="space-y-3">
            {holdings.map((token) => {
              const isHidden = hiddenTokens.has(token.name)
              const isSelected = selectedToken === token.name
              
              return (
                <div 
                  key={token.name} 
                  className={`group relative p-3 rounded-lg transition-all cursor-pointer border ${
                    isHidden 
                      ? 'bg-white/5 opacity-50 border-white/10' 
                      : isSelected
                      ? 'bg-white/20 border-solana-purple scale-105 shadow-lg'
                      : 'bg-white/10 border-white/10 hover:bg-white/15 hover:scale-102 hover:border-solana-purple/50'
                  }`}
                  onMouseEnter={() => !isHidden && setSelectedToken(token.name)}
                  onMouseLeave={() => setSelectedToken(null)}
                  onClick={() => toggleToken(token.name)}
                >
                  {/* Progress bar background */}
                  <div 
                    className="absolute inset-0 rounded-lg opacity-20 transition-all"
                    style={{ 
                      background: `linear-gradient(to right, ${token.color} ${isHidden ? 0 : token.allocation}%, transparent ${isHidden ? 0 : token.allocation}%)`,
                    }}
                  />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-transform ${
                          isSelected ? 'scale-110' : 'group-hover:scale-110'
                        }`}
                        style={{ backgroundColor: token.color }}
                      >
                        {token.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-semibold text-white">{token.name}</div>
                          {isHidden && <EyeOff className="w-4 h-4 text-gray-400" />}
                          {!isHidden && isSelected && <Eye className="w-4 h-4 text-solana-green animate-pulse" />}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{token.allocation.toFixed(0)}% allocation</span>
                          <span>•</span>
                          <span className="text-gray-300">{token.balance.toFixed(4)} {token.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {!isHidden && (
                        <>
                          <div className="font-semibold text-white">${token.valueUsd.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">{token.balance.toFixed(4)}</div>
                        </>
                      )}
                      {isHidden && (
                        <div className="text-sm text-gray-500">Hidden</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover action hint */}
                  <div className={`absolute -top-2 -right-2 transition-all ${
                    isSelected || isHidden 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    <div className={`p-1 rounded-full ${isHidden ? 'bg-gray-600' : 'bg-solana-purple'}`}>
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
            <button
              onClick={() => setHiddenTokens(new Set())}
              disabled={hiddenTokens.size === 0}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Show All</span>
            </button>
            <button
              onClick={() => setSelectedToken(null)}
              disabled={!selectedToken}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Clear Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
