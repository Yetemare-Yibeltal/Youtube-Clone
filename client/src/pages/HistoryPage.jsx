import { useCallback, useEffect, useState } from 'react'
import { PauseCircle, PlayCircle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  clearWatchHistory,
  listWatchHistory,
  pauseWatchHistory,
  removeFromHistory
} from '../api/history.api'
import Spinner from '../components/common/Spinner'
import VideoCard from '../components/video/VideoCard'

const PAGE_SIZE = 24

export default function HistoryPage () {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    listWatchHistory({ page: 1, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setItems(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
        if (typeof data.isEnabled === 'boolean')
          setIsTrackingEnabled(data.isEnabled)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load watch history')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1
    setIsLoadingMore(true)
    try {
      const data = await listWatchHistory({ page: nextPage, limit: PAGE_SIZE })
      setItems(previous => [...previous, ...data.results])
      setTotal(data.pagination?.total ?? total)
      setPage(nextPage)
    } catch {
      toast.error('Could not load more history')
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, total])

  async function handleRemove (videoId) {
    try {
      await removeFromHistory(videoId)
      setItems(previous =>
        previous.filter(item => (item.video?._id || item._id) !== videoId)
      )
      setTotal(count => Math.max(0, count - 1))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove video')
    }
  }

  async function handleClear () {
    if (!window.confirm('Clear your entire watch history?')) return
    try {
      await clearWatchHistory()
      setItems([])
      setTotal(0)
      toast.success('Watch history cleared')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not clear history')
    }
  }

  async function handleToggleTracking () {
    const nextValue = !isTrackingEnabled
    try {
      await pauseWatchHistory(nextValue)
      setIsTrackingEnabled(nextValue)
      toast.success(
        nextValue ? 'Watch history resumed' : 'Watch history paused'
      )
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not update history setting'
      )
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  const hasMore = items.length < total

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-2xl font-semibold'>Watch history</h1>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleToggleTracking}
            className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
          >
            {isTrackingEnabled ? (
              <PauseCircle size={18} />
            ) : (
              <PlayCircle size={18} />
            )}
            {isTrackingEnabled ? 'Pause history' : 'Resume history'}
          </button>
          <button
            type='button'
            onClick={handleClear}
            disabled={items.length === 0}
            className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700'
          >
            <Trash2 size={18} />
            Clear all
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className='py-20 text-center text-neutral-500'>
          Videos you watch will appear here.
        </p>
      ) : (
        <div className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {items.map(item => {
            const video = item.video || item
            return (
              <div key={item._id} className='relative'>
                <VideoCard video={video} />
                <button
                  type='button'
                  onClick={() => handleRemove(video._id)}
                  aria-label='Remove from watch history'
                  className='absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black'
                >
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className='mt-8 flex justify-center'>
          <button
            type='button'
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className='flex items-center gap-2 rounded-full bg-neutral-100 px-5 py-2 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:hover:bg-neutral-700'
          >
            {isLoadingMore && <Spinner size='sm' />}
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
