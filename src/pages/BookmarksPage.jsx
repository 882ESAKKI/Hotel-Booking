import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHotels } from '../redux/slices/hotelSlice';
import { HotelCard } from '../components/hotels/HotelCard';
import { SubHeader } from '../components/common/SubHeader';
import { SEO } from '../components/common/SEO';
import { Bookmark, Loader2, ArrowLeft } from 'lucide-react';

export const BookmarksPage = () => {
  const dispatch = useDispatch();
  const { items: hotels, status } = useSelector((state) => state.hotels);
  const bookmarkIds = useSelector((state) => state.bookmarks.ids);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchHotels());
  }, [dispatch, status]);

  const bookmarked = hotels.filter((h) => bookmarkIds.includes(String(h.id)));
  const loading = status === 'idle' || status === 'loading';

  return (
    <>
      <SEO
        title="My Bookmarked Hotels | HotelHub"
        description="Your saved hotels in Coimbatore, all in one place."
      />

      <SubHeader
        title="My Bookmarks"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Hotels', path: '/' },
          { label: 'Bookmarks' },
        ]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center text-slate-500">
            <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold">Loading your bookmarks...</p>
          </div>
        ) : bookmarked.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No bookmarks yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Tap the bookmark icon on any hotel to save it here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <ArrowLeft size={16} /> Browse Hotels
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">
              <span className="font-bold text-slate-900">{bookmarked.length}</span>{' '}
              {bookmarked.length === 1 ? 'hotel' : 'hotels'} bookmarked
            </p>
            <div className="space-y-4">
              {bookmarked.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
};
