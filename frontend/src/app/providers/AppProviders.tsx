import { ReactNode } from 'react'
import ThemeProvider from './ThemeProvider'
import NotificationsProvider from './NotificationsProvider'
import { AuthProvider } from '../../context/AuthContext'

type AppProvidersProps = {
  children: ReactNode
}

function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default AppProviders
