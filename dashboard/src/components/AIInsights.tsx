'use client'

import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AIInsights() {
  const [insights, setInsights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate AI analysis
    setTimeout(() => {
      setInsights([
        {
          type: 'positive',
          icon: CheckCircle2,
          title: 'Optimal Performance',
          message: 'All agents are performing above 95% success rate. System health is excellent.',
          confidence: 98
        },
        {
          type: 'info',
          icon: TrendingUp,
          title: 'Portfolio Opportunity',
          message: 'SOL allocation could be increased by 5% based on current market conditions.',
          confidence: 87
        },
        {
          type: 'warning',
          icon: AlertCircle,
          title: 'Proposal Bottleneck',
          message: '2 proposals pending for >6 hours. Consider increasing voting participation.',
          confidence: 92
        }
      ])
      setIsLoading(false)
    }, 2000)
  }, [])

  return (
    <div className="card-gradient rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        <h3 className="text-lg font-bold text-white">AI-Powered Insights</h3>
      </div>

      {isLoading ? (
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
