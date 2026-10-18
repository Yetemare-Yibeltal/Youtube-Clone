import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listReports, reviewReport } from '../../api/report.api';
import Spinner from '../common/Spinner';
import { formatRelativeTime } from '../../utils/formatters';
import { REPORT_REASON_LABELS } from '../../utils/reportReasons';

const PAGE_SIZE = 20;
const STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'];

const smallButtonClass =
  'rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-800 dark:hover:bg-neutral-700';

function TargetCell ({ report }) {
  switch (report.targetType) {
    case 'video':
      return report.video ? (
        <Link to={`/watch/${report.video._id}`} className='text-blue-600'>
          {report.video.title}
        </Link>
      ) : (
        <span className='text-neutral-500'>Deleted video</span>
      );
    case 'comment':
      return <span className='line-clamp-2'>{report.comment?.content || 'Deleted comment'}</span>;
    case 'channel':
      return report.channel ? (
        <Link to={`/channel/${report.channel.handle}`} className='text-blue-600'>
          {report.channel.name}
        </Link>
      ) : (
        <span className='text-neutral-500'>Deleted channel</span>
      );
    default:
      return report.reportedUser ? (
        <Link to={`/channel/${report.reportedUser.username}`} className='text-blue-600'>
          @{report.reportedUser.username}
        </Link>
      ) : (
        <span className='text-neutral-500'>Deleted user</span>
      );
  }
}

export default function ReportsTab () {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    listReports({ status, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!isMounted) return;
        setReports(data.results);
        setTotal(data.pagination?.total ?? data.results.length);
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load reports');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [status, page]);

  async function handleReview (report, nextStatus) {
    const note = window.prompt('Note for the audit log (optional):');
    if (note === null) return;

    setBusyId(report._id);
    try {
      await reviewReport(report._id, { status: nextStatus, reviewNote: note.trim() });
      setReports((previous) => previous.filter((item) => item._id !== report._id));
      setTotal((count) => Math.max(0, count - 1));
      toast.success(`Report marked ${nextStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the report');
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <select
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
        }}
        aria-label='Filter by status'
        className='mb-4 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm capitalize outline-none dark:border-neutral-700'
      >
        {STATUSES.map((option) => (
          <option key={option} value={option} className='dark:bg-neutral-900'>
            {option}
          </option>
        ))}
      </select>

      {isLoading ? (
        <div className='flex min-h-[30vh] items-center justify-center'>
          <Spinner size='lg' />
        </div>
      ) : reports.length === 0 ? (
        <p className='py-12 text-center text-neutral-500'>No {status} reports.</p>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800'>
          <table className='w-full min-w-[820px] text-left text-sm'>
            <thead className='border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800'>
              <tr>
                <th className='px-4 py-3 font-medium'>Target</th>
                <th className='px-4 py-3 font-medium'>Reason</th>
                <th className='px-4 py-3 font-medium'>Reported by</th>
                <th className='px-4 py-3 font-medium'>When</th>
                <th className='px-4 py-3 text-right font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report._id}
                  className='border-b border-neutral-100 align-top last:border-0 dark:border-neutral-800'
                >
                  <td className='px-4 py-3'>
                    <p className='mb-1 text-xs capitalize text-neutral-500'>{report.targetType}</p>
                    <TargetCell report={report} />
                  </td>
                  <td className='px-4 py-3'>
                    <p>{REPORT_REASON_LABELS[report.reason] || report.reason}</p>
                    {report.details && <p className='mt-1 text-xs text-neutral-500'>{report.details}</p>}
                  </td>
                  <td className='px-4 py-3'>@{report.reporter?.username || 'unknown'}</td>
                  <td className='px-4 py-3 text-xs text-neutral-500'>{formatRelativeTime(report.createdAt)}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap justify-end gap-2'>
                      {report.status === 'pending' && (
                        <button
                          type='button'
                          disabled={busyId === report._id}
                          onClick={() => handleReview(report, 'reviewing')}
                          className={smallButtonClass}
                        >
                          Review
                        </button>
                      )}
                      <button
                        type='button'
                        disabled={busyId === report._id}
                        onClick={() => handleReview(report, 'resolved')}
                        className={smallButtonClass}
                      >
                        Resolve
                      </button>
                      <button
                        type='button'
                        disabled={busyId === report._id}
                        onClick={() => handleReview(report, 'dismissed')}
                        className={smallButtonClass}
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='mt-4 flex items-center justify-between text-sm'>
        <span className='text-neutral-500'>
          Page {page} of {totalPages}
        </span>
        <div className='flex gap-2'>
          <button type='button' disabled={page <= 1} onClick={() => setPage(page - 1)} className={smallButtonClass}>
            Previous
          </button>
          <button
            type='button'
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className={smallButtonClass}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
