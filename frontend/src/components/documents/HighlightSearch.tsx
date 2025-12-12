import Input from '../common/Input'
import Button from '../common/Button'

type HighlightSearchProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

function HighlightSearch({ value, onChange, onSubmit, disabled }: HighlightSearchProps) {
  return (
    <form
      className="flex items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled) {
          onSubmit()
        }
      }}
    >
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search highlights"
        className="w-48"
        disabled={disabled}
      />
      <Button variant="secondary" type="submit" disabled={disabled || value.trim().length === 0}
        >
        Find
      </Button>
    </form>
  )
}

export default HighlightSearch
