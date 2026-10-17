import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { register as registerUser, selectAuthStatus } from '../features/auth/authSlice';

export default function RegisterPage () {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  async function onSubmit (values) {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created. You can now sign in.');
      navigate('/login');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  }

  return (
    <div>
      <h1 className='mb-6 text-2xl font-semibold'>Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
        <div>
          <label htmlFor='fullName' className='mb-1 block text-sm font-medium'>
            Full name
          </label>
          <input
            id='fullName'
            type='text'
            {...register('fullName', { required: 'Full name is required' })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.fullName && <p className='mt-1 text-xs text-red-500'>{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor='username' className='mb-1 block text-sm font-medium'>
            Username
          </label>
          <input
            id='username'
            type='text'
            {...register('username', {
              required: 'Username is required',
              minLength: { value: 3, message: 'At least 3 characters' },
              pattern: {
                value: /^[a-z0-9._]+$/i,
                message: 'Letters, numbers, dots and underscores only',
              },
              validate: {
                lowercase: (value) => /[a-z]/.test(value) || 'Include a lowercase letter',
                uppercase: (value) => /[A-Z]/.test(value) || 'Include an uppercase letter',
                number: (value) => /[0-9]/.test(value) || 'Include a number',
              },
            })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.username && <p className='mt-1 text-xs text-red-500'>{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor='email' className='mb-1 block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            type='email'
            {...register('email', { required: 'Email is required' })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor='password' className='mb-1 block text-sm font-medium'>
            Password
          </label>
          <input
            id='password'
            type='password'
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.password && <p className='mt-1 text-xs text-red-500'>{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor='confirmPassword' className='mb-1 block text-sm font-medium'>
            Confirm password
          </label>
          <input
            id='confirmPassword'
            type='password'
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
            className='w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700'
          />
          {errors.confirmPassword && <p className='mt-1 text-xs text-red-500'>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type='submit'
          disabled={status === 'loading'}
          className='mt-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
        >
          {status === 'loading' ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className='mt-6 text-center text-sm text-neutral-500'>
        Already have an account?{' '}
        <Link to='/login' className='font-medium text-blue-600'>
          Sign in
        </Link>
      </p>
    </div>
  );
}
