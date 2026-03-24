import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AppNotification } from '../types'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { fetchNotifications, markNotificationsRead } from '../services/notificationService'

interface NotificationStore {
  notifications: AppNotification[]
  unread: AppNotification[]
  markAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationStore | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    fetchNotifications(user.id).then(setNotifications).catch(console.error)

    // Real-time: listen for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications(user.id).then(setNotifications).catch(console.error),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const markAllRead = useCallback(async () => {
    if (!user) return
    await markNotificationsRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [user?.id])

  const unread = notifications.filter((n) => !n.read)

  return (
    <NotificationContext.Provider value={{ notifications, unread, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationStore {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
