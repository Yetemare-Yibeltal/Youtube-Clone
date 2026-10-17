import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/auth.api';

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700';

export default function ResetPasswordPage () {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { newPassword: '', confirmPassword: '' } });

  const newPassword = watch('newPassword');

  async function onSubmit (values) {
    try {
      await resetPassword(token, values.newPassword);
      toast.success('Password reset. You can now sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'This reset link is invalid or has expired');
    }
  }

  if (!token) {
    return (
      <div className='text-center'>
        <h1 className='mb-3 text-2xl font-semibold'>Invalid link</h1>
        <p className='mb-6 text-sm text-neutral-500'>This password reset link is missing its token.</p>
        <Link to='/forgot-password' className='text-sm font-medium text-blue-600'>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className='mb-2 text-2xl font-semibold'>Choose a new password</h1>
      <p className='mb-6 text-sm text-neutral-500'>
        Use at least 8 characters with a lowercase letter, an uppercase letter and a number.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div>
          <label htmlFor='newPassword' className='mb-1 block text-sm font-medium'>
            New password
          </label>
          <input
            id='newPassword'
            type='password'
            autoComplete='new-password'
            {...register('newPassword', {
              required: 'New password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              validate: {
                lowercase: (value) => /[a-z]/.test(value) || 'Include a lowercase letter',
                uppercase: (value) => /[A-Z]/.test(value) || 'Include an uppercase letter',
                number: (value) => /[0-9]/.test(value) || 'Include a number',
              },
            })}
            className={inputClass}
          />
          {errors.newPassword && <p className='mt-1 text-xs text-red-500'>{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor='confirmPassword' className='mb-1 block text-sm font-medium'>
            Confirm new password
          </label>
          <input
            id='confirmPassword'
            type='password'
            autoComplete='new-password'
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
            className={inputClass}
          />
          {errors.confirmPassword && <p className='mt-1 text-xs text-red-500'>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
        >
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
