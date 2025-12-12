type AvatarProps = {
  name: string
}

function Avatar({ name }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/80 to-secondary-500/80 text-sm font-semibold text-white shadow-lg">
      {initials}
    </div>
  )
}

export default Avatar
