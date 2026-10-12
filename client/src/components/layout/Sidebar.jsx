import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Clapperboard,
  Compass,
  History,
  Home,
  LayoutDashboard,
  ListVideo,
  Settings,
  ShieldCheck,
  ThumbsUp,
  UserCircle
} from 'lucide-react'
import { selectIsSidebarOpen } from '../../features/ui/uiSlice'
import { selectCurrentUser } from '../../features/auth/authSlice'

const guestLinks = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/shorts', label: 'Shorts', icon: Clapperboard },
  { to: '/explore', label: 'Explore', icon: Compass }
]

const authLinks = [
  { to: '/history', label: 'History', icon: History },
  { to: '/playlists', label: 'Playlists', icon: ListVideo },
  { to: '/liked-videos', label: 'Liked videos', icon: ThumbsUp }
]

function SidebarLink ({ to, label, icon: Icon, end, collapsed }) {
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
      <Icon size={collapsed ? 22 : 20} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar () {
  const isOpen = useSelector(selectIsSidebarOpen)
  const user = useSelector(selectCurrentUser)
  const collapsed = !isOpen

  return (
    <aside
      className={`fixed left-0 top-14 z-30 hidden h-[calc(100vh-56px)] overflow-y-auto border-r border-neutral-200 bg-surface-light p-2 transition-all duration-200 sm:block dark:border-neutral-800 dark:bg-surface-dark ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <nav className='flex flex-col gap-1'>
        {guestLinks.map(link => (
          <SidebarLink key={link.to} {...link} collapsed={collapsed} />
        ))}
      </nav>

      {user && (
        <>
          <hr className='my-2 border-neutral-200 dark:border-neutral-800' />
          <nav className='flex flex-col gap-1'>
            {authLinks.map(link => (
              <SidebarLink key={link.to} {...link} collapsed={collapsed} />
            ))}
            <SidebarLink
              to={`/channel/${user.username}`}
              label='Your channel'
              icon={UserCircle}
              collapsed={collapsed}
            />
          </nav>

          <hr className='my-2 border-neutral-200 dark:border-neutral-800' />
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
