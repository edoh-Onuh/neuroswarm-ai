'use client'

import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useSwarmAccounts } from '@/hooks/useSwarmAccounts'
import type { Insight } from '@/types'

export default function AIInsights() {
  const { agents, proposals, isLoading } = useSwarmAccounts()

  const insights = useMemo<Insight[]>(() => {
    if (agents.length === 0 && proposals.length === 0) return []

    const result: Insight[] = []

    // ── Agent performance insight ─────────────────────────────────
    if (agents.length > 0) {
      const avgSuccess = Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length)
      const activeCount = agents.filter(a => a.status === 'active').length
      const lowRepAgents = agents.filter(a => a.reputation < 80)

      if (avgSuccess >= 90) {
        result.push({
          type: 'positive',
          icon: CheckCircle2,
          title: 'Strong Agent Performance',
          message: `${activeCount}/${agents.length} agents active with ${avgSuccess}% average success rate across the swarm.`,
          confidence: Math.min(avgSuccess, 99),
        })
      } else if (avgSuccess >= 70) {
        result.push({
          type: 'info',
          icon: TrendingUp,
          title: 'Moderate Performance',
          message: `Average agent success rate is ${avgSuccess}%. ${agents.length - activeCount} agent(s) currently idle.`,
          confidence: avgSuccess,
        })
      } else {
        result.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Performance Needs Attention',
          message: `Average success rate has dropped to ${avgSuccess}%. Consider reviewing agent strategies.`,
          confidence: 100 - avgSuccess,
        })
      }

      if (lowRepAgents.length > 0) {
        result.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Low Reputation Agents',
          message: `${lowRepAgents.length} agent(s) below 80 reputation: ${lowRepAgents.map(a => a.name).join(', ')}.`,
          confidence: Math.round(80 - lowRepAgents.reduce((s, a) => s + a.reputation, 0) / lowRepAgents.length + 50),
        })
      }
    }

    // ── Proposal insights ─────────────────────────────────────────
    const activeProps = proposals.filter(p => p.status === 'active')
    const passedProps = proposals.filter(p => p.status === 'passed')
    const rejectedProps = proposals.filter(p => p.status === 'rejected')

    if (activeProps.length > 0) {
      const lowVoteProps = activeProps.filter(p => p.totalVotes < 3)
      if (lowVoteProps.length > 0) {
        result.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Proposals Need Votes',
          message: `${lowVoteProps.length} active proposal(s) have fewer than 3 votes. Consider increasing participation.`,
          confidence: 90,
        })
      } else {
        result.push({
          type: 'info',
          icon: TrendingUp,
          title: `${activeProps.length} Active Proposal(s)`,
          message: `All active proposals have sufficient voting participation. Average ${Math.round(activeProps.reduce((s, p) => s + p.totalVotes, 0) / activeProps.length)} votes each.`,
          confidence: 85,
        })
      }
    }

    if (proposals.length > 0 && passedProps.length + rejectedProps.length > 0) {
      const passRate = Math.round((passedProps.length / (passedProps.length + rejectedProps.length)) * 100)
      result.push({
        type: passRate >= 60 ? 'positive' : 'info',
        icon: passRate >= 60 ? CheckCircle2 : TrendingUp,
        title: 'Governance Health',
        message: `${passRate}% proposal pass rate (${passedProps.length} passed, ${rejectedProps.length} rejected). ${proposals.length} total proposals on-chain.`,
        confidence: Math.min(passRate + 10, 99),
      })
    }

    // ── Voting participation ──────────────────────────────────────
    if (agents.length > 0) {
      const totalVotes = agents.reduce((s, a) => s + a.votescast, 0)
      const avgVotes = Math.round(totalVotes / agents.length)
      if (totalVotes > 0) {
        result.push({
          type: avgVotes >= 5 ? 'positive' : 'info',
          icon: avgVotes >= 5 ? CheckCircle2 : TrendingUp,
          title: 'Voting Activity',
          message: `${totalVotes} total votes cast across ${agents.length} agents (avg ${avgVotes} per agent).`,
          confidence: Math.min(avgVotes * 10 + 50, 99),
        })
      }
    }

    // ── No data fallback ──────────────────────────────────────────
    if (result.length === 0) {
      result.push({
        type: 'info',
        icon: Sparkles,
        title: 'Awaiting Data',
        message: 'Not enough on-chain activity yet to generate insights. Register agents and create proposals to see AI-powered analysis.',
        confidence: 50,
      })
    }

    return result.slice(0, 4) // show up to 4 insights
  }, [agents, proposals])

  return (
    <div className="card-gradient rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
      </div>

      {isLoading && insights.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer ${
                  insight.type === 'positive' ? 'border-green-500/30 bg-green-500/10' :
                  insight.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                  'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    insight.type === 'positive' ? 'text-green-400' :
                    insight.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-xs text-gray-300">{insight.message}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-solana-purple to-solana-green"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{insight.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
