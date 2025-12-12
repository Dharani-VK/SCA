import { useTheme } from '../../app/providers/ThemeProvider'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:text-primary-200"
    >
      <span
        className="flex h-3 w-3 items-center justify-center rounded-full"
        style={{ backgroundColor: theme === 'dark' ? '#4f46e5' : '#facc15' }}
      />
      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  )
}

export default ThemeToggle
