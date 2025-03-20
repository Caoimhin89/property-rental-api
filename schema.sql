-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enum Types
CREATE TYPE property_type AS ENUM ('APARTMENT', 'HOUSE', 'CONDO', 'VILLA', 'OTHER');
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BOOKED', 'UNAVAILABLE');
CREATE TYPE organization_type AS ENUM ('COMPANY', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'OTHER');
CREATE TYPE maintenance_request_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE maintenance_request_urgency AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE organization_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organization_type organization_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    property_type property_type NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    max_occupancy INTEGER NOT NULL,
    num_bedrooms INTEGER NOT NULL,
    num_bathrooms FLOAT NOT NULL,
    num_stories INTEGER NOT NULL,
    garage_spaces INTEGER NOT NULL,
    year_built INTEGER NULL CHECK (year_built >= 1800 AND year_built <= 2100),
    area_in_square_meters FLOAT NOT NULL,
    lot_size_in_square_meters FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Search vector column to properties table
ALTER TABLE properties 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'B')
) STORED;
-- GIN index for full text search
CREATE INDEX idx_properties_search ON properties USING gin(search_vector);
-- trigram indexes for fuzzy matching
CREATE INDEX idx_properties_name_trgm ON properties USING gin (name gin_trgm_ops);
CREATE INDEX idx_properties_description_trgm ON properties USING gin (description gin_trgm_ops);

-- Nearby Places Table
CREATE TABLE nearby_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    distance DECIMAL(10,2) NOT NULL, -- in kilometers,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    nearby_place_id UUID REFERENCES nearby_places(id) ON DELETE CASCADE,
    address VARCHAR(255),
    postal_code VARCHAR(255),
    postal_code_suffix VARCHAR(255),
    city VARCHAR(255),
    county VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    coordinates geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exactly_one_parent CHECK (
        (property_id IS NOT NULL AND nearby_place_id IS NULL) OR
        (property_id IS NULL AND nearby_place_id IS NOT NULL)
    )
);
-- Add search vector column
ALTER TABLE locations 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(address,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(city,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(county,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(state,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(postal_code,'')), 'C')
) STORED;
-- Create indices
CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
CREATE INDEX idx_locations_search ON locations USING gin(search_vector);
CREATE INDEX idx_locations_address_trgm ON locations USING gin (address gin_trgm_ops);
CREATE INDEX idx_locations_city_trgm ON locations USING gin (city gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_locations(search_term text, limit_val int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  address text,
  city text,
  state text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.address,
    l.city,
    l.state,
    greatest(
      similarity(l.address, search_term),
      similarity(l.city, search_term),
      ts_rank(l.search_vector, websearch_to_tsquery('english', search_term))
    ) as similarity_score
  FROM locations l
  WHERE l.search_vector @@ websearch_to_tsquery('english', search_term)
     OR l.address % search_term
     OR l.city % search_term
  ORDER BY similarity_score DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE search_result AS (
  id uuid,
  name text,
  description text,
  address text,
  city text,
  state text,
  similarity float,
  result_type text
);

CREATE OR REPLACE FUNCTION search_properties(search_term text, limit_val int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  city text,
  state text,
  similarity float,
  result_type text
) AS $$
BEGIN
  RETURN QUERY
  WITH property_matches AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      l.address,
      l.city,
      l.state,
      greatest(
        similarity(p.name, search_term) * 2.0, -- Weight name matches higher
        similarity(p.description, search_term),
        ts_rank(p.search_vector, websearch_to_tsquery('english', search_term))
      ) as similarity_score,
      'property'::text as result_type
    FROM properties p
    LEFT JOIN locations l ON l.property_id = p.id
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_term)
       OR p.name % search_term
       OR p.description % search_term
  ),
  location_matches AS (
    SELECT 
      p.id,
      p.name,
      p.description,
      l.address,
      l.city,
      l.state,
      greatest(
        similarity(l.address, search_term),
        similarity(l.city, search_term),
        ts_rank(l.search_vector, websearch_to_tsquery('english', search_term))
      ) as similarity_score,
      'location'::text as result_type
    FROM locations l
    JOIN properties p ON p.id = l.property_id
    WHERE l.search_vector @@ websearch_to_tsquery('english', search_term)
       OR l.address % search_term
       OR l.city % search_term
  )
  SELECT *
  FROM (
    SELECT * FROM property_matches
    UNION ALL
    SELECT * FROM location_matches
  ) combined_results
  ORDER BY similarity_score DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- Amenities Table
CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(255),
    icon VARCHAR(255),  -- Optional: for UI display
    icon_url VARCHAR(255),  -- Optional: for UI display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Linking table for the many-to-many relationship
CREATE TABLE property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id, amenity_id)
);

-- Images Table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- For owner-controlled availability
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    CHECK (end_date > start_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- For dynamic pricing
CREATE TABLE price_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    CHECK (end_date > start_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_code VARCHAR(255) NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    number_of_guests INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CHECK (end_date > start_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization Members Table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    role organization_role NOT NULL,  -- OWNER, ADMIN, MEMBER, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);
CREATE UNIQUE INDEX idx_unique_organization_owner ON organization_members(organization_id, role) WHERE role = 'OWNER';

-- Maintenance Requests Table
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    urgency maintenance_request_urgency NOT NULL,
    description VARCHAR(255) NOT NULL,
    status maintenance_request_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Request Comments Table
CREATE TABLE maintenance_request_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Images Table
CREATE TABLE maintenance_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Indexes
CREATE INDEX idx_bookings_confirmation_code ON bookings(confirmation_code);
CREATE INDEX idx_maintenance_request_comments_maintenance_request ON maintenance_request_comments(maintenance_request_id);
CREATE INDEX idx_maintenance_request_comments_user ON maintenance_request_comments(user_id);
CREATE INDEX idx_maintenance_requests_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_requests_user ON maintenance_requests(user_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_images_maintenance_request ON maintenance_images(maintenance_request_id);
CREATE INDEX idx_property_amenities_property ON property_amenities(property_id);
CREATE INDEX idx_property_amenities_amenity ON property_amenities(amenity_id);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_base_price ON properties(base_price);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);