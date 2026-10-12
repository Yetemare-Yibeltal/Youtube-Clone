import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  deletePlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist
} from '../api/playlist.api'
import Spinner from '../components/common/Spinner'
import VideoCard from '../components/video/VideoCard'
import { selectCurrentUser } from '../features/auth/authSlice'

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'

export default function PlaylistDetailPage () {
  const { playlistId } = useParams()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [playlist, setPlaylist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm()

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setIsEditing(false)

    getPlaylistById(playlistId)
      .then(data => {
        if (!isMounted) return
        const loaded = data.playlist || data
        setPlaylist(loaded)
        reset({
          name: loaded.name,
          description: loaded.description || '',
          visibility: loaded.visibility
        })
      })
      .catch(() => {
        if (isMounted) setPlaylist(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [playlistId, reset])

  async function onSave (values) {
    try {
      await updatePlaylist(playlistId, {
        name: values.name.trim(),
        description: values.description.trim(),
        visibility: values.visibility
      })
      setPlaylist(previous => ({
        ...previous,
        name: values.name.trim(),
        description: values.description.trim(),
        visibility: values.visibility
      }))
      setIsEditing(false)
      toast.success('Playlist updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update playlist')
    }
  }

  async function handleRemoveVideo (videoId) {
    try {
      await removeVideoFromPlaylist(playlistId, videoId)
      setPlaylist(previous => ({
        ...previous,
        videos: previous.videos.filter(
          video => (video?._id || video) !== videoId
        )
      }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove video')
    }
  }

  async function handleDeletePlaylist () {
    if (!window.confirm('Delete this playlist?')) return
    try {
      await deletePlaylist(playlistId)
      toast.success('Playlist deleted')
      navigate('/playlists', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete playlist')
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (!playlist) {
    return (
      <p className='py-20 text-center text-neutral-500'>
        This playlist is unavailable.
      </p>
    )
  }

  const ownerId = playlist.owner?._id || playlist.owner
  const isOwner = Boolean(currentUser && ownerId === currentUser._id)
  const videos = (playlist.videos || []).filter(
    video => video && typeof video === 'object'
  )

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
        {isEditing ? (
          <form
            onSubmit={handleSubmit(onSave)}
            className='flex w-full max-w-xl flex-col gap-3'
          >
            <div>
              <input
                type='text'
                aria-label='Playlist name'
                {...register('name', {
                  required: 'Name is required',
                  maxLength: {
                    value: 150,
                    message: 'Name must be 150 characters or fewer'
                  }
                })}
                className={inputClass}
              />
              {errors.name && (
                <p className='mt-1 text-xs text-red-500'>
                  {errors.name.message}
                </p>
              )}
            </div>
            <textarea
              rows={3}
              aria-label='Playlist description'
              {...register('description', {
                maxLength: { value: 5000, message: 'Description is too long' }
              })}
              className={`${inputClass} resize-none`}
            />
            <select
              aria-label='Playlist visibility'
              {...register('visibility')}
              className={inputClass}
            >
              <option value='private' className='dark:bg-neutral-900'>
                Private
              </option>
              <option value='unlisted' className='dark:bg-neutral-900'>
                Unlisted
              </option>
              <option value='public' className='dark:bg-neutral-900'>
                Public
              </option>
            </select>
            <div className='flex gap-2'>
              <button
                type='submit'
                disabled={isSubmitting}
                className='rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                type='button'
                onClick={() => setIsEditing(false)}
                className='rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800'
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className='min-w-0'>
            <h1 className='text-2xl font-semibold'>{playlist.name}</h1>
            <p className='mt-1 text-sm capitalize text-neutral-500'>
              {playlist.visibility} &middot; {videos.length}{' '}
              {videos.length === 1 ? 'video' : 'videos'}
            </p>
            {playlist.description && (
              <p className='mt-2 max-w-2xl whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400'>
                {playlist.description}
              </p>
            )}
          </div>
        )}

        {isOwner && !playlist.isSystem && !isEditing && (
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setIsEditing(true)}
              className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              type='button'
              onClick={handleDeletePlaylist}
              className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <p className='py-20 text-center text-neutral-500'>
          This playlist has no videos yet.
        </p>
      ) : (
        <div className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {videos.map(video => (
            <div key={video._id} className='relative'>
              <VideoCard video={video} />
              {isOwner && (
                <button
                  type='button'
                  onClick={() => handleRemoveVideo(video._id)}
                  aria-label='Remove from playlist'
                  className='absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black'
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
