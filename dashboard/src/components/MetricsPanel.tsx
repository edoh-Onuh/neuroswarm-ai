'use client'

import { Users, FileText, CheckCircle, DollarSign } from 'lucide-react'

interface MetricsPanelProps {
  data: {
    totalAgents: number
    totalProposals: number
    activeProposals: number
    portfolioValue: number
  }
}

export default function MetricsPanel({ data }: MetricsPanelProps) {
  const metrics = [
    {
      label: 'Active Agents',
      value: data.totalAgents,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      change: '+0%',
    },
    {
      label: 'Total Proposals',
      value: data.totalProposals,
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      change: '+20%',
    },
    {
      label: 'Active Proposals',
      value: data.activeProposals,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      change: '+50%',
    },
    {
      label: 'Portfolio Value',
      value: `$${data.portfolioValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-500',
      change: '+2.5%',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={index}
            className="card-gradient rounded-xl p-4 sm:p-6 hover:scale-105 transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-1 truncate">{metric.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">{metric.value}</p>
                <p className="text-xs sm:text-sm text-green-400 truncate">{metric.change} from last hour</p>
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
