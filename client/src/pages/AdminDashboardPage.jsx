import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  banUser,
  deleteVideoAsAdmin,
  getDashboardStats,
  listAuditLogs,
  listVideosForModeration,
  unbanUser
} from '../api/admin.api'
import { listUsers } from '../api/user.api'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'
import useDebounce from '../hooks/useDebounce'
import { selectCurrentUser } from '../features/auth/authSlice'
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters'

const PAGE_SIZE = 20

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'videos', label: 'Videos' },
  { id: 'audit', label: 'Audit log' }
]

const STAT_LABELS = [
  ['totalUsers', 'Users'],
  ['totalChannels', 'Channels'],
  ['totalVideos', 'Published videos'],
  ['totalComments', 'Comments'],
  ['totalViews', 'Total views'],
  ['pendingReports', 'Pending reports'],
  ['bannedUsers', 'Banned users']
]

const tableWrapperClass =
  'overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800'
const headCellClass = 'px-4 py-3 font-medium'
const rowClass =
  'border-b border-neutral-100 last:border-0 dark:border-neutral-800'
const smallButtonClass =
  'rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700'

function Pager ({ page, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className='mt-4 flex items-center justify-between text-sm'>
      <span className='text-neutral-500'>
        Page {page} of {totalPages}
      </span>
      <div className='flex gap-2'>
        <button
          type='button'
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={smallButtonClass}
        >
          Previous
        </button>
        <button
          type='button'
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={smallButtonClass}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function CenteredSpinner () {
  return (
    <div className='flex min-h-[30vh] items-center justify-center'>
      <Spinner size='lg' />
    </div>
  )
}

function OverviewTab () {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getDashboardStats()
      .then(data => {
        if (isMounted) setStats(data)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load platform stats')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) return <CenteredSpinner />
  if (!stats)
    return (
      <p className='py-12 text-center text-neutral-500'>
        Stats are unavailable.
      </p>
    )

  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      {STAT_LABELS.map(([key, label]) => (
        <div
          key={key}
          className='rounded-xl border border-neutral-200 p-4 dark:border-neutral-800'
        >
          <p className='text-sm text-neutral-500'>{label}</p>
          <p className='mt-2 text-2xl font-semibold'>
            {formatCompactNumber(stats[key] || 0)}
          </p>
        </div>
      ))}
    </div>
  )
}

function UsersTab () {
  const currentUser = useSelector(selectCurrentUser)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    listUsers({ q: debouncedQuery || undefined, page, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setUsers(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load users')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery, page])

  function replaceUser (updated) {
    setUsers(previous =>
      previous.map(item =>
        item._id === updated._id ? { ...item, ...updated } : item
      )
    )
  }

  async function handleBan (user) {
    const reason = window.prompt(
      `Reason for banning ${user.username} (optional):`
    )
    if (reason === null) return
    try {
      const updated = await banUser(user._id, reason.trim() || undefined)
      replaceUser(updated)
      toast.success(`${user.username} was banned`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not ban user')
    }
  }

  async function handleUnban (user) {
    try {
      const updated = await unbanUser(user._id)
      replaceUser(updated)
      toast.success(`${user.username} was unbanned`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not unban user')
    }
  }

  return (
    <div>
      <input
        type='search'
        value={query}
        onChange={event => {
          setQuery(event.target.value)
          setPage(1)
        }}
        placeholder='Search by name, username or email'
        aria-label='Search users'
        className='mb-4 w-full max-w-md rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700'
      />

      {isLoading ? (
        <CenteredSpinner />
      ) : users.length === 0 ? (
        <p className='py-12 text-center text-neutral-500'>No users found.</p>
      ) : (
        <div className={tableWrapperClass}>
          <table className='w-full min-w-[640px] text-left text-sm'>
            <thead className='border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800'>
              <tr>
                <th className={headCellClass}>User</th>
                <th className={headCellClass}>Email</th>
                <th className={headCellClass}>Role</th>
                <th className={headCellClass}>Status</th>
                <th className={`${headCellClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className={rowClass}>
                  <td className='px-4 py-3'>
                    <Link
                      to={`/channel/${user.username}`}
                      className='flex items-center gap-3'
                    >
                      <Avatar
                        src={user.avatar?.url}
                        name={user.fullName}
                        size={32}
                      />
                      <div className='min-w-0'>
                        <p className='truncate font-medium'>{user.fullName}</p>
                        <p className='truncate text-xs text-neutral-500'>
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className='px-4 py-3'>{user.email}</td>
                  <td className='px-4 py-3 capitalize'>{user.role}</td>
                  <td className='px-4 py-3'>
                    {user.isBanned ? (
                      <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300'>
                        Banned
                      </span>
                    ) : (
                      <span className='rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300'>
                        Active
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    {user._id !== currentUser?._id &&
                      (user.isBanned ? (
                        <button
                          type='button'
                          onClick={() => handleUnban(user)}
                          className={smallButtonClass}
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          type='button'
                          onClick={() => handleBan(user)}
                          className={smallButtonClass}
                        >
                          Ban
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} total={total} onChange={setPage} />
    </div>
  )
}

function VideosTab () {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [videos, setVideos] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    listVideosForModeration({
      status: status || undefined,
      page,
      limit: PAGE_SIZE
    })
      .then(data => {
        if (!isMounted) return
        setVideos(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load videos')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [status, page])

  async function handleDelete (video) {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`))
      return
    try {
      await deleteVideoAsAdmin(video._id)
      setVideos(previous => previous.filter(item => item._id !== video._id))
      setTotal(count => Math.max(0, count - 1))
      toast.success('Video deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete video')
    }
  }

  return (
    <div>
      <select
        value={status}
        onChange={event => {
          setStatus(event.target.value)
          setPage(1)
        }}
        aria-label='Filter by status'
        className='mb-4 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-neutral-700'
      >
        <option value='' className='dark:bg-neutral-900'>
          All statuses
        </option>
        <option value='processing' className='dark:bg-neutral-900'>
          Processing
        </option>
        <option value='published' className='dark:bg-neutral-900'>
          Published
        </option>
        <option value='failed' className='dark:bg-neutral-900'>
          Failed
        </option>
      </select>

      {isLoading ? (
        <CenteredSpinner />
      ) : videos.length === 0 ? (
        <p className='py-12 text-center text-neutral-500'>No videos found.</p>
      ) : (
        <div className={tableWrapperClass}>
          <table className='w-full min-w-[720px] text-left text-sm'>
            <thead className='border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800'>
              <tr>
                <th className={headCellClass}>Video</th>
                <th className={headCellClass}>Channel</th>
                <th className={headCellClass}>Status</th>
                <th className={`${headCellClass} text-right`}>Views</th>
                <th className={`${headCellClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video._id} className={rowClass}>
                  <td className='px-4 py-3'>
                    <Link
                      to={`/watch/${video._id}`}
                      className='flex items-center gap-3'
                    >
                      <img
                        src={video.thumbnail?.url}
                        alt=''
                        className='aspect-video w-24 shrink-0 rounded-md bg-neutral-200 object-cover dark:bg-neutral-800'
                      />
                      <div className='min-w-0'>
                        <p className='line-clamp-2 font-medium'>
                          {video.title}
                        </p>
                        <p className='text-xs text-neutral-500'>
                          {formatRelativeTime(video.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className='px-4 py-3'>
                    <p>{video.channel?.name}</p>
                    <p className='text-xs text-neutral-500'>
                      @{video.owner?.username}
                    </p>
                  </td>
                  <td className='px-4 py-3 capitalize'>{video.status}</td>
                  <td className='px-4 py-3 text-right'>
                    {formatCompactNumber(video.views)}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => handleDelete(video)}
                      className={smallButtonClass}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} total={total} onChange={setPage} />
    </div>
  )
}

function AuditTab () {
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    listAuditLogs({ page, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setLogs(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load audit logs')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [page])

  if (isLoading) return <CenteredSpinner />

  return (
    <div>
      {logs.length === 0 ? (
        <p className='py-12 text-center text-neutral-500'>
          No audit entries yet.
        </p>
      ) : (
        <div className={tableWrapperClass}>
          <table className='w-full min-w-[640px] text-left text-sm'>
            <thead className='border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800'>
              <tr>
                <th className={headCellClass}>Actor</th>
                <th className={headCellClass}>Action</th>
                <th className={headCellClass}>Target</th>
                <th className={headCellClass}>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} className={rowClass}>
                  <td className='px-4 py-3'>
                    {log.actor?.username ? `@${log.actor.username}` : 'Unknown'}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs'>{log.action}</td>
                  <td className='px-4 py-3 text-xs text-neutral-500'>
                    {log.targetType
                      ? `${log.targetType} ${log.targetId || ''}`
                      : '-'}
                  </td>
                  <td className='px-4 py-3 text-xs text-neutral-500'>
                    {formatRelativeTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} total={total} onChange={setPage} />
    </div>
  )
}

export default function AdminDashboardPage () {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div>
      <h1 className='mb-6 text-2xl font-semibold'>Admin</h1>

      <div
        className='mb-6 flex gap-6 border-b border-neutral-200 dark:border-neutral-800'
        role='tablist'
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 pb-3 text-sm font-semibold ${
              activeTab === tab.id
                ? 'border-neutral-900 dark:border-white'
                : 'border-transparent text-neutral-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'videos' && <VideosTab />}
      {activeTab === 'audit' && <AuditTab />}
    </div>
  )
}
