import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListVideo, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createPlaylist,
  deletePlaylist,
  listMyPlaylists
} from '../api/playlist.api'
import Spinner from '../components/common/Spinner'

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'

function normalizeList (data) {
  return Array.isArray(data) ? data : data?.results || []
}

function getVideoCount (playlist) {
  return playlist.videosCount ?? playlist.videos?.length ?? 0
}

function getCover (playlist) {
  if (playlist.thumbnail) return playlist.thumbnail
  const firstVideo = playlist.videos?.find(
    video => video && typeof video === 'object'
  )
  return firstVideo?.thumbnail?.url || ''
}

export default function PlaylistsPage () {
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: { name: '', description: '', visibility: 'private' }
  })

  useEffect(() => {
    let isMounted = true

    listMyPlaylists({ limit: 50 })
      .then(data => {
        if (isMounted) setPlaylists(normalizeList(data))
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load playlists')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function onCreate (values) {
    try {
      const created = await createPlaylist({
        name: values.name.trim(),
        description: values.description.trim(),
        visibility: values.visibility
      })
      setPlaylists(previous => [created.playlist || created, ...previous])
      reset()
      setIsFormOpen(false)
      toast.success('Playlist created')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create playlist')
    }
  }

  async function handleDelete (playlistId) {
    if (!window.confirm('Delete this playlist?')) return
    try {
      await deletePlaylist(playlistId)
      setPlaylists(previous =>
        previous.filter(playlist => playlist._id !== playlistId)
      )
      toast.success('Playlist deleted')
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

  return (
    <div>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Playlists</h1>
        <button
          type='button'
          onClick={() => setIsFormOpen(open => !open)}
          className='flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
        >
          <Plus size={18} />
          New playlist
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className='mb-8 flex max-w-xl flex-col gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800'
        >
          <div>
            <label
              htmlFor='playlist-name'
              className='mb-1 block text-sm font-medium'
            >
              Name
            </label>
            <input
              id='playlist-name'
              type='text'
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
              <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='playlist-description'
              className='mb-1 block text-sm font-medium'
            >
              Description
            </label>
            <textarea
              id='playlist-description'
              rows={3}
              {...register('description', {
                maxLength: { value: 5000, message: 'Description is too long' }
              })}
              className={`${inputClass} resize-none`}
            />
            {errors.description && (
              <p className='mt-1 text-xs text-red-500'>
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='playlist-visibility'
              className='mb-1 block text-sm font-medium'
            >
              Visibility
            </label>
            <select
              id='playlist-visibility'
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
          </div>

          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={() => {
                reset()
                setIsFormOpen(false)
              }}
              className='rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {playlists.length === 0 ? (
        <p className='py-20 text-center text-neutral-500'>
          You have not created any playlists yet.
        </p>
      ) : (
        <div className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {playlists.map(playlist => {
            const cover = getCover(playlist)
            const count = getVideoCount(playlist)
            return (
              <div key={playlist._id} className='relative'>
                <Link to={`/playlists/${playlist._id}`} className='group block'>
                  <div className='relative aspect-video overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800'>
                    {cover ? (
                      <img
                        src={cover}
                        alt={playlist.name}
                        loading='lazy'
                        className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center text-neutral-500'>
                        <ListVideo size={36} />
                      </div>
                    )}
                    <span className='absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white'>
                      {count} {count === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  <h3 className='mt-2 line-clamp-2 text-sm font-semibold'>
                    {playlist.name}
                  </h3>
                  <p className='text-xs capitalize text-neutral-500'>
                    {playlist.visibility}
                  </p>
                </Link>

                {!playlist.isSystem && (
                  <button
                    type='button'
                    onClick={() => handleDelete(playlist._id)}
                    aria-label={`Delete playlist ${playlist.name}`}
                    className='absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black'
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
