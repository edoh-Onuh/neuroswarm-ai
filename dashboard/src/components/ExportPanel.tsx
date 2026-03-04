'use client'

import { Download, FileText, FileSpreadsheet, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import { useSwarmAccounts } from '@/hooks/useSwarmAccounts'

export default function ExportPanel() {
  const [isExporting, setIsExporting] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const { addNotification } = useDashboard()
  const { agents, proposals, swarmState } = useSwarmAccounts()

  const handleExport = async (format: 'json' | 'csv' | 'share') => {
    setIsExporting(true)

    const data = {
      exportedAt: new Date().toISOString(),
      dashboard: 'NeuroSwarm AI',
      network: process.env.NEXT_PUBLIC_CLUSTER ?? 'devnet',
      swarmState: swarmState ? {
        activeAgents: swarmState.activeAgents,
        totalProposals: Number(swarmState.totalProposals),
      } : null,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        reputation: a.reputation,
        votescast: a.votescast,
        successRate: a.successRate,
        proposalsCreated: a.proposalsCreated ?? 0,
      })),
      proposals: proposals.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        status: p.status,
        proposer: p.proposer,
        votesFor: p.votesFor,
        votesAgainst: p.votesAgainst,
        totalVotes: p.totalVotes,
        timeLeft: p.timeLeft,
      })),
    }
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neuroswarm-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', title: 'Export Complete', message: `JSON exported with ${agents.length} agents and ${proposals.length} proposals.` })
    } else if (format === 'csv') {
      const rows: string[][] = [
        ['Section', 'ID', 'Name', 'Type', 'Status', 'Value1', 'Value2'],
        ...agents.map(a => ['Agent', a.id, a.name, a.type, a.status, `Rep:${a.reputation}`, `Success:${a.successRate}%`]),
        ...proposals.map(p => ['Proposal', String(p.id), p.title, p.type, p.status, `For:${p.votesFor}`, `Against:${p.votesAgainst}`]),
      ]
      const csvContent = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neuroswarm-export-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', title: 'Export Complete', message: `CSV exported with ${rows.length - 1} rows.` })
    } else if (format === 'share') {
      // Copy a summary to clipboard (no fake share URL)
      const summary = `NeuroSwarm AI — ${agents.length} agents, ${proposals.length} proposals on ${data.network} (${data.exportedAt})`
      await navigator.clipboard.writeText(summary)
      setShareLink(summary)
      addNotification({ type: 'success', title: 'Copied', message: 'Dashboard summary copied to clipboard.' })
    }
    
    setIsExporting(false)
  }

  return (
    <div className="card-gradient rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
        <Download className="w-5 h-5" />
        <span>Export & Share</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all hover:scale-105 disabled:opacity-50"
        >
          <FileText className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-sm font-medium text-white">JSON</span>
          <span className="text-xs text-gray-400">Raw data</span>
        </button>

        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all hover:scale-105 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-8 h-8 text-green-400 mb-2" />
          <span className="text-sm font-medium text-white">CSV</span>
          <span className="text-xs text-gray-400">Spreadsheet</span>
        </button>

        <button
          onClick={() => handleExport('share')}
          disabled={isExporting}
          className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Share2 className="w-8 h-8 text-purple-400 mb-2" />
          <span className="text-sm font-medium text-white">Share</span>
          <span className="text-xs text-gray-400">Generate link</span>
        </button>
      </div>
      
      {shareLink && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-xs text-gray-300 mb-1">Share link copied to clipboard!</p>
          <code className="text-xs text-green-400 break-all">{shareLink}</code>
        </div>
      )}
      
      {isExporting && (
        <div className="mt-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-solana-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 mt-2">Preparing export...</p>
        </div>
      )}
    </div>
  )
}
