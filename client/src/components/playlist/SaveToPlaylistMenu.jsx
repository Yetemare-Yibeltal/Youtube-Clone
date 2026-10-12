import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Bookmark, Check, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addVideoToPlaylist,
  createPlaylist,
  listMyPlaylists,
  removeVideoFromPlaylist
} from '../../api/playlist.api'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import Spinner from '../common/Spinner'

function normalizeList (data) {
  return Array.isArray(data) ? data : data?.results || []
}

function containsVideo (playlist, videoId) {
  return (playlist.videos || []).some(
    video => (video?._id || video) === videoId
  )
}

export default function SaveToPlaylistMenu ({ videoId }) {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside (event) {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleToggleMenu () {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (!nextOpen || hasLoaded) return

    setIsLoading(true)
    try {
      const data = await listMyPlaylists({ limit: 50 })
      setPlaylists(normalizeList(data))
      setHasLoaded(true)
    } catch {
      toast.error('Could not load playlists')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTogglePlaylist (playlist) {
    if (busyId) return
    setBusyId(playlist._id)

    const isSaved = containsVideo(playlist, videoId)
    try {
      if (isSaved) {
        await removeVideoFromPlaylist(playlist._id, videoId)
      } else {
        await addVideoToPlaylist(playlist._id, videoId)
      }

      setPlaylists(previous =>
        previous.map(item => {
          if (item._id !== playlist._id) return item
          const videos = item.videos || []
          return {
            ...item,
            videos: isSaved
              ? videos.filter(video => (video?._id || video) !== videoId)
              : [...videos, videoId]
          }
        })
      )
      toast.success(
        isSaved ? `Removed from ${playlist.name}` : `Saved to ${playlist.name}`
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update playlist')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreate (event) {
    event.preventDefault()
    const name = newName.trim()
    if (!name || isCreating) return

    setIsCreating(true)
    try {
      const created = await createPlaylist({
        name,
        description: '',
        visibility: 'private'
      })
      const playlist = created.playlist || created
      await addVideoToPlaylist(playlist._id, videoId)
      setPlaylists(previous => [
        { ...playlist, videos: [videoId] },
        ...previous
      ])
      setNewName('')
      toast.success(`Saved to ${playlist.name}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create playlist')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className='relative' ref={menuRef}>
      <button
        type='button'
        onClick={handleToggleMenu}
        aria-haspopup='true'
        aria-expanded={isOpen}
        className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
      >
        <Bookmark size={18} />
        Save
      </button>

      {isOpen && (
        <div className='absolute right-0 z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'>
          <p className='mb-2 text-sm font-semibold'>Save to playlist</p>

          {isLoading ? (
            <div className='flex justify-center py-4'>
              <Spinner size='sm' />
            </div>
          ) : (
            <ul className='max-h-56 overflow-y-auto'>
              {playlists.length === 0 && (
                <li className='py-2 text-sm text-neutral-500'>
                  No playlists yet.
                </li>
              )}
              {playlists.map(playlist => {
                const isSaved = containsVideo(playlist, videoId)
                return (
                  <li key={playlist._id}>
                    <button
                      type='button'
                      onClick={() => handleTogglePlaylist(playlist)}
                      disabled={busyId === playlist._id}
                      className='flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-neutral-100 disabled:opacity-60 dark:hover:bg-neutral-800'
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isSaved
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-neutral-400 dark:border-neutral-600'
                        }`}
                      >
                        {isSaved && <Check size={14} />}
                      </span>
                      <span className='truncate'>{playlist.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <form
            onSubmit={handleCreate}
            className='mt-3 flex items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700'
          >
            <input
              value={newName}
              onChange={event => setNewName(event.target.value)}
              maxLength={150}
              placeholder='New playlist name'
              aria-label='New playlist name'
              className='min-w-0 flex-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700'
            />
            <button
              type='submit'
              disabled={!newName.trim() || isCreating}
              aria-label='Create playlist'
              className='rounded-full bg-neutral-900 p-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900'
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
