'use client'

import { memo } from 'react'
import { Users, FileText, CheckCircle, DollarSign } from 'lucide-react'

interface MetricsPanelProps {
  data: {
    totalAgents: number
    totalProposals: number
    activeProposals: number
    portfolioValue: number
  }
}

/** Tiny helper – returns a coloured "+N" / "−N" / "—" change pill */
function ChangeBadge({ value }: { value: string }) {
  const isPositive = value.startsWith('+')
  const isNeutral = value === '—'
  return (
    <p
      className={`text-xs sm:text-sm truncate font-medium ${
        isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {value} from last hour
    </p>
  )
}

function MetricsPanelInner({ data }: MetricsPanelProps) {
  const metrics = [
    {
      label: 'Active Agents',
      value: data.totalAgents,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      change: data.totalAgents > 0 ? `+${data.totalAgents}` : '—',
    },
    {
      label: 'Total Proposals',
      value: data.totalProposals,
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      change: data.totalProposals > 0 ? `+${data.totalProposals}` : '—',
    },
    {
      label: 'Active Proposals',
      value: data.activeProposals,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      change: data.activeProposals > 0 ? `+${data.activeProposals}` : '—',
    },
    {
      label: 'Portfolio Value',
      value: `$${data.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
      change: data.portfolioValue > 0 ? '—' : '—',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={index}
            className="card-gradient rounded-xl p-4 sm:p-6 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1 truncate">{metric.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">{metric.value}</p>
                <ChangeBadge value={metric.change} />
              </div>
              <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-br ${metric.color} flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Memoize: only re-renders when swarmData values actually change
const MetricsPanel = memo(MetricsPanelInner)
export default MetricsPanel
