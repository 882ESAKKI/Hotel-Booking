import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../../redux/slices/bookmarkSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { Bookmark } from 'lucide-react';

// variant="icon"  -> round overlay button (hotel card image)
// variant="full"  -> button with text (detail page)
export const BookmarkButton = ({ hotel, variant = 'icon' }) => {
  const dispatch = useDispatch();
  const isBookmarked = useSelector((state) => state.bookmarks.ids.includes(String(hotel.id)));

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleBookmark(hotel.id));
    dispatch(
      addToast({
        type: isBookmarked ? 'info' : 'success',
        message: isBookmarked
          ? `Removed "${hotel.title}" from bookmarks.`
          : `"${hotel.title}" saved to bookmarks!`,
      })
    );
  };

  const label = isBookmarked ? 'Remove bookmark' : 'Bookmark this hotel';

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isBookmarked}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition shadow-xs ${
          isBookmarked
            ? 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100'
            : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hover:text-blue-600'
        }`}
      >
        <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={isBookmarked}
      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
        isBookmarked ? 'bg-amber-400 text-white' : 'bg-white/90 text-slate-600 hover:text-amber-500'
      }`}
    >
      <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  );
};
