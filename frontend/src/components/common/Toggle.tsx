import clsx from 'clsx'

type ToggleProps = {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={clsx(
          'relative h-6 w-11 rounded-full border border-slate-700 transition-all',
          checked ? 'bg-primary-500' : 'bg-slate-800'
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className={clsx(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-all',
            checked ? 'left-6 -translate-x-full' : 'left-1'
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  )
}

export default Toggle
