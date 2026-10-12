import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchVideos } from '../api/search.api'
import Spinner from '../components/common/Spinner'
import VideoGrid from '../components/video/VideoGrid'

const PAGE_SIZE = 24

export default function SearchPage () {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const [videos, setVideos] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setVideos([])
    setTotal(0)
    setPage(1)
    setHasError(false)

    if (!query) {
      setIsLoading(false)
      return undefined
    }

    let isMounted = true
    setIsLoading(true)

    searchVideos({ q: query, page: 1, limit: PAGE_SIZE })
      .then(data => {
        if (!isMounted) return
        setVideos(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) setHasError(true)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [query])

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1
    setIsLoadingMore(true)
    try {
      const data = await searchVideos({
        q: query,
        page: nextPage,
        limit: PAGE_SIZE
      })
      setVideos(previous => [...previous, ...data.results])
      setTotal(data.pagination?.total ?? total)
      setPage(nextPage)
    } catch {
      setHasError(true)
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, query, total])

  if (!query) {
    return (
      <p className='py-20 text-center text-neutral-500'>
        Type something in the search bar to find videos.
      </p>
    )
  }

  const hasMore = videos.length < total

  return (
    <div>
      <h1 className='mb-4 text-lg font-medium text-neutral-600 dark:text-neutral-400'>
        Search results for{' '}
        <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
          "{query}"
        </span>
      </h1>

      {hasError && videos.length === 0 ? (
        <p className='py-20 text-center text-neutral-500'>
          Something went wrong while searching. Please try again.
        </p>
      ) : (
        <VideoGrid
          videos={videos}
          isLoading={isLoading}
          emptyMessage='No results found'
        />
      )}

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
