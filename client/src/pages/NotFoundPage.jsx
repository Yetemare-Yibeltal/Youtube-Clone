import { Link } from 'react-router-dom'

export default function NotFoundPage () {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center'>
      <h1 className='text-6xl font-bold text-brand'>404</h1>
      <p className='text-lg font-medium'>This page isn't available</p>
      <p className='max-w-sm text-sm text-neutral-500'>
        The link you followed may be broken, or the page may have been removed.
      </p>
      <Link
        to='/'
        className='mt-3 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
      >
        Back to home
      </Link>
    </div>
  )
}
