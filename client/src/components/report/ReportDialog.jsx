import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReport } from '../../api/report.api';
import { REPORT_REASONS } from '../../utils/reportReasons';

export default function ReportDialog ({ isOpen, onClose, targetType, targetId }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown (event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit (event) {
    event.preventDefault();
    if (!reason) {
      toast.error('Choose a reason for your report');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({ targetType, targetId, reason, details: details.trim() });
      toast.success('Thanks for letting us know. We will review this.');
      setReason('');
      setDetails('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit your report');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onMouseDown={onClose}>
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='report-dialog-title'
        onMouseDown={(event) => event.stopPropagation()}
        className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900'
      >
        <div className='mb-4 flex items-center justify-between'>
          <h2 id='report-dialog-title' className='text-lg font-semibold'>
            Report {targetType}
          </h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <fieldset className='flex flex-col gap-2'>
            <legend className='mb-1 text-sm font-medium'>What is the problem?</legend>
            {REPORT_REASONS.map((option) => (
              <label key={option.value} className='flex cursor-pointer items-center gap-2 text-sm'>
                <input
                  type='radio'
                  name='reason'
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor='report-details' className='mb-1 block text-sm font-medium'>
              Details (optional)
            </label>
            <textarea
              id='report-details'
              rows={3}
              maxLength={2000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className='w-full resize-none rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700'
            />
          </div>

          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900'
            >
              {isSubmitting ? 'Sending...' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
