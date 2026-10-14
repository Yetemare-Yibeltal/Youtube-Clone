import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Clapperboard,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCircle
} from 'lucide-react'
import { icons } from '../../assets'
import { listMySubscriptions } from '../../api/subscription.api'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { selectIsSidebarOpen } from '../../features/ui/uiSlice'
import { SIDEBAR_CATEGORIES } from '../../utils/categories'
import Avatar from '../common/Avatar'

const VISIBLE_SUBSCRIPTIONS = 5

function SidebarLink ({ to, label, icon: Icon, iconSrc, end, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium ${
          collapsed ? 'flex-col gap-1 px-1 text-[10px]' : ''
        } ${
          isActive
            ? 'bg-neutral-200 dark:bg-neutral-800'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`
      }
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=''
          className={collapsed ? 'h-6 w-6' : 'h-5 w-5'}
        />
      ) : (
        <Icon size={collapsed ? 22 : 20} />
      )}
      <span>{label}</span>
    </NavLink>
  )
}

function SectionTitle ({ children, iconSrc }) {
  return (
    <h3 className='mb-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500'>
      {iconSrc && <img src={iconSrc} alt='' className='h-4 w-4' />}
      {children}
    </h3>
  )
}

function Divider () {
  return <hr className='my-3 border-neutral-200 dark:border-neutral-800' />
}

export default function Sidebar () {
  const isOpen = useSelector(selectIsSidebarOpen)
  const user = useSelector(selectCurrentUser)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [subscriptions, setSubscriptions] = useState([])
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false)
  const collapsed = !isOpen
  const activeCategory =
    location.pathname === '/' ? searchParams.get('category') : null

  useEffect(() => {
    if (!user?._id) {
      setSubscriptions([])
      return undefined
    }

    let isMounted = true

    listMySubscriptions({ limit: 20 })
      .then(data => {
        if (isMounted)
          setSubscriptions(Array.isArray(data) ? data : data?.results || [])
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [user?._id])

  const visibleSubscriptions = showAllSubscriptions
    ? subscriptions
    : subscriptions.slice(0, VISIBLE_SUBSCRIPTIONS)

  return (
    <aside
      className={`fixed left-0 top-14 z-30 hidden h-[calc(100vh-56px)] overflow-y-auto border-r border-neutral-200 bg-surface-light p-2 transition-all duration-200 sm:block dark:border-neutral-800 dark:bg-surface-dark ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <nav className='flex flex-col gap-1'>
        <SidebarLink
          to='/'
          label='Home'
          iconSrc={icons.home}
          end
          collapsed={collapsed}
        />
        <SidebarLink
          to='/shorts'
          label='Shorts'
          icon={Clapperboard}
          collapsed={collapsed}
        />
        <SidebarLink
          to='/explore'
          label='Explore'
          iconSrc={icons.explore}
          collapsed={collapsed}
        />
      </nav>

      {user && (
        <>
          <Divider />
          <nav className='flex flex-col gap-1'>
            <SidebarLink
              to='/playlists'
              label='Library'
              iconSrc={icons.library}
              collapsed={collapsed}
            />
            <SidebarLink
              to='/history'
              label='History'
              iconSrc={icons.history}
              collapsed={collapsed}
            />
            <SidebarLink
              to='/liked-videos'
              label='Liked videos'
              iconSrc={icons.like}
              collapsed={collapsed}
            />
            <SidebarLink
              to={`/channel/${user.username}`}
              label='Your channel'
              icon={UserCircle}
              collapsed={collapsed}
            />
          </nav>
        </>
      )}

      {!collapsed && (
        <>
          <Divider />
          <SectionTitle>Categories</SectionTitle>
          <nav className='flex flex-col gap-1'>
            {SIDEBAR_CATEGORIES.map(category => (
              <Link
                key={category.value}
                to={`/?category=${category.value}`}
                className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  activeCategory === category.value
                    ? 'bg-neutral-200 dark:bg-neutral-800'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <img src={category.icon} alt='' className='h-5 w-5' />
                {category.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      {user && !collapsed && subscriptions.length > 0 && (
        <>
          <Divider />
          <SectionTitle iconSrc={icons.subscription}>
            Subscriptions
          </SectionTitle>
          <nav className='flex flex-col gap-1'>
            {visibleSubscriptions.map(channel => (
              <Link
                key={channel._id}
                to={`/channel/${channel.handle}`}
                className='flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'
              >
                <Avatar
                  src={channel.avatar?.url}
                  name={channel.name}
                  size={24}
                />
                <span className='truncate'>{channel.name}</span>
              </Link>
            ))}
          </nav>
          {subscriptions.length > VISIBLE_SUBSCRIPTIONS && (
            <button
              type='button'
              onClick={() => setShowAllSubscriptions(value => !value)}
              className='mt-1 flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800'
            >
              <img
                src={icons.showMore}
                alt=''
                className={`h-5 w-5 transition-transform ${
                  showAllSubscriptions ? 'rotate-180' : ''
                }`}
              />
              {showAllSubscriptions
                ? 'Show less'
                : `Show ${subscriptions.length - VISIBLE_SUBSCRIPTIONS} more`}
            </button>
          )}
        </>
      )}

      {user && (
        <>
          <Divider />
          <nav className='flex flex-col gap-1'>
            <SidebarLink
              to='/studio'
              label='Studio'
              icon={LayoutDashboard}
              collapsed={collapsed}
            />
            <SidebarLink
              to='/settings'
              label='Settings'
              icon={Settings}
              collapsed={collapsed}
            />
            {user.role === 'admin' && (
              <SidebarLink
                to='/admin'
                label='Admin'
                icon={ShieldCheck}
                collapsed={collapsed}
              />
            )}
          </nav>
        </>
      )}
    </aside>
  )
}
