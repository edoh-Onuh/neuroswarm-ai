'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate real-time connection
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now())
      setIsConnected(Math.random() > 0.1) // 90% uptime simulation
    }, 5000)

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
