'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { addSnapshot, computeStats, type PortfolioStats } from '@/lib/history'

const STAT_CARD = ({
  label,
  value,
  sub,
  positive,
}: {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
}) => (
  <div className="card-gradient rounded-xl p-5">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${
      positive === true ? 'text-green-400' :
      positive === false ? 'text-red-400' :
      'text-white'
    }`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
)

export default function HistoryPanel() {
  const { isConnected, connectedAddress } = useWallet()
  const [stats, setStats]     = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [range, setRange]     = useState<'1h' | '24h' | '7d' | 'all'>('24h')

  const load = useCallback(async () => {
    if (!connectedAddress) return
    setLoading(true)
    setError(null)
    try {
      const s = await computeStats(connectedAddress)
      setStats(s)
    } catch {
      setError('Failed to load history from local store.')
    } finally {
      setLoading(false)
    }
  }, [connectedAddress])

  // Poll SOL price + balance every 60s and write a snapshot
  useEffect(() => {
    if (!connectedAddress) return

    const record = async () => {
      try {
        // SOL balance
        const rpcUrls = [
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
          'https://rpc.ankr.com/solana',
          'https://solana.public-rpc.com',
        ].filter(Boolean) as string[]

        let solBalance = 0
        for (const url of rpcUrls) {
          try {
            const r = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [connectedAddress] }),
            })
            if (r.ok) {
              const j = await r.json()
              if (typeof j?.result?.value === 'number') {
                solBalance = j.result.value / 1e9
                break
              }
            }
          } catch { /* next */ }
        }

        // SOL/USD price
        let solPrice = 0
        try {
          const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          if (cg.ok) solPrice = (await cg.json())?.solana?.usd ?? 0
        } catch { /* pass */ }
        if (!solPrice) {
          try {
            const jp = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112')
            if (jp.ok) solPrice = parseFloat((await jp.json())?.data?.['So11111111111111111111111111111111111111112']?.price ?? '0')
          } catch { /* pass */ }
        }

        await addSnapshot({
          address: connectedAddress,
          ts: Date.now(),
          solBalance,
          usdValue: solBalance * solPrice,
          solPrice,
        })
        load()
      } catch (e) {
        console.warn('[HistoryPanel]', e)
      }
    }

    record()
    const iv = setInterval(record, 60_000)
    return () => clearInterval(iv)
  }, [connectedAddress, load])

  // Filter snapshots by range
  const chartData = (() => {
    if (!stats) return []
    const now = Date.now()
    const cutoff = range === '1h'  ? now - 3_600_000
                 : range === '24h' ? now - 86_400_000
                 : range === '7d'  ? now - 604_800_000
                 : 0
    return stats.snapshots
      .filter(s => s.ts >= cutoff)
      .map(s => ({
        time:  new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: parseFloat(s.usdValue.toFixed(4)),
        sol:   parseFloat(s.solBalance.toFixed(4)),
      }))
  })()

  const formatUsd = (n: number) =>
    n >= 1 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
           : `$${n.toFixed(6)}`

  if (!isConnected || !connectedAddress) {
    return (
      <div className="card-gradient rounded-xl p-10 text-center">
        <Activity className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">Connect your wallet to view portfolio history.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Portfolio History</h2>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <STAT_CARD
          label="Current Value"
          value={stats ? formatUsd(stats.currentValue) : '--'}
        />
        <STAT_CARD
          label="Change (period)"
          value={stats ? `${stats.changePct >= 0 ? '+' : ''}${stats.changePct.toFixed(2)}%` : '--'}
          sub={stats ? formatUsd(stats.changeUsd) : undefined}
          positive={stats ? stats.changeUsd >= 0 : null}
        />
        <STAT_CARD
          label="Sharpe Ratio"
          value={stats?.sharpe != null ? stats.sharpe.toFixed(2) : 'N/A'}
          sub="Annualised proxy"
          positive={stats?.sharpe != null ? stats.sharpe > 1 : null}
        />
        <STAT_CARD
          label="Max Drawdown"
          value={stats ? `${stats.maxDrawdownPct.toFixed(1)}%` : '--'}
          sub="Peak-to-trough"
          positive={stats ? stats.maxDrawdownPct < 10 : null}
        />
      </div>

      {/* Chart */}
      <div className="card-gradient rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">USD Value Over Time</h3>
          <div className="flex gap-1">
            {(['1h', '24h', '7d', 'all'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  range === r ? 'bg-solana-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            {loading ? 'Loading...' : 'Not enough data yet. Check back after a few snapshots are recorded.'}
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9945FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9945FF" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" style={{ fontSize: 11 }} tick={{ dy: 4 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v.toFixed(3)}`} width={72} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,10,20,0.95)', border: '1px solid rgba(153,69,255,0.4)', borderRadius: 8, color: 'white', fontSize: 12 }}
                  formatter={(v: number) => [formatUsd(v), 'USD Value']}
                />
                {stats && (
                  <ReferenceLine y={stats.snapshots[0]?.usdValue} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                )}
                <Area
                  type="monotone" dataKey="value"
                  stroke="#9945FF" strokeWidth={2}
                  fill="url(#histGrad)"
                  dot={false} activeDot={{ r: 4, fill: '#14F195' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SOL balance table */}
      {chartData.length > 0 && (
        <div className="card-gradient rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent Snapshots</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left pb-2">Time</th>
                  <th className="text-right pb-2">SOL Balance</th>
                  <th className="text-right pb-2">SOL Price</th>
                  <th className="text-right pb-2">USD Value</th>
                </tr>
              </thead>
              <tbody>
                {stats!.snapshots.slice(-10).reverse().map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 text-gray-300">{new Date(s.ts).toLocaleTimeString()}</td>
                    <td className="py-2 text-right text-white">{s.solBalance.toFixed(6)}</td>
                    <td className="py-2 text-right text-gray-300">${s.solPrice.toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${
                      i === 0 ? 'text-white' :
                      s.usdValue > stats!.snapshots.slice(-10).reverse()[i - 1]?.usdValue
                        ? 'text-green-400' : 'text-red-400'
                    }`}>{formatUsd(s.usdValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="card-gradient rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-solana-purple flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-1">About This Data</h4>
            <p className="text-sm text-gray-400">
              Snapshots are stored locally in your browser (IndexedDB). They capture your SOL
              balance from on-chain RPC and the USD price from CoinGecko every 60 seconds.
              Historical data is retained for up to 24 hours (1 440 snapshots per wallet).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
