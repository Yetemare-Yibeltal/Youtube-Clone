import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listVideos } from '../api/video.api'
import VideoGrid from '../components/video/VideoGrid'
import { CATEGORIES } from '../utils/categories'

export default function HomePage () {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'all'
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const params = { sortBy: 'newest', limit: 24 }
    if (activeCategory !== 'all') params.category = activeCategory

    listVideos(params)
      .then(data => {
        if (isMounted) setVideos(data.results)
      })
      .catch(() => {
        if (isMounted) setVideos([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeCategory])

  function selectCategory (value) {
    if (value === 'all') setSearchParams({})
    else setSearchParams({ category: value })
  }

  const chipClass = isActive =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
      isActive
        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
    }`

  return (
    <div>
      <div className='mb-6 flex gap-2 overflow-x-auto pb-2'>
        <button
          type='button'
          onClick={() => selectCategory('all')}
          className={chipClass(activeCategory === 'all')}
        >
          All
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category.value}
            type='button'
            onClick={() => selectCategory(category.value)}
            className={chipClass(activeCategory === category.value)}
          >
            {category.icon && (
              <img
                src={category.icon}
                alt=''
                className={`h-4 w-4 ${
                  activeCategory === category.value ? 'invert' : ''
                }`}
              />
            )}
            {category.label}
          </button>
        ))}
      </div>

      <VideoGrid
        videos={videos}
        isLoading={isLoading}
        emptyMessage='No videos yet. Be the first to upload!'
      />
    </div>
  )
}
