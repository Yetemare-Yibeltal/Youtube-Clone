import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import { icons } from '../assets';
import { getVideoById, recordVideoView, recordWatchProgress } from '../api/video.api';
import { getRelatedVideos } from '../api/search.api';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import SubscribeButton from '../components/channel/SubscribeButton';
import LikeDislikeButtons from '../components/video/LikeDislikeButtons';
import CommentSection from '../components/comment/CommentSection';
import SaveToPlaylistMenu from '../components/playlist/SaveToPlaylistMenu';
import VideoCard from '../components/video/VideoCard';
import { formatRelativeTime, formatSubscriberCount, formatViewCount } from '../utils/formatters';

const PROGRESS_SAVE_DELAY_MS = 5000;
const CAN_CAST = typeof HTMLMediaElement !== 'undefined' && 'remote' in HTMLMediaElement.prototype;

export default function WatchPage () {
  const { videoId } = useParams();
  const [data, setData] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const viewRecordedRef = useRef(false);
  const progressTimeoutRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setData(null);
    setIsDescriptionExpanded(false);
    viewRecordedRef.current = false;

    getVideoById(videoId)
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    getRelatedVideos(videoId, { limit: 12 })
      .then((result) => {
        if (isMounted) setRelatedVideos(result.results);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      clearTimeout(progressTimeoutRef.current);
    };
  }, [videoId]);

  function handlePlayStart () {
    if (viewRecordedRef.current) return;
    viewRecordedRef.current = true;
    recordVideoView(videoId).catch(() => {});
  }

  function handleProgress ({ playedSeconds }) {
    clearTimeout(progressTimeoutRef.current);
    progressTimeoutRef.current = setTimeout(() => {
      recordWatchProgress(videoId, Math.floor(playedSeconds)).catch(() => {});
    }, PROGRESS_SAVE_DELAY_MS);
  }

  async function handleShare () {
    const url = `${window.location.origin}/watch/${videoId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.video?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not share this video');
    }
  }

  function handleCast () {
    const element = playerRef.current?.getInternalPlayer();
    if (element?.remote?.prompt) {
      element.remote.prompt().catch(() => toast.error('No cast device available'));
    } else {
      toast.error('Casting is not supported in this browser');
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (!data) {
    return <p className='py-20 text-center text-neutral-500'>This video is unavailable.</p>;
  }

  const { video, isOwner, isSubscribed, viewerLikeStatus } = data;
  const channel = video.channel || {};

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='lg:col-span-2'>
        <div className='video-player-wrapper overflow-hidden rounded-xl bg-black'>
          <ReactPlayer
            ref={playerRef}
            url={video.videoFile?.url}
            controls
            width='100%'
            height='100%'
            onStart={handlePlayStart}
            onProgress={handleProgress}
            config={{ file: { attributes: { poster: video.thumbnail?.url } } }}
          />
        </div>

        <h1 className='mt-4 text-xl font-semibold'>{video.title}</h1>

        <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
          <Link to={`/channel/${channel.handle}`} className='flex items-center gap-3'>
            <Avatar src={channel.avatar?.url} name={channel.name} size={44} />
            <div>
              <p className='text-sm font-semibold'>{channel.name}</p>
              <p className='text-xs text-neutral-500'>{formatSubscriberCount(channel.subscribersCount)}</p>
            </div>
          </Link>

          <div className='flex flex-wrap items-center gap-3'>
            <SubscribeButton channelId={channel._id} isOwnChannel={isOwner} initialSubscribed={isSubscribed} />
            <LikeDislikeButtons
              videoId={video._id}
              initialStatus={viewerLikeStatus ?? null}
              initialLikes={video.likesCount}
              initialDislikes={video.dislikesCount}
            />
            <SaveToPlaylistMenu videoId={video._id} />
            <button
              type='button'
              onClick={handleShare}
              className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
            >
              <img src={icons.share} alt='' className='h-5 w-5 opacity-70' />
              Share
            </button>
            {CAN_CAST && (
              <button
                type='button'
                onClick={handleCast}
                className='flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
              >
                <img src={icons.cast} alt='' className='h-5 w-5 opacity-70' />
                Cast
              </button>
            )}
          </div>
        </div>

        <div
          className={`mt-4 rounded-xl bg-neutral-100 p-3 text-sm dark:bg-neutral-800 ${
            isDescriptionExpanded ? '' : 'line-clamp-3'
          }`}
        >
          <p className='mb-1 font-semibold text-neutral-700 dark:text-neutral-300'>
            {formatViewCount(video.views)} &middot; {formatRelativeTime(video.publishedAt)}
          </p>
          <p className='whitespace-pre-wrap'>{video.description || 'No description provided.'}</p>
        </div>
        <button
          type='button'
          onClick={() => setIsDescriptionExpanded((value) => !value)}
          className='mt-1 flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400'
        >
          <img
            src={icons.showMore}
            alt=''
            className={`h-4 w-4 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`}
          />
          {isDescriptionExpanded ? 'Show less' : 'Show more'}
        </button>

        <CommentSection videoId={video._id} commentsCount={video.commentsCount} />
      </div>

      <aside className='flex flex-col gap-4'>
        {relatedVideos.map((related) => (
          <VideoCard key={related._id} video={related} />
        ))}
      </aside>
    </div>
  );
}
