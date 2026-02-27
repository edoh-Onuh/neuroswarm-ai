'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import type { Notification, NotificationType } from '@/types'

interface DashboardContextType {
  isConnected: boolean
  lastUpdate: number
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
  refreshData: () => void
  isRefreshing: boolean
  /** Incremented on every refresh to trigger re-fetches in consumers */
  refreshCounter: number
  /** Active tab for cross-component communication */
  activeTab: string
  setActiveTab: (tab: string) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const rpcUrlRef = useRef(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    process.env.NEXT_PUBLIC_RPC_URL ??
    (process.env.NEXT_PUBLIC_CLUSTER === 'mainnet'
      ? 'https://rpc.ankr.com/solana'
      : 'https://api.devnet.solana.com')
  )

  // Validate RPC URL format on mount
  useEffect(() => {
    try {
      new URL(rpcUrlRef.current)
    } catch {
      console.error('Invalid NEXT_PUBLIC_SOLANA_RPC_URL:', rpcUrlRef.current)
      rpcUrlRef.current = 'https://api.devnet.solana.com'
    }
  }, [])

  // Real RPC health check
  useEffect(() => {
    let cancelled = false

    const checkHealth = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)
      try {
        const res = await fetch(rpcUrlRef.current, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (cancelled) return

        if (!res.ok) { setIsConnected(false); return }
        const json = await res.json()
        if (cancelled) return
        const nowConnected = json.result === 'ok'
        setIsConnected((prev) => {
          if (!prev && nowConnected)
            addNotification({ type: 'success', title: 'Connected', message: 'Solana RPC connection established' })
          else if (prev && !nowConnected)
            addNotification({ type: 'error', title: 'Disconnected', message: 'Lost Solana RPC connection' })
          return nowConnected
        })
      } catch (err) {
        clearTimeout(timeoutId)
        if (!cancelled && (err as Error).name !== 'AbortError') setIsConnected(false)
      }
      if (!cancelled) setLastUpdate(Date.now())
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11),
      timestamp: Date.now(),
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 20))

    // Auto-dismiss success/info after 5s
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 5000)
    }
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => setNotifications([]), [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    const refreshController = new AbortController()
    const timeoutId = setTimeout(() => refreshController.abort(), 10_000)
    try {
      // Trigger real re-fetch by incrementing counter
      setRefreshCounter(prev => prev + 1)

      // Do a real health check as part of refresh
      const res = await fetch(rpcUrlRef.current, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        signal: refreshController.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`RPC responded with HTTP ${res.status}`)
      }
      const json = await res.json()
      setIsConnected(json.result === 'ok')
      setLastUpdate(Date.now())

      addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Dashboard data has been updated from Solana RPC'
      })
    } catch {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Could not connect to Solana RPC. Retrying...'
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [addNotification])

  return (
    <DashboardContext.Provider
      value={{
        isConnected,
        lastUpdate,
        notifications,
        addNotification,
        dismissNotification,
        clearNotifications,
        theme,
        toggleTheme,
        refreshData,
        isRefreshing,
        refreshCounter,
        activeTab,
        setActiveTab,
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
