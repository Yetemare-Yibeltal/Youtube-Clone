import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar'
import {
  formatDuration,
  formatRelativeTime,
  formatViewCount
} from '../../utils/formatters'

export default function VideoCard ({ video }) {
  if (!video) return null

  const channel = video.channel || {}

  return (
    <Link to={`/watch/${video._id}`} className='group flex flex-col gap-2'>
      <div className='relative aspect-video overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800'>
        <img
          src={video.thumbnail?.url}
          alt={video.title}
          loading='lazy'
          className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
        />
        {video.duration > 0 && (
          <span className='absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white'>
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      <div className='flex gap-3'>
        <Avatar
          src={channel.avatar?.url}
          name={channel.name}
          size={36}
          className='mt-0.5 shrink-0'
        />
        <div className='min-w-0'>
          <h3 className='line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-50'>
            {video.title}
          </h3>
          <p className='mt-1 truncate text-xs text-neutral-600 dark:text-neutral-400'>
            {channel.name}
          </p>
          <p className='truncate text-xs text-neutral-600 dark:text-neutral-400'>
            {formatViewCount(video.views)} &middot;{' '}
            {formatRelativeTime(video.publishedAt || video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  )
}
