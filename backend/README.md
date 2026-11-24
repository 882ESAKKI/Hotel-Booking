# Hotel Management - Backend (Node.js + Express + PostgreSQL)

Native SQL (`pg`) only, no ORM. Images are stored on the Node server in `uploads/`, and the DB stores the path.

## Setup
1. Install PostgreSQL and keep it running.
2. `cd backend`
3. `npm install`
4. Edit `.env` (DB user/password/name).
5. `npm run db:seed`  (creates database + table + 12 sample hotels; use `npm run db:init` for an empty table)
6. `npm run dev`  -> http://localhost:5000

Frontend: run `npm run dev` in the project root (http://localhost:3000).

## API
| Method | Endpoint | Notes |
|---|---|---|
| GET | /api/hotels | `search` (title), `minPrice`, `maxPrice`, `offset`, `limit` (max 100), `sortBy` (newest, price-low, price-high, rating). Returns `{ total, offset, limit, data }` |
| GET | /api/hotels/:id | Single hotel |
| POST | /api/hotels | multipart/form-data: `title, description, price, latitude, longitude, image` (file or URL), optional `locationName` |
| PUT | /api/hotels/:id | Same fields; image optional (old image kept). Old file is deleted when replaced |
| DELETE | /api/hotels/:id | Deletes row + image file (`?deleteImage=false` keeps the file) |
| POST | /api/hotels/reset-defaults | Restores the 12 sample hotels (used by the app's Reset button) |

Validation errors return `400 { success:false, message, errors:{field:msg} }`.
