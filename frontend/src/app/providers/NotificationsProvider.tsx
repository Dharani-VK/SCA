import { createContext, ReactNode, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { nanoid } from 'nanoid'

type Notification = {
  id: string
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
}

type NotificationsContextValue = {
  notify: (input: Omit<Notification, 'id'>) => void
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = (input: Omit<Notification, 'id'>) => {
    const notification = { ...input, id: nanoid() }
    setNotifications((prev: Notification[]) => [...prev, notification])
    setTimeout(() => dismiss(notification.id), 4000)
  }

  const dismiss = (id: string) => {
    setNotifications((prev: Notification[]) => prev.filter((item) => item.id !== id))
  }

  return (
    <NotificationsContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="fixed bottom-8 right-8 z-50 flex w-80 flex-col gap-3">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-elevated backdrop-blur"
            >
              <div className="mb-1 text-sm font-semibold text-slate-100">
                {notification.title}
              </div>
              <div className="text-sm text-slate-300">{notification.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

export default NotificationsProvider
