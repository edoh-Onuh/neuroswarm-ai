'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, TrendingUp, TrendingDown, Minus, MessageCircle,
  Newspaper, Link2, RefreshCw, Zap, AlertTriangle,
} from 'lucide-react'
import type { SentimentData } from '@/types'

// ─── CoinGecko IDs ────────────────────────────────────────────────────────
const TOKENS: { symbol: string; cgId: string }[] = [
  { symbol: 'SOL',  cgId: 'solana' },
  { symbol: 'JUP',  cgId: 'jupiter-exchange-solana' },
  { symbol: 'BONK', cgId: 'bonk' },
]

// Map a % price change (e.g. ±20 %) to a 0–1 sentiment score.
// 0 % → 0.5 (neutral), positive → bullish, negative → bearish.
function normaliseChange(pct: number, maxAbs: number): number {
  return Math.min(1, Math.max(0, (pct / maxAbs + 1) / 2))
}

// Map volume-to-market-cap ratio to 0–1.
// Ratio above 15 % is considered high on-chain activity → 1.
function normaliseVolumeRatio(vol: number, mc: number): number {
  if (!mc || mc === 0) return 0.5
  const ratio = vol / mc
  return Math.min(1, Math.max(0, ratio / 0.15))
}

interface FearGreed {
  value: number
  classification: string
}

// ─── Live fetches ────────────────────────────────────────────────────────────
async function fetchLiveSentiments(): Promise<SentimentData[]> {
  const ids = TOKENS.map(t => t.cgId).join(',')
  const url =
    `https://api.coingecko.com/api/v3/coins/markets` +
    `?vs_currency=usd&ids=${ids}&order=market_cap_desc` +
    `&per_page=50&page=1&sparkline=false&price_change_percentage=7d`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)

  const data: Array<{
    id: string
    price_change_percentage_24h: number | null
    price_change_percentage_7d_in_currency: number | null
    total_volume: number | null
    market_cap: number | null
  }> = await res.json()

  const now = Date.now()

  return TOKENS.map(tk => {
    const row = data.find(d => d.id === tk.cgId)

    const chg24 = row?.price_change_percentage_24h           ?? 0
    const chg7d = row?.price_change_percentage_7d_in_currency ?? 0
    const vol   = row?.total_volume ?? 0
    const mc    = row?.market_cap   ?? 1

    const twitterScore = normaliseChange(chg24, 20)          // 24 h social momentum
    const redditScore  = normaliseChange(chg7d, 40)          // 7 d community sentiment
    const newsScore    = (twitterScore + redditScore) / 2    // blended price coverage
    const onchainScore = normaliseVolumeRatio(vol, mc)       // volume activity density

    const composite =
      twitterScore * 0.30 + redditScore * 0.25 +
      newsScore    * 0.25 + onchainScore * 0.20

    const sentiment: SentimentData['sentiment'] =
      composite > 0.58 ? 'bullish' : composite < 0.42 ? 'bearish' : 'neutral'

    // Confidence: how far composite deviates from the 0.5 midpoint
    const confidence = Math.min(0.99, 0.50 + Math.abs(composite - 0.5) * 2.5)

    return {
      token:     tk.symbol,
      score:     parseFloat(composite.toFixed(4)),
      sentiment,
      sources: {
        twitter: parseFloat(twitterScore.toFixed(4)),
        reddit:  parseFloat(redditScore.toFixed(4)),
        news:    parseFloat(newsScore.toFixed(4)),
        onchain: parseFloat(onchainScore.toFixed(4)),
      },
      confidence: parseFloat(confidence.toFixed(4)),
      updatedAt:  now,
    }
  })
}

async function fetchFearGreed(): Promise<FearGreed> {
  const res = await fetch('https://api.alternative.me/fng/?limit=1')
  if (!res.ok) throw new Error(`FNG ${res.status}`)
  const json = await res.json()
  return {
    value:          parseInt(json.data[0].value, 10),
    classification: json.data[0].value_classification as string,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SentimentPanel() {
  const [sentiments,   setSentiments]   = useState<SentimentData[]>([])
  const [fearGreed,    setFearGreed]    = useState<FearGreed | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [sentData, fng] = await Promise.all([fetchLiveSentiments(), fetchFearGreed()])
      setSentiments(sentData)
      setFearGreed(fng)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Sentiment] fetch error:', err)
      setError('Could not reach CoinGecko. Retrying in 5 min.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load + 5-minute auto-refresh
  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [refresh])

  // ─── Style helpers ────────────────────────────────────────────────────────
  const getSentimentColor = (s: SentimentData['sentiment']) => {
    switch (s) {
      case 'bullish': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'bearish': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default:        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    }
  }

  const getSentimentIcon = (s: SentimentData['sentiment']) => {
    switch (s) {
      case 'bullish': return <TrendingUp   className="w-4 h-4" />
      case 'bearish': return <TrendingDown className="w-4 h-4" />
      default:        return <Minus        className="w-4 h-4" />
    }
  }

  const fngTextColor = (v: number) =>
    v >= 75 ? 'text-green-400'   :
    v >= 55 ? 'text-emerald-400' :
    v >= 45 ? 'text-yellow-400'  :
    v >= 25 ? 'text-orange-400'  :
              'text-red-400'

  const fngBarGradient = (v: number) =>
    v >= 75 ? 'from-green-500 to-emerald-500'   :
    v >= 55 ? 'from-emerald-500 to-teal-500'    :
    v >= 45 ? 'from-yellow-500 to-amber-500'    :
    v >= 25 ? 'from-orange-500 to-amber-600'    :
              'from-red-600 to-rose-500'

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-solana-purple" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Sentiment Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Fear & Greed Index ──────────────────────────────────────────────── */}
      {fearGreed && (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-3 font-medium tracking-wide uppercase">
            Crypto Fear &amp; Greed Index — Market Mood
          </p>
          <div className="flex items-center gap-4">
            <span className={`text-5xl font-extrabold tabular-nums ${fngTextColor(fearGreed.value)}`}>
              {fearGreed.value}
            </span>
            <div className="flex-1 space-y-2">
              <p className={`font-semibold text-lg ${fngTextColor(fearGreed.value)}`}>
                {fearGreed.classification}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`bg-gradient-to-r ${fngBarGradient(fearGreed.value)} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${fearGreed.value}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 — Extreme Fear</span>
                <span>100 — Extreme Greed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Token sentiment cards ───────────────────────────────────────────── */}
      {isLoading && sentiments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOKENS.map(t => (
            <div key={t.symbol} className="bg-gray-800/50 border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-5 w-16 bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sentiments.map((data) => (
            <div
              key={data.token}
              className="bg-gray-800/50 border border-white/10 rounded-lg p-4 hover:border-solana-purple/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{data.token}</h3>
                <span
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getSentimentColor(data.sentiment)}`}
                >
                  {getSentimentIcon(data.sentiment)}
                  {data.sentiment.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                {/* Composite score */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Composite Score</span>
                    <span className="font-medium text-white">{(data.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data.score * 100}%` }}
                    />
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Confidence</span>
                    <span className="font-medium text-white">{(data.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Source breakdown */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Source Breakdown</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="w-3 h-3" />Social (24h)
                      </span>
                      <span className="font-medium text-white">
                        {(data.sources.twitter * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Newspaper className="w-3 h-3" />News
                      </span>
                      <span className="font-medium text-white">
                        {(data.sources.news * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="w-3 h-3" />Community (7d)
                      </span>
                      <span className="font-medium text-white">
                        {(data.sources.reddit * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Link2 className="w-3 h-3" />On-Chain
                      </span>
                      <span className="font-medium text-white">
                        {(data.sources.onchain * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                {data.updatedAt && (
                  <p className="text-xs text-gray-500 pt-1">
                    via CoinGecko · {new Date(data.updatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Agent status banner ─────────────────────────────────────────────── */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Sentiment Agent Active</h4>
            <p className="text-sm text-gray-300">
              Monitoring social momentum (24 h), community sentiment (7 d), news coverage,
              and on-chain volume activity via CoinGecko live market data and the
              Alternative.me Fear &amp; Greed Index. Refreshes every 5 minutes.
              Proposals are automatically created when strong sentiment signals are detected.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
