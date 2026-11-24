// Real API service (replaces the old localStorage dummy API).
// Same exported methods, so the Redux slice and all components work unchanged.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const PAGE_SIZE = 100; // backend max page size

// Turns server error responses into a readable Error message
const request = async (path, options = {}) => {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch (e) {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    /* non-JSON response */
  }

  if (!res.ok) {
    const fieldErrors = body?.errors ? Object.values(body.errors).join(' ') : '';
    throw new Error(fieldErrors || body?.message || `Request failed (${res.status})`);
  }
  return body;
};

// Uploaded file (base64 data URL from FileReader) -> real File for multipart upload
const dataUrlToFile = async (dataUrl) => {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  return new File([blob], `hotel.${ext}`, { type: blob.type });
};

// Builds multipart/form-data: file upload for local images, plain text for image URLs
const buildFormData = async (hotel) => {
  const fd = new FormData();
  ['title', 'description', 'price', 'latitude', 'longitude', 'locationName'].forEach((key) => {
    if (hotel[key] !== undefined && hotel[key] !== null) fd.append(key, hotel[key]);
  });
  if (hotel.rating !== undefined) fd.append('rating', hotel.rating);
  if (hotel.reviewsCount !== undefined) fd.append('reviewsCount', hotel.reviewsCount);
  if (hotel.amenities?.length) fd.append('amenities', JSON.stringify(hotel.amenities));
  if (hotel.tags?.length) fd.append('tags', JSON.stringify(hotel.tags));

  if (hotel.image) {
    if (hotel.image.startsWith('data:image/')) {
      fd.append('image', await dataUrlToFile(hotel.image));
    } else {
      fd.append('image', hotel.image); // existing / external URL
    }
  }
  return fd;
};

export const hotelApi = {
  // GET /api/hotels (fetches every page so the existing client-side filters/pagination keep working)
  async getHotels() {
    const all = [];
    let offset = 0;
    let total = 0;
    do {
      const body = await request(`/hotels?limit=${PAGE_SIZE}&offset=${offset}&sortBy=newest`);
      all.push(...body.data);
      total = body.total;
      offset += PAGE_SIZE;
    } while (all.length < total);
    return all;
  },

  // GET /api/hotels/:id
  async getHotelById(id) {
    const body = await request(`/hotels/${id}`);
    return body.data;
  },

  // POST /api/hotels
  async createHotel(newHotelData) {
    const body = await request('/hotels', { method: 'POST', body: await buildFormData(newHotelData) });
    return body.data;
  },

  // PUT /api/hotels/:id
  async updateHotel(id, updatedData) {
    const body = await request(`/hotels/${id}`, { method: 'PUT', body: await buildFormData(updatedData) });
    return body.data;
  },

  // DELETE /api/hotels/:id  (server also removes the stored image file)
  async deleteHotel(id) {
    const body = await request(`/hotels/${id}`, { method: 'DELETE' });
    return body.data; // { id, title }
  },

  // POST /api/hotels/reset-defaults
  async resetDefaults() {
    const body = await request('/hotels/reset-defaults', { method: 'POST' });
    return body.data;
  },
};
