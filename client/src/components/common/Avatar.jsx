import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { icons, logo } from '../../assets'
import { toggleSidebar } from '../../features/ui/uiSlice'
import { selectCurrentUser, logout } from '../../features/auth/authSlice'
import { selectUnreadCount } from '../../features/notifications/notificationSlice'
import Avatar from '../common/Avatar'

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

function useDismiss (ref, onDismiss) {
  useEffect(() => {
    function handleClickOutside (event) {
      if (ref.current && !ref.current.contains(event.target)) onDismiss()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, onDismiss])
}

const menuItemClass =
  'flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'
const iconButtonClass =
  'rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800'

export default function Header () {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const unreadCount = useSelector(selectUnreadCount)
  const [query, setQuery] = useState('')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const accountMenuRef = useRef(null)
  const moreMenuRef = useRef(null)
  const recognitionRef = useRef(null)

  useDismiss(accountMenuRef, () => setIsAccountMenuOpen(false))
  useDismiss(moreMenuRef, () => setIsMoreMenuOpen(false))

  useEffect(() => () => recognitionRef.current?.abort?.(), [])

  function goToSearch (text) {
    const trimmed = text.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function handleSearchSubmit (event) {
    event.preventDefault()
    goToSearch(query)
  }

  function handleVoiceSearch () {
    if (!SpeechRecognition) return

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Voice search failed. Check your microphone permission.')
    }
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      goToSearch(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  async function handleLogout () {
    await dispatch(logout())
    setIsAccountMenuOpen(false)
    navigate('/')
  }

  return (
    <header className='fixed top-0 z-40 flex h-14 w-full items-center justify-between gap-4 border-b border-neutral-200 bg-surface-light px-4 dark:border-neutral-800 dark:bg-surface-dark'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => dispatch(toggleSidebar())}
          aria-label='Toggle sidebar'
          className={iconButtonClass}
        >
          <img src={icons.menu} alt='' className='h-5 w-auto' />
        </button>
        <Link to='/' aria-label='VidTube home' className='flex items-center'>
          <img
            src={logo}
            alt='VidTube'
            className='h-7 w-auto rounded dark:bg-white dark:px-2 dark:py-0.5'
          />
        </Link>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className='hidden w-full max-w-xl flex-1 items-center gap-2 sm:flex'
      >
        <div className='flex flex-1'>
          <input
            type='search'
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder='Search'
            aria-label='Search videos'
            className='w-full rounded-l-full border border-neutral-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          <button
            type='submit'
            aria-label='Search'
            className='flex items-center rounded-r-full border border-l-0 border-neutral-300 bg-neutral-100 px-5 dark:border-neutral-700 dark:bg-neutral-800'
          >
            <img src={icons.search} alt='' className='h-5 w-5' />
          </button>
        </div>
        {SpeechRecognition && (
          <button
            type='button'
            onClick={handleVoiceSearch}
            aria-label={
              isListening ? 'Stop voice search' : 'Search with your voice'
            }
            className={`shrink-0 rounded-full bg-neutral-100 p-2.5 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 ${
              isListening ? 'animate-pulse ring-2 ring-red-500' : ''
            }`}
          >
            <img src={icons.voiceSearch} alt='' className='h-5 w-auto' />
          </button>
        )}
      </form>

      <div className='flex items-center gap-2'>
        {user && (
          <Link
            to='/upload'
            aria-label='Upload video'
            className={`hidden sm:block ${iconButtonClass}`}
          >
            <img src={icons.upload} alt='' className='h-6 w-6' />
          </Link>
        )}

        <div className='relative' ref={moreMenuRef}>
          <button
            type='button'
            onClick={() => setIsMoreMenuOpen(open => !open)}
            aria-label='More from VidTube'
            aria-expanded={isMoreMenuOpen}
            className={iconButtonClass}
          >
            <img src={icons.more} alt='' className='h-6 w-6' />
          </button>
          {isMoreMenuOpen && (
            <div className='absolute right-0 mt-2 w-52 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
              <Link
                to='/shorts'
                onClick={() => setIsMoreMenuOpen(false)}
                className={menuItemClass}
              >
                <Clapperboard size={18} /> Shorts
              </Link>
              {user && (
                <>
                  <Link
                    to='/studio'
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={menuItemClass}
                  >
                    <LayoutDashboard size={18} /> Studio
                  </Link>
                  <Link
                    to='/settings'
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={menuItemClass}
                  >
                    <Settings size={18} /> Settings
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to='/admin'
                      onClick={() => setIsMoreMenuOpen(false)}
                      className={menuItemClass}
                    >
                      <ShieldCheck size={18} /> Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {user ? (
          <>
            <Link
              to='/notifications'
              aria-label='Notifications'
              className={`relative ${iconButtonClass}`}
            >
              <img src={icons.notification} alt='' className='h-6 w-6' />
              {unreadCount > 0 && (
                <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white'>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <div className='relative' ref={accountMenuRef}>
              <button
                type='button'
                onClick={() => setIsAccountMenuOpen(open => !open)}
                aria-label='Account menu'
                aria-expanded={isAccountMenuOpen}
              >
                <Avatar src={user.avatar?.url} name={user.fullName} size={32} />
              </button>
              {isAccountMenuOpen && (
                <div className='absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
                  <Link
                    to={`/channel/${user.username}`}
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={menuItemClass}
                  >
                    <UserIcon size={18} /> Your channel
                  </Link>
                  <Link
                    to='/settings'
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={menuItemClass}
                  >
                    <Settings size={18} /> Settings
                  </Link>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className={`w-full text-left ${menuItemClass}`}
                  >
                    <LogOut size={18} /> Sign out
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
