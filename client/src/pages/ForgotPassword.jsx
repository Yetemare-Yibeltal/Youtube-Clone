import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '../api/auth.api';

export default function ForgotPasswordPage () {
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  async function onSubmit ({ email }) {
    try {
      await requestPasswordReset(email.trim());
      setIsSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send the reset link');
    }
  }

  if (isSent) {
    return (
      <div className='text-center'>
        <h1 className='mb-3 text-2xl font-semibold'>Check your email</h1>
        <p className='mb-6 text-sm text-neutral-500'>
          If that email is registered, we sent a link to reset your password. The link expires soon, so use it right
          away.
        </p>
        <Link to='/login' className='text-sm font-medium text-blue-600'>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className='mb-2 text-2xl font-semibold'>Forgot your password?</h1>
      <p className='mb-6 text-sm text-neutral-500'>Enter your email and we will send you a link to reset it.</p>

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div>
          <label htmlFor='email' className='mb-1 block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            type='email'
            autoComplete='email'
            {...register('email', { required: 'Email is required' })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email.message}</p>}
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className='mt-6 text-center text-sm text-neutral-500'>
        Remembered it?{' '}
        <Link to='/login' className='font-medium text-blue-600'>
          Sign in
        </Link>
      </p>
    </div>
  );
}
