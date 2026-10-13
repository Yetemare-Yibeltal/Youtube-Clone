import { Link, Outlet } from 'react-router-dom'
import { Video } from 'lucide-react'

export default function AuthLayout () {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-surface-light px-4 dark:bg-surface-dark'>
      <Link
        to='/'
        className='mb-8 flex items-center gap-2 text-2xl font-bold text-brand'
      >
        <Video size={32} />
        StreamTube
      </Link>
      <div className='w-full max-w-md rounded-xl border border-neutral-200 p-8 shadow-sm dark:border-neutral-800'>
        <Outlet />
      </div>
    </div>
  )
}
