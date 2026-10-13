import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Menu,
  Search,
  Video,
  Bell,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import { toggleSidebar } from '../../features/ui/uiSlice'
import { selectCurrentUser, logout } from '../../features/auth/authSlice'
import { selectUnreadCount } from '../../features/notifications/notificationSlice'
import Avatar from '../common/Avatar'

export default function Header () {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const unreadCount = useSelector(selectUnreadCount)
  const [query, setQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside (event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearchSubmit (event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  async function handleLogout () {
    await dispatch(logout())
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <header className='fixed top-0 z-40 flex h-14 w-full items-center justify-between gap-4 border-b border-neutral-200 bg-surface-light px-4 dark:border-neutral-800 dark:bg-surface-dark'>
      <div className='flex items-center gap-4'>
        <button
          type='button'
          onClick={() => dispatch(toggleSidebar())}
          aria-label='Toggle sidebar'
          className='rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        >
          <Menu size={22} />
        </button>
        <Link
          to='/'
          className='flex items-center gap-1 text-xl font-bold text-brand'
        >
          <Video size={26} />
          StreamTube
        </Link>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className='hidden w-full max-w-xl flex-1 sm:flex'
      >
        <input
          type='search'
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder='Search'
          className='w-full rounded-l-full border border-neutral-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
        />
        <button
          type='submit'
          aria-label='Search'
          className='rounded-r-full border border-l-0 border-neutral-300 bg-neutral-100 px-5 dark:border-neutral-700 dark:bg-neutral-800'
        >
          <Search size={20} />
        </button>
      </form>

      <div className='flex items-center gap-3'>
        {user ? (
          <>
            <Link
              to='/upload'
              className='hidden items-center gap-2 rounded-full p-2 hover:bg-neutral-100 sm:flex dark:hover:bg-neutral-800'
              aria-label='Upload video'
            >
              <Video size={22} />
            </Link>
            <Link
              to='/notifications'
              className='relative rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              aria-label='Notifications'
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className='absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white'>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className='relative' ref={menuRef}>
              <button
                type='button'
                onClick={() => setIsMenuOpen(open => !open)}
                aria-label='Account menu'
              >
                <Avatar src={user.avatar?.url} name={user.fullName} size={32} />
              </button>
              {isMenuOpen && (
                <div className='absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
                  <Link
                    to={`/channel/${user.username}`}
                    onClick={() => setIsMenuOpen(false)}
                    className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  >
                    <UserIcon size={16} /> Your channel
                  </Link>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to='/login'
            className='flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
          >
            <UserIcon size={18} /> Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
