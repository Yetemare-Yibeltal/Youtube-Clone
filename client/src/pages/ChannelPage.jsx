import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BadgeCheck } from 'lucide-react'
import { getUserByUsername } from '../api/user.api'
import { getChannelVideos } from '../api/channel.api'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'
import { getChannelByHandle, getChannelVideos } from '../api/channel.api'

import SubscribeButton from '../components/channel/SubscribeButton'
import VideoGrid from '../components/video/VideoGrid'
import { selectCurrentUser } from '../features/auth/authSlice'
import { formatSubscriberCount } from '../utils/formatters'

const TABS = ['videos', 'shorts', 'about']

export default function ChannelPage () {
  const { username } = useParams()
  const currentUser = useSelector(selectCurrentUser)
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVideosLoading, setIsVideosLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('videos')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setProfile(null)
    setActiveTab('videos')

    getChannelByHandle(username).catch(() => getUserByUsername(username))

      .then(data => {
        if (isMounted) setProfile(data)
      })
      .catch(() => {
        if (isMounted) setProfile(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [username])

  const channelId = profile?.channel?._id

  useEffect(() => {
    if (!channelId || activeTab === 'about') return undefined

    let isMounted = true
    setIsVideosLoading(true)

    getChannelVideos(channelId, {
      sortBy: 'newest',
      isShort: activeTab === 'shorts'
    })
      .then(data => {
        if (isMounted) setVideos(data.results)
      })
      .catch(() => {
        if (isMounted) setVideos([])
      })
      .finally(() => {
        if (isMounted) setIsVideosLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [channelId, activeTab])

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!profile) {
    return (
      <p className='py-20 text-center text-neutral-500'>Channel not found.</p>
    )
  }

  const { user, channel, isSubscribed } = profile
  const isOwnProfile = Boolean(currentUser && currentUser._id === user._id)

  if (!channel) {
    return (
      <div className='flex flex-col items-center gap-4 py-20 text-center'>
        <Avatar src={user.avatar?.url} name={user.fullName} size={88} />
        <h1 className='text-xl font-semibold'>{user.fullName}</h1>
        <p className='text-neutral-500'>
          {isOwnProfile
            ? 'You have not created a channel yet.'
            : `${user.username} has not created a channel yet.`}
        </p>
        {isOwnProfile && (
          <Link
            to='/channel/create'
            className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
          >
            Create channel
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      {channel.banner?.url && (
        <div className='mb-4 h-32 w-full overflow-hidden rounded-xl sm:h-48'>
          <img
            src={channel.banner.url}
            alt={`${channel.name} banner`}
            className='h-full w-full object-cover'
          />
        </div>
      )}

      <div className='flex flex-wrap items-center gap-4'>
        <Avatar
          src={channel.avatar?.url || user.avatar?.url}
          name={channel.name}
          size={88}
        />
        <div className='min-w-0 flex-1'>
          <h1 className='flex items-center gap-1 text-2xl font-bold'>
            {channel.name}
            {channel.isVerified && (
              <BadgeCheck
                size={18}
                className='text-neutral-500'
                aria-label='Verified'
              />
            )}
          </h1>
          <p className='text-sm text-neutral-500'>
            @{channel.handle} &middot;{' '}
            {formatSubscriberCount(channel.subscribersCount)} &middot;{' '}
            {channel.videosCount}{' '}
            {channel.videosCount === 1 ? 'video' : 'videos'}
          </p>
          {channel.description && (
            <p className='mt-2 line-clamp-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400'>
              {channel.description}
            </p>
          )}
        </div>
        <SubscribeButton
          channelId={channel._id}
          isOwnChannel={isOwnProfile}
          initialSubscribed={isSubscribed}
        />
      </div>

      <div
        className='mt-6 flex gap-6 border-b border-neutral-200 dark:border-neutral-800'
        role='tablist'
      >
        {TABS.map(tab => (
          <button
            key={tab}
            type='button'
            role='tab'
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 pb-3 text-sm font-semibold capitalize ${
              activeTab === tab
                ? 'border-neutral-900 dark:border-white'
                : 'border-transparent text-neutral-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className='mt-6'>
        {activeTab === 'about' ? (
          <div className='max-w-2xl whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300'>
            {channel.description || 'No description provided.'}
          </div>
        ) : (
          <VideoGrid
            videos={videos}
            isLoading={isVideosLoading}
            emptyMessage={
              activeTab === 'shorts' ? 'No shorts yet' : 'No videos yet'
            }
          />
        )}
      </div>
    </div>
  )
}
