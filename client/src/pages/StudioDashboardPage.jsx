import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Clock, Eye, Upload, Users, Video as VideoIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { getChannelAnalytics, getTopVideos } from '../api/analytics.api'
import { getUserByUsername } from '../api/user.api'
import Spinner from '../components/common/Spinner'
import { selectCurrentUser } from '../features/auth/authSlice'
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters'

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '28d', label: 'Last 28 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last 365 days' },
  { value: 'all', label: 'All time' }
]

function StatCard ({ icon: Icon, label, value }) {
  return (
    <div className='rounded-xl border border-neutral-200 p-4 dark:border-neutral-800'>
      <div className='mb-2 flex items-center gap-2 text-sm text-neutral-500'>
        <Icon size={16} />
        {label}
      </div>
      <p className='text-2xl font-semibold'>{value}</p>
    </div>
  )
}

function ViewsChart ({ points }) {
  if (points.length === 0) {
    return (
      <p className='py-12 text-center text-sm text-neutral-500'>
        No views in this period.
      </p>
    )
  }

  const maxViews = Math.max(...points.map(point => point.views), 1)

  return (
    <div
      className='flex h-48 items-end gap-px'
      role='img'
      aria-label='Views over time'
    >
      {points.map(point => (
        <div
          key={point._id}
          title={`${point._id}: ${point.views} ${
            point.views === 1 ? 'view' : 'views'
          }`}
          className='min-w-[2px] flex-1 rounded-t bg-brand/80 hover:bg-brand'
          style={{ height: `${Math.max(2, (point.views / maxViews) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export default function StudioDashboardPage () {
  const user = useSelector(selectCurrentUser)
  const [channel, setChannel] = useState(null)
  const [isChannelLoading, setIsChannelLoading] = useState(true)
  const [range, setRange] = useState('28d')
  const [analytics, setAnalytics] = useState(null)
  const [topVideos, setTopVideos] = useState([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  useEffect(() => {
    if (!user?.username) return undefined
    let isMounted = true

    getUserByUsername(user.username)
      .then(data => {
        if (isMounted) setChannel(data.channel || null)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load your channel')
      })
      .finally(() => {
        if (isMounted) setIsChannelLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [user?.username])

  const channelId = channel?._id

  useEffect(() => {
    if (!channelId) return undefined
    let isMounted = true
    setIsAnalyticsLoading(true)

    Promise.all([
      getChannelAnalytics(channelId, { range }),
      getTopVideos(channelId, { range, limit: 10 })
    ])
      .then(([analyticsData, topVideosData]) => {
        if (!isMounted) return
        setAnalytics(analyticsData)
        setTopVideos(topVideosData.videos || [])
      })
      .catch(error => {
        if (isMounted)
          toast.error(
            error.response?.data?.message || 'Could not load analytics'
          )
      })
      .finally(() => {
        if (isMounted) setIsAnalyticsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [channelId, range])

  if (isChannelLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!channel) {
    return (
      <div className='flex flex-col items-center gap-4 py-20 text-center'>
        <h1 className='text-xl font-semibold'>
          Create a channel to open Studio
        </h1>
        <p className='text-sm text-neutral-500'>
          Analytics are available once you have a channel.
        </p>
        <Link
          to='/channel/create'
          className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
        >
          Create channel
        </Link>
      </div>
    )
  }

  const totals = analytics?.totals
  const viewsOverTime = analytics?.viewsOverTime || []
  const newSubscribers = (analytics?.subscribersOverTime || []).reduce(
    (sum, point) => sum + point.newSubscribers,
    0
  )
  const watchHours = ((totals?.watchTimeSeconds || 0) / 3600).toFixed(1)

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Channel dashboard</h1>
          <p className='text-sm text-neutral-500'>{channel.name}</p>
        </div>
        <div className='flex items-center gap-3'>
          <select
            value={range}
            onChange={event => setRange(event.target.value)}
            aria-label='Date range'
            className='rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-neutral-700'
          >
            {RANGES.map(option => (
              <option
                key={option.value}
                value={option.value}
                className='dark:bg-neutral-900'
              >
                {option.label}
              </option>
            ))}
          </select>
          <Link
            to='/upload'
            className='flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
          >
            <Upload size={16} />
            Upload
          </Link>
        </div>
      </div>

      {isAnalyticsLoading && !analytics ? (
        <div className='flex min-h-[30vh] items-center justify-center'>
          <Spinner size='lg' />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <StatCard
              icon={Eye}
              label='Views'
              value={formatCompactNumber(totals?.views || 0)}
            />
            <StatCard
              icon={Clock}
              label='Watch time (hours)'
              value={watchHours}
            />
            <StatCard
              icon={Users}
              label='Subscribers'
              value={`${formatCompactNumber(
                analytics?.channel?.subscribersCount || 0
              )}${newSubscribers > 0 ? ` (+${newSubscribers})` : ''}`}
            />
            <StatCard
              icon={VideoIcon}
              label='Videos'
              value={formatCompactNumber(analytics?.channel?.videosCount || 0)}
            />
          </div>

          <section className='mt-8'>
            <h2 className='mb-3 text-lg font-semibold'>Views</h2>
            <div className='rounded-xl border border-neutral-200 p-4 dark:border-neutral-800'>
              <ViewsChart points={viewsOverTime} />
            </div>
          </section>

          <section className='mt-8'>
            <h2 className='mb-3 text-lg font-semibold'>Top videos</h2>
            {topVideos.length === 0 ? (
              <p className='py-8 text-center text-sm text-neutral-500'>
                No videos published in this period.
              </p>
            ) : (
              <div className='overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800'>
                <table className='w-full min-w-[560px] text-left text-sm'>
                  <thead className='border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800'>
                    <tr>
                      <th className='px-4 py-3 font-medium'>Video</th>
                      <th className='px-4 py-3 text-right font-medium'>
                        Views
                      </th>
                      <th className='px-4 py-3 text-right font-medium'>
                        Likes
                      </th>
                      <th className='px-4 py-3 text-right font-medium'>
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map(video => (
                      <tr
                        key={video._id}
                        className='border-b border-neutral-100 last:border-0 dark:border-neutral-800'
                      >
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
                                {formatRelativeTime(video.publishedAt)}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {formatCompactNumber(video.views)}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {formatCompactNumber(video.likesCount)}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {formatCompactNumber(video.commentsCount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
