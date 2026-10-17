import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail } from '../api/auth.api';
import Spinner from '../components/common/Spinner';
import { selectCurrentUser, setUser } from '../features/auth/authSlice';

export default function VerifyEmailPage () {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [status, setStatus] = useState(token ? 'verifying' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This verification link is missing its token.');
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!token || hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    verifyEmail(token)
      .then((user) => {
        setStatus('success');
        if (currentUser && user?._id === currentUser._id) dispatch(setUser(user));
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [token, currentUser, dispatch]);

  if (status === 'verifying') {
    return (
      <div className='flex flex-col items-center gap-4 py-6'>
        <Spinner size='lg' />
        <p className='text-sm text-neutral-500'>Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className='text-center'>
        <h1 className='mb-3 text-2xl font-semibold'>Email verified</h1>
        <p className='mb-6 text-sm text-neutral-500'>Thanks. Your email address is confirmed.</p>
        <Link
          to={currentUser ? '/' : '/login'}
          className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900'
        >
          {currentUser ? 'Go to VidTube' : 'Sign in'}
        </Link>
      </div>
    );
  }

  return (
    <div className='text-center'>
      <h1 className='mb-3 text-2xl font-semibold'>Verification failed</h1>
      <p className='mb-6 text-sm text-neutral-500'>{message}</p>
      <Link to='/login' className='text-sm font-medium text-blue-600'>
        Back to sign in
      </Link>
    </div>
  );
}
