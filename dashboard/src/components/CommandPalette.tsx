'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Command, Search, BarChart3, Users, Vote, Briefcase, Building, TrendingUp, ShoppingBag, RefreshCw, Download, Sun, Moon } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'

interface PaletteCommand {
  id: string
  label: string
  shortcut: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'actions'
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { refreshData, setActiveTab, theme, toggleTheme } = useDashboard()

  const close = useCallback(() => {
    setIsOpen(false)
    setSearch('')
    setSelectedIndex(0)
  }, [])

  const commands: PaletteCommand[] = [
    { id: 'overview', label: 'Go to Overview', shortcut: 'O', icon: <BarChart3 className="w-4 h-4" />, action: () => { setActiveTab('overview'); close() }, category: 'navigation' },
    { id: 'agents', label: 'Go to Agents', shortcut: 'A', icon: <Users className="w-4 h-4" />, action: () => { setActiveTab('agents'); close() }, category: 'navigation' },
    { id: 'proposals', label: 'Go to Proposals', shortcut: 'P', icon: <Vote className="w-4 h-4" />, action: () => { setActiveTab('proposals'); close() }, category: 'navigation' },
    { id: 'portfolio', label: 'Go to Portfolio', shortcut: 'F', icon: <Briefcase className="w-4 h-4" />, action: () => { setActiveTab('portfolio'); close() }, category: 'navigation' },
    { id: 'governance', label: 'Go to Governance', shortcut: 'G', icon: <Building className="w-4 h-4" />, action: () => { setActiveTab('governance'); close() }, category: 'navigation' },
    { id: 'sentiment', label: 'Go to Sentiment', shortcut: 'S', icon: <TrendingUp className="w-4 h-4" />, action: () => { setActiveTab('sentiment'); close() }, category: 'navigation' },
    { id: 'marketplace', label: 'Go to Marketplace', shortcut: 'M', icon: <ShoppingBag className="w-4 h-4" />, action: () => { setActiveTab('marketplace'); close() }, category: 'navigation' },
    { id: 'refresh', label: 'Refresh Data', shortcut: 'R', icon: <RefreshCw className="w-4 h-4" />, action: () => { refreshData(); close() }, category: 'actions' },
    { id: 'export', label: 'Export Data', shortcut: 'E', icon: <Download className="w-4 h-4" />, action: () => { setActiveTab('overview'); close(); /* ExportPanel is on overview */ }, category: 'actions' },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, shortcut: 'T', icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, action: () => { toggleTheme(); close() }, category: 'actions' },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  // Keyboard open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setSearch('')
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Arrow key navigation inside palette
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault()
      filteredCommands[selectedIndex].action()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  const navCommands = filteredCommands.filter(c => c.category === 'navigation')
  const actionCommands = filteredCommands.filter(c => c.category === 'actions')
  let globalIndex = -1

  const renderCommand = (cmd: PaletteCommand) => {
    globalIndex++
    const idx = globalIndex
    return (
      <button
        key={cmd.id}
        data-active={idx === selectedIndex}
        onClick={cmd.action}
        onMouseEnter={() => setSelectedIndex(idx)}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
          idx === selectedIndex ? 'bg-solana-purple/20 text-white' : 'hover:bg-white/5 text-gray-300'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">{cmd.icon}</span>
          <span>{cmd.label}</span>
        </div>
        <kbd className="px-2 py-0.5 text-xs bg-white/10 rounded font-mono">{cmd.shortcut}</kbd>
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-24 sm:pt-32 px-4 animate-fadeIn"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="bg-gray-900 rounded-xl max-w-2xl w-full border border-solana-purple/30 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handlePaletteKeyDown}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-solana-purple flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
              aria-label="Search commands"
            />
            <kbd className="px-2 py-1 text-xs bg-white/10 rounded hidden sm:inline">ESC</kbd>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No matching commands</div>
          ) : (
            <>
              {navCommands.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">Navigation</p>
                  {navCommands.map(renderCommand)}
                </div>
              )}
              {actionCommands.length > 0 && (
                <div className={navCommands.length > 0 ? 'mt-2' : ''}>
                  <p className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">Actions</p>
                  {actionCommands.map(renderCommand)}
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 px-4">
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Up/Down</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Ctrl K</kbd>
            <span>toggle</span>
          </div>
        </div>
      </div>
    </div>
  )
}
