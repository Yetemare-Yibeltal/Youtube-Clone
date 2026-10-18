import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Flag } from 'lucide-react';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import ReportDialog from './ReportDialog';

const DEFAULT_CLASS =
  'flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700';

export default function ReportButton ({ targetType, targetId, label = 'Report', className = DEFAULT_CLASS }) {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isOpen, setIsOpen] = useState(false);

  function handleOpen () {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOpen(true);
  }

  return (
    <>
      <button type='button' onClick={handleOpen} className={className}>
        <Flag size={16} />
        {label}
      </button>
      <ReportDialog isOpen={isOpen} onClose={() => setIsOpen(false)} targetType={targetType} targetId={targetId} />
    </>
  );
}
