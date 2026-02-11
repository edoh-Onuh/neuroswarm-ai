'use client'

import { Download, FileText, FileSpreadsheet, Share2 } from 'lucide-react'
import { useState } from 'react'

export default function ExportPanel() {
  const [isExporting, setIsExporting] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)

  const handleExport = async (format: 'json' | 'csv' | 'share') => {
    setIsExporting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const data = {
      agents: 5,
      proposals: 6,
      portfolio: 397.50,
      timestamp: new Date().toISOString()
    }
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neuroswarm-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      // Convert data to CSV format
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Agents', data.agents],
        ['Total Proposals', data.proposals],
        ['Portfolio Value', `$${data.portfolio}`],
        ['Timestamp', data.timestamp]
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neuroswarm-data-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'share') {
      // Generate shareable link (mock implementation)
      const encoded = btoa(JSON.stringify(data))
      const shareUrl = `${window.location.origin}/share/${encoded.substring(0, 12)}`
      setShareLink(shareUrl)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
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
