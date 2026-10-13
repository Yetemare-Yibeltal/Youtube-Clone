import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { toggleVideoLike } from '../../api/like.api'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import { formatCompactNumber } from '../../utils/formatters'

export default function LikeDislikeButtons ({
  videoId,
  initialStatus,
  initialLikes,
  initialDislikes
}) {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [status, setStatus] = useState(initialStatus || null)
  const [likes, setLikes] = useState(initialLikes || 0)
  const [dislikes, setDislikes] = useState(initialDislikes || 0)
  const [isLoading, setIsLoading] = useState(false)

  async function handleReaction (type) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isLoading) return

    setIsLoading(true)
    try {
      const data = await toggleVideoLike(videoId, type)
      setStatus(data.status)
      setLikes(data.likesCount)
      setDislikes(data.dislikesCount)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update reaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex items-center overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800'>
      <button
        type='button'
        onClick={() => handleReaction('like')}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
          status === 'like' ? 'text-blue-600' : ''
        }`}
      >
        <ThumbsUp
          size={18}
          fill={status === 'like' ? 'currentColor' : 'none'}
        />
        {formatCompactNumber(likes)}
      </button>
      <div className='h-6 w-px bg-neutral-300 dark:bg-neutral-600' />
      <button
        type='button'
        onClick={() => handleReaction('dislike')}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
          status === 'dislike' ? 'text-blue-600' : ''
        }`}
      >
        <ThumbsDown
          size={18}
          fill={status === 'dislike' ? 'currentColor' : 'none'}
        />
        {dislikes > 0 ? formatCompactNumber(dislikes) : ''}
      </button>
    </div>
  )
}
