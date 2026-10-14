import { defaultAvatar } from '../../assets'

function getInitials (name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

export default function Avatar ({ src, name, size = 40, className = '' }) {
  const dimension = `${size}px`

  if (src || !name) {
    return (
      <img
        src={src || defaultAvatar}
        alt={name || 'User avatar'}
        style={{ width: dimension, height: dimension }}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: dimension, height: dimension, fontSize: size / 2.4 }}
      className={`flex items-center justify-center rounded-full bg-neutral-300 font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 ${className}`}
    >
      {getInitials(name) || '?'}
    </div>
  )
}
