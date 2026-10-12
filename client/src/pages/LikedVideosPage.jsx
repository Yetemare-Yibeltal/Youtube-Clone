import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { listLikedVideos } from '../api/like.api'
import Spinner from '../components/common/Spinner'
import VideoGrid from '../components/video/VideoGrid'

const PAGE_SIZE = 24

export default function LikedVideosPage () {
  const [videos, setVideos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    listLikedVideos({ page: 1, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setVideos(data.results.map(item => item.video || item))
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load liked videos')
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
      const data = await listLikedVideos({ page: nextPage, limit: PAGE_SIZE })
      setVideos(previous => [
        ...previous,
        ...data.results.map(item => item.video || item)
      ])
      setTotal(data.pagination?.total ?? total)
      setPage(nextPage)
    } catch {
      toast.error('Could not load more videos')
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, total])

  const hasMore = videos.length < total

  return (
    <div>
      <h1 className='mb-6 text-2xl font-semibold'>Liked videos</h1>
      <VideoGrid
        videos={videos}
        isLoading={isLoading}
        emptyMessage='Videos you like will appear here.'
      />

      {!isLoading && hasMore && (
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
