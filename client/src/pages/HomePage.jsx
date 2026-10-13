import { useEffect, useState } from 'react';
import { listVideos } from '../api/video.api';
import VideoGrid from '../components/video/VideoGrid';

const CATEGORIES = [
  'All',
  'music',
  'gaming',
  'news',
  'sports',
  'education',
  'entertainment',
  'technology',
  'travel',
  'comedy',
  'howto',
];

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const params = { sortBy: 'newest', limit: 24 };
    if (activeCategory !== 'All') params.category = activeCategory;

    listVideos(params)
      .then((data) => isMounted && setVideos(data.results))
      .finally(() => isMounted && setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              activeCategory === category
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <VideoGrid videos={videos} isLoading={isLoading} emptyMessage="No videos yet. Be the first to upload!" />
    </div>
  );
}