import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useTheme } from '../../app/providers/ThemeProvider'
import Avatar from '../common/Avatar'
import ThemeToggle from '../common/ThemeToggle'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

type TopBarProps = {
  onMenuClick: () => void
}

function TopBar({ onMenuClick }: TopBarProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-transparent bg-white/80 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:bg-slate-900/70 md:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-primary-500 hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        >
          <Bars3Icon className="h-5 w-5" />
          <span className="hidden sm:inline">Menu</span>
        </button>
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300 md:flex">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            placeholder="Search documents, notes, people…"
            className="w-64 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <ThemeToggle />
        <div className="hidden rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400 md:block">
          {theme === 'dark' ? 'Night Mode' : 'Day Mode'}
        </div>
        <button
          type="button"
          aria-label="Open settings"
          onClick={() => navigate('/settings')}
          className="rounded-full border border-transparent p-1 transition hover:border-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
        >
          <Avatar name={user?.full_name || 'Student'} />
        </button>
      </div>
    </header>
  )
}

export default TopBar
