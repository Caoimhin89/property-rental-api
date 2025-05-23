-- Seed Data

-- Users
INSERT INTO users (id, name, email, password, avatar, created_at, updated_at) VALUES
('dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'John Doe', 'john@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'Jane Smith', 'jane@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 'Bob Wilson', 'bob@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('08e48e8d-4ec6-42fd-82da-4c10e317b300'::uuid, 'Charlie Brown', 'charlie@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Organizations
INSERT INTO organizations (id, name, organization_type, created_at, updated_at) VALUES
-- Sole proprietorships for individual owners
('e2f5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'John Doe Properties', 'SOLE_PROPRIETORSHIP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'Jane Smith Rentals', 'SOLE_PROPRIETORSHIP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- A company
('cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'Luxury Stays Inc.', 'COMPANY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Organization Members
INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES
-- John Doe is owner of his organization
('7dd8a50e-63a6-4865-9998-2636ba144d49'::uuid, 'e2f5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Jane Smith is owner of her organization
('0ee0c597-e73b-4b9f-9522-212dbc7282d1'::uuid, 'd6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Multiple members in the company
('f88d2356-e62e-4574-b1cf-91b27b9c106e'::uuid, 'cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dfb66ad7-24d6-4603-9597-af4059135296'::uuid, 'cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '08e48e8d-4ec6-42fd-82da-4c10e317b300'::uuid, 'MEMBER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Properties
INSERT INTO properties (id, name, description, property_type, base_price, max_occupancy, organization_id, num_bedrooms, num_bathrooms, num_stories, garage_spaces, year_built, area_in_square_meters, lot_size_in_square_meters, created_at, updated_at) VALUES
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'Cozy Cottage', 'A beautiful cottage in the woods', 'HOUSE', 100.00, 4, 'e2f5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 2, 1, 1, 1, 2010, 100, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'Downtown Apartment', 'Modern apartment in city center', 'APARTMENT', 150.00, 2, 'd6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 1, 1, 1, 1, 2015, 80, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'Luxury Villa', 'Spectacular villa with ocean view', 'VILLA', 300.00, 6, 'cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 4, 3, 2, 2, 2018, 250, 1500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Beds
INSERT INTO beds (id, property_id, bed_type, bed_size, room, created_at, updated_at) VALUES
('f36da9af-4420-4671-8775-b9adf38cd51b'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'BED', 'SINGLE', 'Bedroom 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3f71085e-38a7-41dd-a18c-f4c1522f9752'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'BED', 'DOUBLE', 'Bedroom 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('103d2c62-06a5-4b9b-8c8a-2a81cc0826f4'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'BED', 'QUEEN', 'Bedroom 3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nearby Places
INSERT INTO nearby_places (id, name, type, distance, created_at, updated_at) VALUES
('811e76d5-2a9a-4671-8fd3-a0ad47a011ed'::uuid, 'Beach Club', 'ENTERTAINMENT', 0.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('92d1bdf8-9da5-4f4c-bee8-61fe3ff03657'::uuid, 'Central Park', 'PARK', 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('633884eb-3885-46c7-972b-30e4bd3c4a8f'::uuid, 'Forest Park', 'PARK', 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Locations
INSERT INTO locations (id, property_id, nearby_place_id, address, postal_code, postal_code_suffix, city, county, state, country, latitude, longitude, created_at, updated_at) VALUES
('f49c2006-2bd2-42c3-922b-5d845c91e0a2'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, NULL, '123 Beach Road', '33131', NULL, 'Miami', 'Miami-Dade', 'Florida', 'USA', 25.7617, -80.1918, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d8bf813e-bcea-4755-8eed-c71f9195f446'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, NULL, '456 Main Street', '10001', NULL, 'New York', 'Manhattan', 'New York', 'USA', 40.7128, -74.0060, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('14eb162f-4e86-43c3-a8b6-577f9669bed3'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, NULL, '789 Forest Lane', '97205', NULL, 'Portland', 'Multnomah', 'Oregon', 'USA', 45.5155, -122.6789, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('0faabf5c-26b7-49b8-980a-9ede5996d007'::uuid, NULL, '811e76d5-2a9a-4671-8fd3-a0ad47a011ed'::uuid, '1234 Pike Place', '98101', NULL, 'Seattle', 'King', 'Washington', 'USA', 47.6062, -122.3321, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('5ae2afb3-ad15-47e8-9795-a45a04107764'::uuid, NULL, '92d1bdf8-9da5-4f4c-bee8-61fe3ff03657'::uuid, '555 Lombard Street', '94133', NULL, 'San Francisco', 'San Francisco', 'California', 'USA', 37.7749, -122.4194, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2d574321-e10c-4919-9e22-cb6a79b360a5'::uuid, NULL, '633884eb-3885-46c7-972b-30e4bd3c4a8f'::uuid, '789 Granville Street', 'V6Z 1K3', NULL, 'Vancouver', 'Greater Vancouver', 'British Columbia', 'Canada', 49.2827, -123.1207, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Blocked Dates
INSERT INTO blocked_dates (id, property_id, start_date, end_date, reason, created_at, updated_at) VALUES
('811e76d5-2a9a-4671-8fd3-a0ad47a011ed'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, CURRENT_DATE + 30, CURRENT_DATE + 32, 'Maintenance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('92d1bdf8-9da5-4f4c-bee8-61fe3ff03657'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, CURRENT_DATE + 45, CURRENT_DATE + 46, 'Deep Cleaning', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('633884eb-3885-46c7-972b-30e4bd3c4a8f'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, CURRENT_DATE + 60, CURRENT_DATE + 62, 'Renovation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Price Rules
INSERT INTO price_rules (id, property_id, start_date, end_date, price, description, created_at, updated_at) VALUES
-- Holiday pricing
('0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '2024-12-20', '2024-12-31', 499.99, 'Holiday Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2f7cbb7e-e161-4a7b-8245-edc369581831'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '2024-12-20', '2024-12-31', 299.99, 'Holiday Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('69e18167-71ec-41f9-876a-a74d698ec7d5'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '2024-12-20', '2024-12-31', 349.99, 'Holiday Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Summer pricing
('06fc7819-f72d-4a46-972d-b5630e6613dc'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '2024-06-01', '2024-08-31', 399.99, 'Summer Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('40336b69-3864-46df-aef4-dbe147ae37b0'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '2024-06-01', '2024-08-31', 199.99, 'Summer Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f3b80d2f-2f96-4032-a793-e36b95b0a50e'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '2024-06-01', '2024-08-31', 249.99, 'Summer Season', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Amenities
INSERT INTO amenities (id, name, category, icon, icon_url, created_at, updated_at) VALUES
('0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, 'Private Pool', 'OUTDOOR', '🏊', 'https://example.com/images/pool.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2f7cbb7e-e161-4a7b-8245-edc369581831'::uuid, 'Gym', 'FITNESS', '💪', 'https://example.com/images/gym.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('69e18167-71ec-41f9-876a-a74d698ec7d5'::uuid, 'Fireplace', 'INDOOR', '🔥', 'https://example.com/images/fireplace.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, 'WiFi', 'TECHNOLOGY', '📶', 'https://example.com/images/wifi.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('91c8e9b5-4d6f-4d4b-8b5f-1924d1f8a7d9'::uuid, 'Air Conditioning', 'COMFORT', '❄️', 'https://example.com/images/air-conditioning.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b2c9e8d7-6f5e-4c3b-9a4b-8d7e6f5c4b3a'::uuid, 'Kitchen', 'INDOOR', '🍳', 'https://example.com/images/kitchen.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Images
INSERT INTO images (id, property_id, url, caption, created_at, updated_at) VALUES
('06fc7819-f72d-4a46-972d-b5630e6613dc'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'https://example.com/images/cottage1.jpg', 'Cottage exterior', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('40336b69-3864-46df-aef4-dbe147ae37b0'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'https://example.com/images/apartment1.jpg', 'Living room', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f3b80d2f-2f96-4032-a793-e36b95b0a50e'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'https://example.com/images/villa1.jpg', 'Villa view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Reviews
INSERT INTO reviews (id, property_id, user_id, rating, text, created_at, updated_at) VALUES
('86d5f6fe-09ce-4951-8e15-487af200e4e7'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 5.0, 'Amazing stay!', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('eb0af557-e7fc-4c56-a51e-d191e969b31f'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 4.5, 'Great location', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('9a226f3e-b2fa-4b62-938b-46c31e01a26d'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 4.0, 'Peaceful retreat', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Bookings
INSERT INTO bookings (id, confirmation_code, property_id, user_id, start_date, end_date, number_of_guests, status, total_price, created_at, updated_at) VALUES
('e7fcc1cb-e845-47db-86c0-5bc26eac8eb2'::uuid, '1234567890', 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, CURRENT_DATE + 7, CURRENT_DATE + 14, 4, 'CONFIRMED', 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('90171f6f-f8c7-4ec4-92fd-456332db28bb'::uuid, '1234567890', 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, CURRENT_DATE + 14, CURRENT_DATE + 21, 2, 'PENDING', 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('eb0ed2e5-cefb-49b1-b8e3-cc80fe9cccf2'::uuid, '1234567890', 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, CURRENT_DATE + 21, CURRENT_DATE + 28, 3, 'CANCELLED', 1500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Property Amenities
INSERT INTO property_amenities (property_id, amenity_id, created_at) VALUES
-- Cozy Cottage amenities
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, CURRENT_TIMESTAMP), -- Private Pool
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, CURRENT_TIMESTAMP), -- WiFi
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'b2c9e8d7-6f5e-4c3b-9a4b-8d7e6f5c4b3a'::uuid, CURRENT_TIMESTAMP), -- Kitchen

-- Downtown Apartment amenities
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '2f7cbb7e-e161-4a7b-8245-edc369581831'::uuid, CURRENT_TIMESTAMP), -- Gym
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, CURRENT_TIMESTAMP), -- WiFi
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '91c8e9b5-4d6f-4d4b-8b5f-1924d1f8a7d9'::uuid, CURRENT_TIMESTAMP), -- Air Conditioning

-- Luxury Villa amenities
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '69e18167-71ec-41f9-876a-a74d698ec7d5'::uuid, CURRENT_TIMESTAMP), -- Fireplace
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, CURRENT_TIMESTAMP), -- Private Pool
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '91c8e9b5-4d6f-4d4b-8b5f-1924d1f8a7d9'::uuid, CURRENT_TIMESTAMP), -- Air Conditioning
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, CURRENT_TIMESTAMP); -- WiFi 

-- Maintenance Requests
INSERT INTO maintenance_requests (id, property_id, user_id, urgency, description, status, created_at, updated_at) VALUES
-- Urgent AC repair for Downtown Apartment
('c7d8e9f0-1234-5678-90ab-cdef01234567'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'HIGH', 'AC not working, temperature is 85F inside', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),

-- Medium priority pool maintenance for Cozy Cottage
('d8e9f0a1-2345-6789-01bc-def012345678'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'MEDIUM', 'Pool needs cleaning and chemical balance check', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),

-- Low priority paint touch-up for Luxury Villa
('e9f0a1b2-3456-7890-12cd-ef0123456789'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 'LOW', 'Living room wall needs paint touch-up', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP);

-- Maintenance Request Comments
INSERT INTO maintenance_request_comments (id, maintenance_request_id, user_id, comment, created_at, updated_at) VALUES
-- Comments for AC repair
('f0a1b2c3-4567-8901-23de-f01234567890'::uuid, 'c7d8e9f0-1234-5678-90ab-cdef01234567'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'Technician scheduled for tomorrow morning', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),
('a1b2c3d4-5678-9012-34ef-012345678901'::uuid, 'c7d8e9f0-1234-5678-90ab-cdef01234567'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'Parts ordered, will be here in 2 days', CURRENT_TIMESTAMP - INTERVAL '12 hours', CURRENT_TIMESTAMP),

-- Comments for pool maintenance
('b2c3d4e5-6789-0123-45f0-123456789012'::uuid, 'd8e9f0a1-2345-6789-01bc-def012345678'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'Pool service company contacted', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP),
('c3d4e5f6-7890-1234-56a1-234567890123'::uuid, 'd8e9f0a1-2345-6789-01bc-def012345678'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'Service scheduled for next week', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP),

-- Comments for paint touch-up
('d4e5f6a7-8901-2345-67b2-345678901234'::uuid, 'e9f0a1b2-3456-7890-12cd-ef0123456789'::uuid, 'fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 'Paint color matched and purchased', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP),
('e5f6a7b8-9012-3456-78c3-456789012345'::uuid, 'e9f0a1b2-3456-7890-12cd-ef0123456789'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'Work completed, looks great', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP);

-- Maintenance Images
INSERT INTO maintenance_images (id, maintenance_request_id, url, created_at, updated_at) VALUES
-- Images for AC repair
('f6a7b8c9-0123-4567-89d4-567890123456'::uuid, 'c7d8e9f0-1234-5678-90ab-cdef01234567'::uuid, 'https://example.com/maintenance/ac-thermostat.jpg', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),
('a7b8c9d0-1234-5678-90e5-678901234567'::uuid, 'c7d8e9f0-1234-5678-90ab-cdef01234567'::uuid, 'https://example.com/maintenance/ac-unit.jpg', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),

-- Images for pool maintenance
('b8c9d0e1-2345-6789-01f6-789012345678'::uuid, 'd8e9f0a1-2345-6789-01bc-def012345678'::uuid, 'https://example.com/maintenance/pool-before.jpg', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
('c9d0e1f2-3456-7890-12a7-890123456789'::uuid, 'd8e9f0a1-2345-6789-01bc-def012345678'::uuid, 'https://example.com/maintenance/pool-chemicals.jpg', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP),

-- Images for paint touch-up
('d0e1f2a3-4567-8901-23b8-901234567890'::uuid, 'e9f0a1b2-3456-7890-12cd-ef0123456789'::uuid, 'https://example.com/maintenance/wall-before.jpg', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
('e1f2a3b4-5678-9012-34c9-012345678901'::uuid, 'e9f0a1b2-3456-7890-12cd-ef0123456789'::uuid, 'https://example.com/maintenance/wall-after.jpg', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP); 

-- Notifications
INSERT INTO notifications (id, user_id, title, description, type, link, link_text, is_read, created_at, updated_at) VALUES
('26bf8b80-26d5-466c-ab5c-7e23a9cffeea'::uuid, '04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'Pool Maintenance Reminder', 'Air conditioner is not working!', 'MAINTENANCE_REQUEST_CREATED', 'https://example.com/maintenance/ac', 'View Maintenance Request', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('4d308044-5d47-476a-ab91-cba5f4060eff'::uuid, 'dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'AC Repair Completed', 'Your AC repair is complete. Enjoy your cool home!', 'MAINTENANCE_REQUEST_COMPLETED', 'https://example.com/maintenance/ac', 'View Maintenance Request', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);