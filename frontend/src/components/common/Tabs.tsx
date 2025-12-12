import clsx from 'clsx'
import { ReactNode } from 'react'

type TabItem = {
  id: string
  label: string
  icon?: ReactNode
}

type TabsProps = {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div className={clsx('inline-flex rounded-full border border-slate-800 bg-slate-900/70 p-1 text-sm', className)}>
      {items.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 rounded-full px-4 py-2 font-medium transition',
              active
                ? 'bg-slate-950 text-primary-100 shadow-inner'
                : 'text-slate-400 hover:text-slate-100'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
