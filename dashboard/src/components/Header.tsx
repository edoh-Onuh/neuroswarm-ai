'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, Github, ExternalLink, Copy, Check, RefreshCw, Bell, Sun, Moon, Menu, X } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import WalletButton from '@/components/WalletButton'
import { PROGRAM_ID } from '@/lib/solana/client'

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? 'mainnet') as 'mainnet' | 'devnet' | 'testnet'
const CLUSTER_LABEL: Record<typeof CLUSTER, string> = { mainnet: 'Mainnet', devnet: 'Devnet', testnet: 'Testnet' }
// Solana Explorer accepts 'mainnet-beta' for mainnet
const explorerCluster = CLUSTER === 'mainnet' ? 'mainnet-beta' : CLUSTER

export default function Header() {
  const { refreshData, isRefreshing, notifications, dismissNotification, clearNotifications, isConnected, theme, toggleTheme } = useDashboard()
  const [copied, setCopied] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const programId = PROGRAM_ID as string

  const copyProgramId = () => {
    navigator.clipboard.writeText(programId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close notification dropdown on Escape or outside click
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowMobileMenu(false)
      }
    }
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-50 safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4 gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <div className="p-2 bg-gradient-to-br from-solana-purple to-solana-green rounded-lg glow animate-pulse-slow flex-shrink-0">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-solana-purple via-solana-blue to-solana-green bg-clip-text text-transparent animate-gradient truncate">
                NeuroSwarm AI
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block truncate">Neural Swarm Intelligence Protocol</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
            {/* Refresh */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50"
              title="Refresh Data (R)"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg hover:bg-white/5 transition-all ${showNotifications ? 'bg-white/10' : ''}`}
                title="Notifications"
                aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
              >
                <Bell className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-slideDown">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-white transition-colors">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-lg border group ${
                              n.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                              n.type === 'error' ? 'border-red-500/30 bg-red-500/10' :
                              n.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                              'border-blue-500/30 bg-blue-500/10'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white">{n.title}</h4>
                                <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all ml-2"
                                aria-label="Dismiss notification"
                              >
                                <X className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wallet */}
            <WalletButton />

            {/* Connection Status */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-2 ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Program ID */}
            <button
              onClick={copyProgramId}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              title="Copy Program ID"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400">Program ID</span>
                </>
              )}
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/edoh-Onuh/neuroswarm-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 transition-all"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </a>
            
            {/* Explorer */}
            <a
              href={`https://explorer.solana.com/address/${programId}?cluster=${explorerCluster}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-solana-purple/20 hover:bg-solana-purple/30 border border-solana-purple/50 transition-all glow"
              aria-label={`Open in Solana Explorer (${CLUSTER_LABEL[CLUSTER]})`}
            >
              <span className="text-sm font-medium">Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile: Compact Actions */}
          <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
            {/* Refresh */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-gray-400" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-slideDown">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs text-gray-400 hover:text-white">Clear all</button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
                    ) : notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className={`p-2 rounded-lg border text-xs ${
                        n.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                        n.type === 'error' ? 'border-red-500/30 bg-red-500/10' :
                        'border-blue-500/30 bg-blue-500/10'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white">{n.title}</p>
                            <p className="text-gray-400 mt-0.5">{n.message}</p>
                          </div>
                          <button onClick={() => dismissNotification(n.id)} className="p-0.5" aria-label="Dismiss">
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connection dot */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />

            {/* Hamburger */}
            <div ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                aria-label="Menu"
              >
                {showMobileMenu ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
              </button>

              {showMobileMenu && (
                <div className="absolute top-full right-3 mt-2 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-slideDown">
                  <div className="p-3 space-y-1">
                    {/* Wallet */}
                    <div className="pb-2 border-b border-white/10">
                      <WalletButton />
                    </div>

                    {/* Theme */}
                    <button onClick={() => { toggleTheme(); setShowMobileMenu(false) }} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                      <span className="text-sm text-white">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* Copy Program ID */}
                    <button onClick={() => { copyProgramId(); setShowMobileMenu(false) }} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                      <Copy className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Copy Program ID</span>
                    </button>

                    {/* GitHub */}
                    <a href="https://github.com/edoh-Onuh/neuroswarm-ai" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                      <Github className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">GitHub</span>
                    </a>

                    {/* Explorer */}
                    <a href={`https://explorer.solana.com/address/${programId}?cluster=${explorerCluster}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">Solana Explorer</span>
                    </a>

                    {/* Status */}
                    <div className="pt-2 border-t border-white/10 px-3 py-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        <span>{isConnected ? `Connected to ${CLUSTER_LABEL[CLUSTER]}` : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
