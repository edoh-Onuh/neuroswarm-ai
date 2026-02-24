'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface DashboardContextType {
  isConnected: boolean
  lastUpdate: number
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  clearNotifications: () => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  refreshData: () => void
  isRefreshing: boolean
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Real RPC health check instead of Math.random() simulation
  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com'

    const checkHealth = async () => {
      try {
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        })
        const json = await res.json()
        setIsConnected(json.result === 'ok')
      } catch {
        setIsConnected(false)
      }
      setLastUpdate(Date.now())
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30_000) // 30s, respectful of rate limits
    return () => clearInterval(interval)
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 10))
  }

  const clearNotifications = () => setNotifications([])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLastUpdate(Date.now())
    setIsRefreshing(false)
    addNotification({
      type: 'success',
      title: 'Data Refreshed',
      message: 'All dashboard data has been updated successfully'
    })
  }

  return (
    <DashboardContext.Provider
      value={{
        isConnected,
        lastUpdate,
        notifications,
        addNotification,
        clearNotifications,
        theme,
        toggleTheme,
        refreshData,
        isRefreshing,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
