'use client'

import { useState, useEffect } from 'react'
import { Command } from 'lucide-react'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const commands = [
    { id: 'agents', label: 'View Agents', shortcut: 'A' },
    { id: 'proposals', label: 'View Proposals', shortcut: 'P' },
    { id: 'portfolio', label: 'View Portfolio', shortcut: 'F' },
    { id: 'governance', label: 'View Governance', shortcut: 'G' },
    { id: 'refresh', label: 'Refresh Data', shortcut: 'R' },
    { id: 'export', label: 'Export Data', shortcut: 'E' },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-32 animate-fadeIn"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-gray-900 rounded-xl max-w-2xl w-full border border-solana-purple/30 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Command className="w-5 h-5 text-solana-purple" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-white/10 rounded">ESC</kbd>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              className="w-full flex items-center justify-between p-3 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <span className="text-white">{cmd.label}</span>
              <kbd className="px-2 py-1 text-xs bg-white/10 rounded">{cmd.shortcut}</kbd>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
