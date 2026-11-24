CREATE TABLE IF NOT EXISTS hotels (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(100)     NOT NULL,
  description   TEXT             NOT NULL,
  price         NUMERIC(10, 2)   NOT NULL CHECK (price > 0),
  latitude      DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude     DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  image         TEXT             NOT NULL,
  location_name VARCHAR(150)     NOT NULL DEFAULT 'Coimbatore, Tamil Nadu',
  rating        NUMERIC(2, 1)    NOT NULL DEFAULT 4.5,
  reviews_count INTEGER          NOT NULL DEFAULT 1,
  amenities     JSONB            NOT NULL DEFAULT '[]'::jsonb,
  tags          JSONB            NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_title_lower ON hotels (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels (price);
