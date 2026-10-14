import { Link, Outlet } from 'react-router-dom'
import { logo } from '../assets'

export default function AuthLayout () {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-surface-light px-4 dark:bg-surface-dark'>
      <Link to='/' aria-label='VidTube home' className='mb-8'>
        <img
          src={logo}
          alt='VidTube'
          className='h-10 w-auto rounded dark:bg-white dark:px-3 dark:py-1'
        />
      </Link>
      <div className='w-full max-w-md rounded-xl border border-neutral-200 p-8 shadow-sm dark:border-neutral-800'>
        <Outlet />
      </div>
    </div>
  )
}
