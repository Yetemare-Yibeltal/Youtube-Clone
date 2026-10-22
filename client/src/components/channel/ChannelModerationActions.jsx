import { useState } from 'react';
import { useSelector } from 'react-redux';
import { BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { setChannelVerification } from '../../api/admin.api';
import { selectCurrentUser } from '../../features/auth/authSlice';
import ReportButton from '../report/ReportButton';

export default function ChannelModerationActions ({ channel, isOwnProfile, onVerifiedChange }) {
  const currentUser = useSelector(selectCurrentUser);
  const [isUpdating, setIsUpdating] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

 

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {isAdmin && (
        <button
          type='button'
          onClick={handleToggleVerification}
          disabled={isUpdating}
          className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        >
          <BadgeCheck size={16} />
          {channel.isVerified ? 'Remove badge' : 'Verify channel'}
        </button>
      )}
      {!isOwnProfile && <ReportButton targetType='channel' targetId={channel._id} />}
    </div>
  );
}
