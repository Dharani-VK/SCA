import { ReactNode, useEffect, useMemo, useState } from 'react'
import SidebarNav from './SidebarNav'
import TopBar from './TopBar'
import useMediaQuery from '../../hooks/useMediaQuery'

type AppShellProps = {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isSidebarVisible, setSidebarVisible] = useState(true)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (isDesktop) {
      setSidebarVisible(true)
    } else {
      setSidebarVisible(false)
      setSidebarCollapsed(false)
    }
  }, [isDesktop])

  const sidebarWidth = useMemo(() => {
    if (!isDesktop) {
      return '0px'
    }
    return isSidebarCollapsed ? '5rem' : '16rem'
  }, [isDesktop, isSidebarCollapsed])

  const handleMenuClick = () => {
    if (isDesktop) {
      setSidebarCollapsed((prev) => !prev)
    } else {
      setSidebarVisible(true)
    }
  }

  const handleCloseMobileSidebar = () => {
    if (!isDesktop) {
      setSidebarVisible(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950/95 dark:text-slate-100"
      style={{ paddingLeft: sidebarWidth }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.16),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(71,85,105,0.4),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.18),transparent_60%)]" />
      <SidebarNav
        isDesktop={isDesktop}
        collapsed={isDesktop && isSidebarCollapsed}
        mobileVisible={!isDesktop && isSidebarVisible}
        onCollapseToggle={() => setSidebarCollapsed((prev) => !prev)}
        onCloseMobile={handleCloseMobileSidebar}
      />

      {!isDesktop && isSidebarVisible && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={handleCloseMobileSidebar}
        />
      )}

      <div
        className="relative flex min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ paddingLeft: isDesktop ? '0' : undefined }}
      >
        <TopBar onMenuClick={handleMenuClick} />
        <main className="relative flex-1 overflow-x-hidden px-4 py-6 md:px-6 lg:px-8 xl:px-10">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/65 via-white/40 to-transparent dark:from-slate-950/70 dark:via-slate-950/40" />
          <div className="flex w-full min-w-0 flex-col gap-10 pb-16 lg:pb-12 xl:gap-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
