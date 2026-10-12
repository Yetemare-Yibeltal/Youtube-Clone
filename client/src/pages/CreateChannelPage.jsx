import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { createChannel } from '../api/channel.api'
import { selectCurrentUser } from '../features/auth/authSlice'

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'

export default function CreateChannelPage () {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: user?.fullName || '',
      handle: user?.username || '',
      description: ''
    }
  })

  async function onSubmit (values) {
    try {
      await createChannel({
        name: values.name.trim(),
        handle: values.handle.trim().toLowerCase(),
        description: values.description.trim()
      })
      toast.success('Channel created')
      navigate(`/channel/${user.username}`, { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create channel')
    }
  }

  return (
    <div className='mx-auto max-w-xl'>
      <h1 className='mb-2 text-2xl font-semibold'>Create your channel</h1>
      <p className='mb-6 text-sm text-neutral-500'>
        A channel lets you upload videos, build an audience and appear in
        search.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
        <div>
          <label htmlFor='name' className='mb-1 block text-sm font-medium'>
            Channel name
          </label>
          <input
            id='name'
            type='text'
            {...register('name', {
              required: 'Channel name is required',
              maxLength: {
                value: 60,
                message: 'Channel name must be 60 characters or fewer'
              }
            })}
            className={inputClass}
          />
          {errors.name && (
            <p className='mt-1 text-xs text-red-500'>{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor='handle' className='mb-1 block text-sm font-medium'>
            Handle
          </label>
          <div className='flex items-center rounded-md border border-neutral-300 focus-within:border-blue-500 dark:border-neutral-700'>
            <span className='pl-3 text-neutral-500'>@</span>
            <input
              id='handle'
              type='text'
              {...register('handle', {
                required: 'Handle is required',
                minLength: {
                  value: 3,
                  message: 'Handle must be at least 3 characters'
                },
                maxLength: {
                  value: 30,
                  message: 'Handle must be 30 characters or fewer'
                },
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message:
                    'Use letters, numbers, dots, underscores and hyphens only'
                }
              })}
              className='w-full bg-transparent px-2 py-2 outline-none'
            />
          </div>
          {errors.handle && (
            <p className='mt-1 text-xs text-red-500'>{errors.handle.message}</p>
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

        <div className='flex items-center justify-end gap-3'>
          <Link
            to='/'
            className='rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
          >
            {isSubmitting ? 'Creating...' : 'Create channel'}
          </button>
        </div>
      </form>
    </div>
  )
}
