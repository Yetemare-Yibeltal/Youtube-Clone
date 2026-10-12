import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UploadCloud } from 'lucide-react'
import { uploadVideo } from '../api/video.api'

const CATEGORIES = [
  'music',
  'gaming',
  'news',
  'sports',
  'education',
  'entertainment',
  'technology',
  'travel',
  'comedy',
  'howto',
  'other'
]

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'

export default function UploadPage () {
  const navigate = useNavigate()
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { category: 'other', visibility: 'public', isShort: false }
  })

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  function handleVideoChange (event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a valid video file')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error('Video must be smaller than 2GB')
      return
    }
    setVideoFile(file)
  }

  function handleThumbnailChange (event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file')
      return
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error('Thumbnail must be smaller than 5MB')
      return
    }
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  async function onSubmit (values) {
    if (!videoFile) {
      toast.error('Please select a video file')
      return
    }
    if (!thumbnailFile) {
      toast.error('Please select a thumbnail image')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const tags = values.tags
        ? values.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : []

      const video = await uploadVideo(
        { ...values, videoFile, thumbnailFile, tags },
        progressEvent => {
          if (!progressEvent.total) return
          setUploadProgress(
            Math.round((progressEvent.loaded * 100) / progressEvent.total)
          )
        }
      )

      toast.success('Video uploaded. It is processing now.')
      navigate(`/watch/${video._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <h1 className='mb-6 text-2xl font-semibold'>Upload video</h1>

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
        <div>
          <span className='mb-1 block text-sm font-medium'>Video file</span>
          <label className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 hover:border-brand dark:border-neutral-700'>
            <UploadCloud size={32} />
            {videoFile
              ? videoFile.name
              : 'Click to select a video file (MP4, WebM)'}
            <input
              type='file'
              accept='video/*'
              className='hidden'
              onChange={handleVideoChange}
            />
          </label>
        </div>

        <div>
          <span className='mb-1 block text-sm font-medium'>Thumbnail</span>
          <label className='flex h-36 w-64 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand dark:border-neutral-700'>
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt='Thumbnail preview'
                className='h-full w-full object-cover'
              />
            ) : (
              'Choose an image'
            )}
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleThumbnailChange}
            />
          </label>
        </div>

        <div>
          <label htmlFor='title' className='mb-1 block text-sm font-medium'>
            Title
          </label>
          <input
            id='title'
            type='text'
            {...register('title', {
              required: 'Title is required',
              maxLength: {
                value: 100,
                message: 'Title must be 100 characters or fewer'
              }
            })}
            className={inputClass}
          />
          {errors.title && (
            <p className='mt-1 text-xs text-red-500'>{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='description'
            className='mb-1 block text-sm font-medium'
          >
            Description
          </label>
          <textarea
            id='description'
            rows={4}
            {...register('description', {
              maxLength: {
                value: 5000,
                message: 'Description must be 5000 characters or fewer'
              }
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
          <label htmlFor='tags' className='mb-1 block text-sm font-medium'>
            Tags (comma separated)
          </label>
          <input
            id='tags'
            type='text'
            placeholder='react, tutorial, webdev'
            {...register('tags')}
            className={inputClass}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label
              htmlFor='category'
              className='mb-1 block text-sm font-medium'
            >
              Category
            </label>
            <select
              id='category'
              {...register('category')}
              className={`${inputClass} capitalize`}
            >
              {CATEGORIES.map(category => (
                <option
                  key={category}
                  value={category}
                  className='dark:bg-neutral-900'
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor='visibility'
              className='mb-1 block text-sm font-medium'
            >
              Visibility
            </label>
            <select
              id='visibility'
              {...register('visibility')}
              className={inputClass}
            >
              <option value='public' className='dark:bg-neutral-900'>
                Public
              </option>
              <option value='unlisted' className='dark:bg-neutral-900'>
                Unlisted
              </option>
              <option value='private' className='dark:bg-neutral-900'>
                Private
              </option>
            </select>
          </div>
        </div>

        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('isShort')} />
          This is a Short (vertical video under 60 seconds)
        </label>

        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('ageRestricted')} />
          Age-restricted content
        </label>

        {isSubmitting && (
          <div
            className='h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700'
            role='progressbar'
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className='h-full bg-brand transition-all'
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
        >
          {isSubmitting ? `Uploading... ${uploadProgress}%` : 'Publish'}
        </button>
      </form>
    </div>
  )
}
