import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Camera, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  changePassword,
  deleteAccount,
  updateAccount,
  updateAvatar,
  updateCoverImage
} from '../api/user.api'
import { selectCurrentUser, setUser } from '../features/auth/authSlice'
import { selectThemeMode, toggleTheme } from '../features/theme/themeSlice'
import Avatar from '../components/common/Avatar'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'

const primaryButtonClass =
  'rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'

function Section ({ title, description, children }) {
  return (
    <section className='border-b border-neutral-200 py-6 dark:border-neutral-800'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      {description && (
        <p className='mb-4 mt-1 text-sm text-neutral-500'>{description}</p>
      )}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
  )
}

function FieldError ({ error }) {
  if (!error) return null
  return <p className='mt-1 text-xs text-red-500'>{error.message}</p>
}

export default function SettingsPage () {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const themeMode = useSelector(selectThemeMode)
  const [uploadingKind, setUploadingKind] = useState(null)

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors, isSubmitting: isAccountSubmitting }
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      username: user?.username || ''
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm()

  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors, isSubmitting: isDeleteSubmitting }
  } = useForm()

  const newPassword = watchPassword('newPassword')

  async function onAccountSubmit (values) {
    try {
      const updated = await updateAccount({
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase()
      })
      dispatch(setUser(updated))
      toast.success('Account updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update account')
    }
  }

  async function handleImageChange (kind, event) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file')
      input.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be smaller than 5MB')
      input.value = ''
      return
    }

    setUploadingKind(kind)
    try {
      const updated =
        kind === 'avatar'
          ? await updateAvatar(file)
          : await updateCoverImage(file)
      dispatch(setUser(updated))
      toast.success(
        kind === 'avatar' ? 'Profile photo updated' : 'Cover image updated'
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not upload image')
    } finally {
      setUploadingKind(null)
      input.value = ''
    }
  }

  async function onPasswordSubmit (values) {
    try {
      await changePassword(values)
      resetPasswordForm()
      toast.success('Password changed')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not change password')
    }
  }

  async function onDeleteSubmit (values) {
    if (
      !window.confirm(
        'This permanently deletes your account and channel. Continue?'
      )
    )
      return
    try {
      await deleteAccount(values.password)
      dispatch(setUser(null))
      toast.success('Your account has been deleted')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete account')
    }
  }

  if (!user) return null

  return (
    <div className='mx-auto max-w-2xl'>
      <h1 className='mb-2 text-2xl font-semibold'>Settings</h1>

      <Section
        title='Profile images'
        description='Your profile photo and cover image appear across your channel.'
      >
        <div className='relative mb-12 h-32 overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800'>
          {user.coverImage?.url && (
            <img
              src={user.coverImage.url}
              alt='Cover'
              className='h-full w-full object-cover'
            />
          )}
          <label className='absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80'>
            <Camera size={14} />
            {uploadingKind === 'cover' ? 'Uploading...' : 'Change cover'}
            <input
              type='file'
              accept='image/*'
              className='hidden'
              disabled={uploadingKind !== null}
              onChange={event => handleImageChange('cover', event)}
            />
          </label>

          <div className='absolute -bottom-10 left-4'>
            <div className='relative'>
              <Avatar
                src={user.avatar?.url}
                name={user.fullName}
                size={80}
                className='border-4 border-white dark:border-neutral-900'
              />
              <label
                className='absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900'
                aria-label='Change profile photo'
              >
                <Camera size={14} />
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  disabled={uploadingKind !== null}
                  onChange={event => handleImageChange('avatar', event)}
                />
              </label>
            </div>
          </div>
        </div>
        {uploadingKind === 'avatar' && (
          <p className='text-sm text-neutral-500'>Uploading profile photo...</p>
        )}
      </Section>

      <Section title='Account' description='Update your name and username.'>
        <form
          onSubmit={handleAccountSubmit(onAccountSubmit)}
          className='flex flex-col gap-4'
        >
          <div>
            <label
              htmlFor='fullName'
              className='mb-1 block text-sm font-medium'
            >
              Full name
            </label>
            <input
              id='fullName'
              type='text'
              {...registerAccount('fullName', {
                required: 'Full name is required',
                maxLength: {
                  value: 100,
                  message: 'Full name must be 100 characters or fewer'
                }
              })}
              className={inputClass}
            />
            <FieldError error={accountErrors.fullName} />
          </div>

          <div>
            <label
              htmlFor='username'
              className='mb-1 block text-sm font-medium'
            >
              Username
            </label>
            <input
              id='username'
              type='text'
              {...registerAccount('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'At least 3 characters' },
                maxLength: { value: 30, message: 'At most 30 characters' },
                pattern: {
                  value: /^[a-z0-9._]+$/i,
                  message: 'Letters, numbers, dots and underscores only'
                }
              })}
              className={inputClass}
            />
            <FieldError error={accountErrors.username} />
          </div>

          <div>
            <button
              type='submit'
              disabled={isAccountSubmitting}
              className={primaryButtonClass}
            >
              {isAccountSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Section>

      <Section
        title='Password'
        description='Changing your password signs you out of your other sessions.'
      >
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className='flex flex-col gap-4'
        >
          <div>
            <label
              htmlFor='currentPassword'
              className='mb-1 block text-sm font-medium'
            >
              Current password
            </label>
            <input
              id='currentPassword'
              type='password'
              autoComplete='current-password'
              {...registerPassword('currentPassword', {
                required: 'Current password is required'
              })}
              className={inputClass}
            />
            <FieldError error={passwordErrors.currentPassword} />
          </div>

          <div>
            <label
              htmlFor='newPassword'
              className='mb-1 block text-sm font-medium'
            >
              New password
            </label>
            <input
              id='newPassword'
              type='password'
              autoComplete='new-password'
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'At least 8 characters' }
              })}
              className={inputClass}
            />
            <FieldError error={passwordErrors.newPassword} />
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='mb-1 block text-sm font-medium'
            >
              Confirm new password
            </label>
            <input
              id='confirmPassword'
              type='password'
              autoComplete='new-password'
              {...registerPassword('confirmPassword', {
                required: 'Please confirm your new password',
                validate: value =>
                  value === newPassword || 'Passwords do not match'
              })}
              className={inputClass}
            />
            <FieldError error={passwordErrors.confirmPassword} />
          </div>

          <div>
            <button
              type='submit'
              disabled={isPasswordSubmitting}
              className={primaryButtonClass}
            >
              {isPasswordSubmitting ? 'Updating...' : 'Change password'}
            </button>
          </div>
        </form>
      </Section>

      <Section
        title='Appearance'
        description='Choose how StreamTube looks on this device.'
      >
        <button
          type='button'
          onClick={() => dispatch(toggleTheme())}
          className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          Switch to {themeMode === 'dark' ? 'light' : 'dark'} theme
        </button>
      </Section>

      <Section
        title='Delete account'
        description='This permanently removes your account, channel and playlists.'
      >
        <form
          onSubmit={handleDeleteSubmit(onDeleteSubmit)}
          className='flex flex-col gap-4'
        >
          <div>
            <label
              htmlFor='deletePassword'
              className='mb-1 block text-sm font-medium'
            >
              Confirm with your password
            </label>
            <input
              id='deletePassword'
              type='password'
              autoComplete='current-password'
              {...registerDelete('password', {
                required: 'Password is required to delete your account'
              })}
              className={inputClass}
            />
            <FieldError error={deleteErrors.password} />
          </div>
          <div>
            <button
              type='submit'
              disabled={isDeleteSubmitting}
              className='rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60'
            >
              {isDeleteSubmitting ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  )
}
