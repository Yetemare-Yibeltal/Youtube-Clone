import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import toast from 'react-hot-toast'
import { listShorts } from '../api/shorts.api'
import { recordVideoView } from '../api/video.api'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'
import LikeDislikeButtons from '../components/video/LikeDislikeButtons'
import { formatViewCount } from '../utils/formatters'

const PAGE_SIZE = 8

function ShortItem ({ video, isMuted, onToggleMute, isNearEnd, onReachEnd }) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const viewRecordedRef = useRef(false)
  const channel = video.channel || {}

  useEffect(() => {
    const container = containerRef.current
    const element = videoRef.current
    if (!container || !element) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          element.play().catch(() => {})
          if (!viewRecordedRef.current) {
            viewRecordedRef.current = true
            recordVideoView(video._id).catch(() => {})
          }
          if (isNearEnd) onReachEnd()
        } else {
          element.pause()
        }
      },
      { threshold: [0, 0.6, 1] }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [video._id, isNearEnd, onReachEnd])

  function handleTogglePlayback () {
    const element = videoRef.current
    if (!element) return
    if (element.paused) element.play().catch(() => {})
    else element.pause()
  }

  return (
    <div
      ref={containerRef}
      className='flex h-full snap-start items-center justify-center py-2'
    >
      <div className='relative aspect-[9/16] h-full max-w-full overflow-hidden rounded-xl bg-black'>
        <video
          ref={videoRef}
          src={video.videoFile?.url}
          poster={video.thumbnail?.url}
          loop
          muted={isMuted}
          playsInline
          preload='metadata'
          onClick={handleTogglePlayback}
          className='h-full w-full cursor-pointer object-cover'
        />

        <button
          type='button'
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className='absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80'
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white'>
          <Link
            to={`/channel/${channel.handle}`}
            className='pointer-events-auto flex items-center gap-2'
          >
            <Avatar src={channel.avatar?.url} name={channel.name} size={32} />
            <span className='text-sm font-semibold'>@{channel.handle}</span>
          </Link>
          <p className='mt-2 line-clamp-2 text-sm'>{video.title}</p>
          <p className='mt-1 text-xs text-neutral-300'>
            {formatViewCount(video.views)}
          </p>
        </div>
      </div>

      <div className='ml-4 hidden self-end pb-8 sm:block'>
        <LikeDislikeButtons
          videoId={video._id}
          initialStatus={null}
          initialLikes={video.likesCount}
          initialDislikes={video.dislikesCount}
        />
      </div>
    </div>
  )
}

export default function ShortsPage () {
  const [shorts, setShorts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    listShorts({ page: 1, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setShorts(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load shorts')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleReachEnd = useCallback(async () => {
    if (loadingMoreRef.current || shorts.length >= total) return
    loadingMoreRef.current = true

    try {
      const nextPage = page + 1
      const data = await listShorts({ page: nextPage, limit: PAGE_SIZE })
      setShorts(previous => [...previous, ...data.results])
      setTotal(data.pagination?.total ?? total)
      setPage(nextPage)
    } catch {
      toast.error('Could not load more shorts')
    } finally {
      loadingMoreRef.current = false
    }
  }, [page, shorts.length, total])

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <p className='py-20 text-center text-neutral-500'>
        No shorts have been uploaded yet.
      </p>
    )
  }

  return (
    <div className='mx-auto h-[calc(100vh-8rem)] max-w-3xl snap-y snap-mandatory overflow-y-scroll scroll-smooth'>
      {shorts.map((video, index) => (
        <ShortItem
          key={video._id}
          video={video}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(value => !value)}
          isNearEnd={index >= shorts.length - 2}
          onReachEnd={handleReachEnd}
        />
      ))}
    </div>
  )
}
