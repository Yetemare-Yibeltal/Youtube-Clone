import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, CheckCheck } from 'lucide-react'
import {
  fetchNotifications,
  markAllAsRead,
  markAsRead,
  selectNotifications,
  selectUnreadCount
} from '../features/notifications/notificationSlice'
import Avatar from '../components/common/Avatar'
import { formatRelativeTime } from '../utils/formatters'

function resolveNotificationLink (notification) {
  const videoId = notification.video?._id || notification.video
  if (videoId) return `/watch/${videoId}`

  const handle = notification.channel?.handle
  if (handle) return `/channel/${notification.sender?.username || handle}`

  if (notification.sender?.username)
    return `/channel/${notification.sender.username}`
  return null
}

export default function NotificationsPage () {
  const dispatch = useDispatch()
  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadCount)

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 50 }))
  }, [dispatch])

  function renderItem (notification) {
    const link = resolveNotificationLink(notification)
    const content = (
      <div
        className={`flex items-start gap-3 rounded-xl p-3 ${
          notification.isRead ? '' : 'bg-blue-50 dark:bg-neutral-800'
        } hover:bg-neutral-100 dark:hover:bg-neutral-800`}
      >
        <Avatar
          src={notification.sender?.avatar?.url}
          name={notification.sender?.fullName || 'Notification'}
          size={40}
        />
        <div className='min-w-0 flex-1'>
          <p className='text-sm'>{notification.message}</p>
          <p className='mt-1 text-xs text-neutral-500'>
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <span
            className='mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600'
            aria-label='Unread'
          />
        )}
      </div>
    )

    const handleClick = () => {
      if (!notification.isRead) dispatch(markAsRead(notification._id))
    }

    if (!link) {
      return (
        <button
          key={notification._id}
          type='button'
          onClick={handleClick}
          className='block w-full text-left'
        >
          {content}
        </button>
      )
    }

    return (
      <Link
        key={notification._id}
        to={link}
        onClick={handleClick}
        className='block'
      >
        {content}
      </Link>
    )
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Notifications</h1>
        <button
          type='button'
          onClick={() => dispatch(markAllAsRead())}
          disabled={unreadCount === 0}
          className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          <CheckCheck size={18} />
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-neutral-500'>
          <Bell size={40} />
          <p>You have no notifications yet.</p>
        </div>
      ) : (
        <div className='flex flex-col gap-1'>
          {notifications.map(renderItem)}
        </div>
      )}
    </div>
  )
}
