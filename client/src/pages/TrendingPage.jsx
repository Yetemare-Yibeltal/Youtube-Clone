import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getTrendingVideos } from '../api/search.api';
import VideoGrid from '../components/video/VideoGrid';

export default function TrendingPage () {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getTrendingVideos({ limit: 24, days: 14 })
      .then((data) => {
        if (isMounted) setVideos(data.results);
      })
      .catch(() => {
        if (isMounted) toast.error('Could not load trending videos');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className='mb-6 text-2xl font-semibold'>Trending</h1>
      <VideoGrid videos={videos} isLoading={isLoading} emptyMessage='Nothing is trending yet.' />
    </div>
  );
}
