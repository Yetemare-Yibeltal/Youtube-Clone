import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { login, selectAuthStatus } from '../features/auth/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit(values) {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.payload || 'Login failed');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="identifier" className="mb-1 block text-sm font-medium">
            Email or username
          </label>
          <input
            id="identifier"
            type="text"
            {...register('identifier', { required: 'Email or username is required' })}
            className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700"
          />
          {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700"
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        New to StreamTube?{' '}
        <Link to="/register" className="font-medium text-blue-600">
          Create an account
        </Link>
      </p>
    </div>
  );
}