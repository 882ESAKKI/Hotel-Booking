import { configureStore } from '@reduxjs/toolkit';
import hotelReducer from './slices/hotelSlice';
import filterReducer from './slices/filterSlice';
import uiReducer from './slices/uiSlice';
import bookmarkReducer from './slices/bookmarkSlice';

export const store = configureStore({
  reducer: {
    hotels: hotelReducer,
    filters: filterReducer,
    ui: uiReducer,
    bookmarks: bookmarkReducer,
  },
});

