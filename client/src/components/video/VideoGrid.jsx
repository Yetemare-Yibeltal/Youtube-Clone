import VideoCard from './VideoCard'
import Spinner from '../common/Spinner'

export default function VideoGrid ({
  videos,
  isLoading,
  emptyMessage = 'No videos found'
}) {
  if (isLoading) {
    return (
      <div className='flex min-h-[40vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className='flex min-h-[30vh] items-center justify-center text-neutral-500 dark:text-neutral-400'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {videos.map(video => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  )
}
