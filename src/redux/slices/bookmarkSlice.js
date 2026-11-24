import { createSlice } from '@reduxjs/toolkit';
import { deleteHotel, resetHotelsToDefault } from './hotelSlice';

const STORAGE_KEY = 'hotelhub_bookmarks_v1';

const loadIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (e) {
    return [];
  }
};

const saveIds = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Could not save bookmarks:', e);
  }
};

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState: { ids: loadIds() },
  reducers: {
    toggleBookmark(state, action) {
      const id = String(action.payload);
      const index = state.ids.indexOf(id);
      if (index === -1) state.ids.push(id);
      else state.ids.splice(index, 1);
      saveIds(state.ids);
    },
    clearBookmarks(state) {
      state.ids = [];
      saveIds(state.ids);
    },
  },
  extraReducers: (builder) => {
    builder
      // a deleted hotel must not stay bookmarked
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.ids = state.ids.filter((id) => id !== String(action.payload.id));
        saveIds(state.ids);
      })
      // "Reset Demo" replaces every hotel, so old ids are meaningless
      .addCase(resetHotelsToDefault.fulfilled, (state) => {
        state.ids = [];
        saveIds(state.ids);
      });
  },
});

export const { toggleBookmark, clearBookmarks } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;
