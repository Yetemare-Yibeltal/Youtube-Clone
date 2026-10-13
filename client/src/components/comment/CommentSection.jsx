import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addComment, listComments } from '../../api/comment.api'
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../features/auth/authSlice'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'
import CommentItem from './CommentItem'

export default function CommentSection ({ videoId, commentsCount }) {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [total, setTotal] = useState(commentsCount || 0)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    listComments(videoId)
      .then(data => {
        if (!isMounted) return
        setComments(data.results)
        setTotal(data.pagination?.total ?? data.results.length)
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load comments')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [videoId])

  async function handleSubmit (event) {
    event.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return

    try {
      const created = await addComment(videoId, newComment.trim())
      setComments(prev => [created, ...prev])
      setTotal(count => count + 1)
      setNewComment('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not post comment')
    }
  }

  function handleDeleted (commentId) {
    setComments(prev => prev.filter(comment => comment._id !== commentId))
    setTotal(count => Math.max(0, count - 1))
  }

  return (
    <section className='mt-6'>
      <h2 className='mb-4 text-lg font-semibold'>{total} Comments</h2>

      <form onSubmit={handleSubmit} className='mb-6 flex items-start gap-3'>
        <Avatar
          src={currentUser?.avatar?.url}
          name={currentUser?.fullName}
          size={36}
        />
        <div className='flex-1'>
          <input
            value={newComment}
            onChange={event => setNewComment(event.target.value)}
            placeholder='Add a comment...'
            className='w-full border-b border-neutral-300 bg-transparent py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-200'
          />
          {newComment && (
            <div className='mt-2 flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => setNewComment('')}
                className='rounded-full px-3 py-1.5 text-sm'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900'
              >
                Comment
              </button>
            </div>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <Spinner />
        </div>
      ) : (
        <div className='flex flex-col gap-6'>
          {comments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              videoId={videoId}
              onDeleted={handleDeleted}
            />
          ))}
          {comments.length === 0 && (
            <p className='text-sm text-neutral-500'>Be the first to comment.</p>
          )}
        </div>
      )}
    </section>
  )
}
