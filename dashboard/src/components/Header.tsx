'use client'

import { useState } from 'react'
import { Brain, Github, ExternalLink, Copy, Check, RefreshCw, Bell, Settings } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'

interface HeaderProps {
  onOpenSettings?: () => void
}

export default function Header({ onOpenSettings }: HeaderProps = {}) {
  const { refreshData, isRefreshing, notifications, isConnected } = useDashboard()
  const [copied, setCopied] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const programId = '56Vy8e8V4E6UZnsa6uDRg8HFiPwroz6nRKh7rm9xAfeK'

  const copyProgramId = () => {
    navigator.clipboard.writeText(programId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4 gap-2 sm:gap-4">
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

          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-110 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-110 ${
                showNotifications ? 'bg-white/10' : ''
              }`}
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                if (onOpenSettings) {
                  onOpenSettings()
                } else {
                  // Trigger Ctrl+K event to open command palette
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
                }
              }}
              className="p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-110"
              title="Settings (⌘K)"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white transition-colors" />
            </button>

            {/* Connection Status */}
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            
            <button
              onClick={copyProgramId}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
              title="Copy Program ID"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="hidden sm:inline text-sm font-medium text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span className="hidden sm:inline text-sm font-medium text-gray-400">Program ID</span>
                </>
              )}
            </button>

            <a
              href="https://github.com/edoh-Onuh/neuroswarm-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-110"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-white transition-colors" />
            </a>
            
            <a
              href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg bg-solana-purple/20 hover:bg-solana-purple/30 border border-solana-purple/50 transition-all hover:scale-105 glow"
            >
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">View on Explorer</span>
              <span className="text-xs sm:text-sm font-medium sm:hidden">Explorer</span>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Notification Dropdown Panel */}
      {showNotifications && notifications.length > 0 && (
        <div className="absolute top-full right-4 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 animate-slideDown">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Check className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.type === 'success' ? 'border-green-500/30 bg-green-500/10' :
                  notification.type === 'error' ? 'border-red-500/30 bg-red-500/10' :
                  notification.type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                  'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
