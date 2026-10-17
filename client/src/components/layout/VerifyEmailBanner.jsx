import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { resendVerificationEmail } from '../../api/auth.api';
import { selectCurrentUser } from '../../features/auth/authSlice';

export default function VerifyEmailBanner () {
  const user = useSelector(selectCurrentUser);
  const [isSending, setIsSending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || user.isEmailVerified !== false || isDismissed) return null;

  async function handleResend () {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send the verification email');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'>
      <p>Please verify your email address. Check your inbox for the confirmation link.</p>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={handleResend}
          disabled={isSending}
          className='rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 dark:bg-amber-100 dark:text-amber-900'
        >
          {isSending ? 'Sending...' : 'Resend email'}
        </button>
        <button type='button' onClick={() => setIsDismissed(true)} className='text-xs font-medium underline'>
          Dismiss
        </button>
      </div>
    </div>
  );
}
