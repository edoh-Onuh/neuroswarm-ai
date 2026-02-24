'use client'

import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { useDashboard } from '@/context/DashboardContext'
import type { Notification } from '@/types'

export default function NotificationCenter() {
  const { notifications, dismissNotification } = useDashboard()

  if (notifications.length === 0) return null

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      default: return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-green-500/50 bg-green-500/10'
      case 'error': return 'border-red-500/50 bg-red-500/10'
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
      default: return 'border-blue-500/50 bg-blue-500/10'
    }
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md" role="region" aria-label="Notifications">
      {notifications.slice(0, 5).map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border backdrop-blur-sm animate-slideIn ${getColor(notification.type)}`}
          role="alert"
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
              <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label={`Dismiss ${notification.title}`}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {/* Auto-dismiss progress bar for non-error notifications */}
          {notification.type !== 'error' && (
            <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/30 animate-progress" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
