import { useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'
import ReportButton from '../report/ReportButton';
import { formatRelativeTime } from '../../utils/formatters'
import {
  addComment,
  deleteComment,
  listReplies,
  updateComment
} from '../../api/comment.api'
import { selectCurrentUser } from '../../features/auth/authSlice'

export default function CommentItem ({ comment, videoId, onDeleted }) {
  const currentUser = useSelector(selectCurrentUser)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [content, setContent] = useState(comment.content)
  const [replies, setReplies] = useState([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount || 0)

  const isOwner = currentUser && currentUser._id === comment.owner?._id

  async function handleLoadReplies () {
    if (!repliesLoaded) {
      try {
        const data = await listReplies(comment._id)
        setReplies(data.results)
        setRepliesLoaded(true)
      } catch {
        toast.error('Could not load replies')
        return
      }
    }
    setShowReplies(value => !value)
  }

  async function handleReplySubmit (event) {
    event.preventDefault()
    if (!replyText.trim()) return

    try {
      const newReply = await addComment(videoId, replyText.trim(), comment._id)
      setReplies(prev => [newReply, ...prev])
      setRepliesCount(count => count + 1)
      setRepliesLoaded(true)
      setShowReplies(true)
      setReplyText('')
      setIsReplying(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not post reply')
    }
  }

  async function handleUpdate (event) {
    event.preventDefault()
    if (!editText.trim()) return

    try {
      const updated = await updateComment(comment._id, editText.trim())
      setContent(updated.content)
      setIsEditing(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update comment')
    }
  }

  async function handleDelete () {
    try {
      await deleteComment(comment._id)
      onDeleted?.(comment._id)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete comment')
    }
  }

  return (
    <div className='flex gap-3'>
      <Avatar
        src={comment.owner?.avatar?.url}
        name={comment.owner?.fullName}
        size={36}
        className='shrink-0'
      />
      <div className='min-w-0 flex-1'>
        <div className='flex items-baseline gap-2'>
          <span className='text-sm font-semibold'>
            {comment.owner?.username}
          </span>
          <span className='text-xs text-neutral-500'>
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className='mt-1'>
            <textarea
              value={editText}
              onChange={event => setEditText(event.target.value)}
              rows={2}
              className='w-full resize-none rounded-md border border-neutral-300 bg-transparent p-2 text-sm outline-none dark:border-neutral-700'
            />
            <div className='mt-1 flex gap-2'>
              <button
                type='submit'
                className='rounded-full bg-neutral-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-neutral-900'
              >
                Save
              </button>
              <button
                type='button'
                onClick={() => setIsEditing(false)}
                className='rounded-full px-3 py-1 text-xs'
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className='mt-1 whitespace-pre-wrap text-sm'>{content}</p>
        )}

        <div className='mt-1 flex items-center gap-4 text-xs font-medium text-neutral-500'>
          <button type='button' onClick={() => setIsReplying(value => !value)}>
            Reply
          </button>
{
  !isOwner && (
    <ReportButton
      targetType='comment'
      targetId={comment._id}
      label='Report'
      className='flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-200'
    />
  )};

          {isOwner && !isEditing && (
            <>
              <button type='button' onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button type='button' onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <form
            onSubmit={handleReplySubmit}
            className='mt-2 flex items-start gap-2'
          >
            <input
              value={replyText}
              onChange={event => setReplyText(event.target.value)}
              placeholder='Add a reply...'
              className='w-full border-b border-neutral-300 bg-transparent py-1 text-sm outline-none dark:border-neutral-700'
            />
            
          </form>
        )}

        {repliesCount > 0 && (
          <button
            type='button'
            onClick={handleLoadReplies}
            className='mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600'
          >
            {showReplies ? 'Hide' : 'View'} {repliesCount}{' '}
            {repliesCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {showReplies && (
          <div className='mt-3 flex flex-col gap-4'>
            {replies.map(reply => (
              <CommentItem
                key={reply._id}
                comment={reply}
                videoId={videoId}
                onDeleted={id => {
                  setReplies(prev => prev.filter(item => item._id !== id))
                  setRepliesCount(count => Math.max(0, count - 1))
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
