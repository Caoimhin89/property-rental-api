-- Seed Data

-- Users
INSERT INTO users (id, name, email, password, avatar, verification_token, verification_token_expires_at, created_at, updated_at) VALUES
('dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'John Doe', 'john@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'Jane Smith', 'jane@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('fe31a737-e863-47a8-a76c-4d4fa01bff40'::uuid, 'Bob Wilson', 'bob@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('08e48e8d-4ec6-42fd-82da-4c10e317b300'::uuid, 'Charlie Brown', 'charlie@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'Modern Downtown Apartment', 'Luxurious apartment with stunning city views in the heart of downtown. This modern property features high-end finishes, state-of-the-art appliances, and expansive windows that showcase panoramic views of the city skyline. Enjoy the convenience of living within walking distance to restaurants, shopping, and entertainment.', 'APARTMENT', 2500.00, 4, 'e2f5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 2, 2, 1, 1, 2018, 110, 110, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'Beachfront Villa with Pool', 'Elegant beachfront villa with private pool and direct beach access. This stunning property offers the perfect blend of luxury and tranquility, with spacious living areas that open directly to your private terrace and pool area. Wake up to breathtaking ocean views and fall asleep to the gentle sounds of waves.', 'VILLA', 5500.00, 8, 'd6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 4, 4.5, 2, 2, 2015, 350, 1200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'Rustic Mountain Cabin', 'Cozy cabin nestled in the mountains with stunning panoramic views. This authentic log cabin offers a perfect retreat from city life, combining rustic charm with modern comforts. Enjoy the peaceful surroundings, wildlife sightings, and access to hiking trails right from your doorstep.', 'HOUSE', 1800.00, 6, 'cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 3, 2, 2, 1, 1998, 180, 5000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'Contemporary Urban Loft', 'Stylish urban loft in a converted industrial building with high ceilings and exposed brick. This unique property perfectly balances historic architectural details with contemporary design, creating a truly one-of-a-kind living space in the heart of the arts district.', 'CONDO', 2200.00, 3, 'e2f5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 1, 1.5, 1, 1, 1930, 115, 115, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'Suburban Family Home', 'Spacious family home in a quiet suburban neighborhood with large backyard. This welcoming property offers plenty of space for the whole family, with a thoughtfully designed layout that balances privacy and togetherness. The large backyard is perfect for entertaining, gardening, or just enjoying the outdoors.', 'HOUSE', 3200.00, 8, 'd6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 4, 3.5, 2, 2, 2005, 280, 800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'Luxury Penthouse with City Views', 'Spectacular penthouse apartment with panoramic city views and private terrace. This premium residence sits at the pinnacle of luxury living, offering unparalleled views, high-end finishes, and exclusive amenities. The open floor plan seamlessly connects indoor and outdoor living spaces, perfect for both relaxation and entertaining.', 'APARTMENT', 8500.00, 4, 'cdd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 2, 3, 1, 2, 2020, 230, 230, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Beds
INSERT INTO beds (id, property_id, bed_type, bed_size, room, created_at, updated_at) VALUES
('f36da9af-4420-4671-8775-b9adf38cd51b'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'BED', 'KING', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3f71085e-38a7-41dd-a18c-f4c1522f9752'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'BED', 'QUEEN', 'Guest Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('103d2c62-06a5-4b9b-8c8a-2a81cc0826f4'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'BED', 'KING', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d2bfa47a-c68f-4696-900d-93633283ecf3'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'BED', 'QUEEN', 'Guest Bedroom 1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2974fbd9-8fd3-4885-a092-e5146c55d81b'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'BED', 'QUEEN', 'Guest Bedroom 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('68e54161-0ff2-4577-99f3-a042795f1150'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'BED', 'DOUBLE', 'Guest Bedroom 3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('46d402f1-4d6d-49d3-8fa8-c93fd7ebaf01'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'BED', 'QUEEN', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e7bc64df-a029-4c2d-8059-41a88e06e413'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'BED', 'DOUBLE', 'Bedroom 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('9de29c03-b1b7-4009-9d1a-ea1e1e008596'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'SOFA_BED', 'DOUBLE', 'Living Room', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d7158121-41d3-4082-b612-adbd33486869'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'BED', 'QUEEN', 'Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bd2b3fc2-a530-4602-889f-3ba98ecdcde5'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'SOFA_BED', 'SINGLE', 'Living Area', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('202c7bd0-7dae-46e1-b59f-8d2742985166'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'BED', 'KING', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('97f8e2a6-3e4b-4b93-888f-178ae29cc83d'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'BED', 'QUEEN', 'Bedroom 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('0a89d66a-3b5b-48b0-8d0f-8025ce6a7265'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'BED', 'DOUBLE', 'Bedroom 3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('5bcf21b4-a661-471a-8cae-80d9bf9e2cc1'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'BED', 'DOUBLE', 'Bedroom 4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('46cba2aa-25ca-46c7-ad49-3f49cd0e3cef'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'BED', 'KING', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d2ad10de-4ecd-48c8-8072-77509de3734d'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'BED', 'QUEEN', 'Guest Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nearby Places
INSERT INTO nearby_places (id, name, type, distance, created_at, updated_at) VALUES
('811e76d5-2a9a-4671-8fd3-a0ad47a011ed'::uuid, 'Beach Club', 'ENTERTAINMENT', 0.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('92d1bdf8-9da5-4f4c-bee8-61fe3ff03657'::uuid, 'Central Park', 'PARK', 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('633884eb-3885-46c7-972b-30e4bd3c4a8f'::uuid, 'Forest Park', 'PARK', 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d4a49b85-8d42-42dd-8f69-051c3a47b0f5'::uuid, 'Oregon Rail Heritage Center', 'Cultural', 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Favorite Properties
INSERT INTO favorite_properties (user_id, property_id, created_at, updated_at) VALUES
('dce2e155-6e65-4dd1-b3ec-1496021e31fa'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('04ef4013-4da7-4a73-b024-0548fb5f9511'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Locations
INSERT INTO locations (id, property_id, nearby_place_id, address, postal_code, postal_code_suffix, city, county, state, country, latitude, longitude, created_at, updated_at) VALUES
('f49c2006-2bd2-42c3-922b-5d845c91e0a2'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, NULL, '123 Beach Road', '33131', NULL, 'Miami', 'Miami-Dade', 'Florida', 'USA', 25.7617, -80.1918, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d8bf813e-bcea-4755-8eed-c71f9195f446'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, NULL, '456 Main Street', '10001', NULL, 'New York', 'Manhattan', 'New York', 'USA', 40.7128, -74.0060, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('14eb162f-4e86-43c3-a8b6-577f9669bed3'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, NULL, '789 Forest Lane', '97205', NULL, 'Portland', 'Multnomah', 'Oregon', 'USA', 45.5155, -122.6789, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('0faabf5c-26b7-49b8-980a-9ede5996d007'::uuid, NULL, '811e76d5-2a9a-4671-8fd3-a0ad47a011ed'::uuid, '1234 Pike Place', '98101', NULL, 'Seattle', 'King', 'Washington', 'USA', 47.6062, -122.3321, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('5ae2afb3-ad15-47e8-9795-a45a04107764'::uuid, NULL, '92d1bdf8-9da5-4f4c-bee8-61fe3ff03657'::uuid, '555 Lombard Street', '94133', NULL, 'San Francisco', 'San Francisco', 'California', 'USA', 37.7749, -122.4194, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2d574321-e10c-4919-9e22-cb6a79b360a5'::uuid, NULL, '633884eb-3885-46c7-972b-30e4bd3c4a8f'::uuid, '789 Granville Street', 'V6Z 1K3', NULL, 'Vancouver', 'Greater Vancouver', 'British Columbia', 'Canada', 49.2827, -123.1207, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('7f9c32f0-45e4-4b4a-8f1e-9c8d321b5678'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, NULL, '1000 5th Avenue', '10028', NULL, 'New York', 'Manhattan', 'New York', 'USA', 40.7831, -73.9712, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('9e3e67c1-1f47-4b75-9f41-7b5a12c7b7e9'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, NULL, '120 Arts District Blvd', '90013', NULL, 'Los Angeles', 'Los Angeles', 'California', 'USA', 34.0403, -118.2352, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b7d9e123-4567-89ab-cdef-123456789abc'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, NULL, '456 Maple Drive', '60062', NULL, 'Northbrook', 'Cook', 'Illinois', 'USA', 42.1275, -87.8290, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b8f2d6a1-4c37-4e1c-a9c5-89d2f1d6b7e3'::uuid, NULL, 'd4a49b85-8d42-42dd-8f69-051c3a47b0f5'::uuid, '2250 SE Water Ave', '97214', NULL, 'Portland', 'Multnomah County', 'Oregon', 'USA', 45.507306, -122.661722, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
('0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, 'Air Conditioning', 'Climate Control', 'snowflake', 'https://example.com/images/air-conditioning.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2f7cbb7e-e161-4a7b-8245-edc369581831'::uuid, 'High-Speed WiFi', 'Connectivity', 'wifi', 'https://example.com/images/wifi.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('69e18167-71ec-41f9-876a-a74d698ec7d5'::uuid, 'In-unit Laundry', 'Conveniences', 'washer', 'https://example.com/images/laundry.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, 'Gym Access', 'Building Amenities', 'dumbbell', 'https://example.com/images/gym.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('91c8e9b5-4d6f-4d4b-8b5f-1924d1f8a7d9'::uuid, 'Private Pool', 'Outdoor', 'swimming-pool', 'https://example.com/images/pool.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('b2c9e8d7-6f5e-4c3b-9a4b-8d7e6f5c4b3a'::uuid, 'Beach Access', 'Outdoor', 'beach', 'https://example.com/images/beach.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ce4aff82-f987-4fab-8374-323c15d32cd8'::uuid, 'Outdoor BBQ', 'Outdoor', 'bbq', 'https://example.com/images/bbq.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2545d9f1-47bb-4a2f-aef1-26e32d75012d'::uuid, 'Smart Home System', 'Technology', 'smartphone', 'https://example.com/images/smart-home.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('d405182b-3359-41f5-992f-0cd2534fdd8a'::uuid, 'Fireplace', 'Indoor', 'flame', 'https://example.com/images/fireplace.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('8d837974-4253-4639-a1ad-e0e7a2497d43'::uuid, 'Hot Tub', 'Outdoor', 'hot-tub', 'https://example.com/images/hot-tub.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('79b9de6e-4bc1-4385-a1a3-edbbaaa93900'::uuid, 'Hiking Access', 'Activities', 'mountain', 'https://example.com/images/hiking.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('af079b86-9fab-46d6-bf00-e10d8aa0297c'::uuid, 'High Ceilings', 'Interior Features', 'arrow-up', 'https://example.com/images/ceiling.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('27f2865f-6255-43b5-94e6-2d02f509dc62'::uuid, 'Exposed Brick', 'Interior Features', 'square', 'https://example.com/images/brick.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('8a149571-36ce-4f08-8b72-985ce70d4c2d'::uuid, 'Rooftop Access', 'Building Amenities', 'cloud', 'https://example.com/images/rooftop.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a632d869-1383-40d5-883e-b37c9cab9df7'::uuid, 'Backyard', 'Outdoor', 'tree', 'https://example.com/images/backyard.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('85ef9fc0-7a65-4347-984a-f9cbb81fa2eb'::uuid, 'Patio', 'Outdoor', 'home', 'https://example.com/images/patio.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c1cbd6ed-e18b-47e7-a3fd-446631c9e4ce'::uuid, 'Finished Basement', 'Indoor', 'layers', 'https://example.com/images/basement.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('df4fbe4f-4a9b-40ad-902f-f4237031dfa0'::uuid, 'Home Theater', 'Entertainment', 'film', 'https://example.com/images/theater.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('1b793f28-7219-4c66-a68e-c389973f2047'::uuid, 'Private Terrace', 'Outdoor', 'sunset', 'https://example.com/images/terrace.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ac27aa48-dd38-4c91-af60-f3ada17db68b'::uuid, 'Concierge Service', 'Services', 'bell', 'https://example.com/images/concierge.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e1e191e0-5611-4a3a-9667-b66ad8ca1693'::uuid, 'Wine Cellar', 'Luxury', 'wine', 'https://example.com/images/wine.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('1903fb95-a535-4ffe-8d79-f1566dfaf186'::uuid, 'Floor-to-Ceiling Windows', 'Interior Features', 'maximize', 'https://example.com/images/windows.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Images
INSERT INTO images (id, property_id, url, caption, created_at, updated_at) VALUES
('06fc7819-f72d-4a46-972d-b5630e6613dc'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Living Room', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('40336b69-3864-46df-aef4-dbe147ae37b0'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f3b80d2f-2f96-4032-a793-e36b95b0a50e'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('fbeaa3c7-31eb-4b13-8436-2eee1fd08a7f'::uuid, 'b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Bathroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('222f02a3-e4d4-47d5-a33e-ab4a1abb611a'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Exterior View', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dd905fc4-8a69-4aba-89a8-903dc4d9f28c'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'https://images.unsplash.com/photo-1520250497591-17f0baa2a6c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Pool Area', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('63958451-559d-40fd-bff6-d42bd0879c15'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2339&q=80', 'Living Area', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3ad34631-ace4-4a33-8617-5fa70de73845'::uuid, 'a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('95bd900c-c3a6-4cbc-982f-ef598b63ed16'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Exterior', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('481a961b-3a20-4c8c-b862-e6208f5b1222'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'https://images.unsplash.com/photo-1529290130-4ca3753253ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2352&q=80', 'Living Room with Fireplace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('64211bf3-0012-4eb1-a30f-ea455ef23bc1'::uuid, 'bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'https://images.unsplash.com/photo-1551927336-09d50efd69cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2a275f05-c037-4e77-b600-9ea24c0cabda'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2352&q=80', 'Living Area', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('227f82d7-e5ab-458e-823b-2df43594c8f4'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('09d5fb54-e609-4252-9310-c82542eab8f5'::uuid, 'cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('f6d0fdb9-3da6-44c3-931f-ddaa95193c9f'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Exterior', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('627de2ae-0841-45e0-9eec-55ce71eb5999'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('fcb81fa0-17a3-44a2-bfad-59827e7d1921'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('e32cb047-2ce3-49cc-b37c-1d47ba268478'::uuid, '314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Backyard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('46792f8d-f144-468d-aca6-07c49c3f92cf'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'https://images.unsplash.com/photo-1594540637720-9b14737c3f64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Living Area with City View', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('8ff8c40d-bff5-4fda-bf07-e341188a4107'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Private Terrace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('c295ba10-d216-4545-93cc-c70bd6869817'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'https://images.unsplash.com/photo-1617298632801-81bdd916a1a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Gourmet Kitchen', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('6bce8ee9-9bd1-4174-b957-974222b3ece1'::uuid, '3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80', 'Master Bedroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
-- Modern Downtown Apartment amenities
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '0200f753-54a5-4db4-bc63-02ccc483a088'::uuid, CURRENT_TIMESTAMP), -- Air Conditioning
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '2f7cbb7e-e161-4a7b-8245-edc369581831'::uuid, CURRENT_TIMESTAMP), -- High-Speed WiFi
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '69e18167-71ec-41f9-876a-a74d698ec7d5'::uuid, CURRENT_TIMESTAMP), -- In-unit Laundry
('b5d5c35f-f54f-466f-9456-cb2193d32d23'::uuid, '7d37e0a7-2d5e-4c93-9428-12d4f9ab8b4c'::uuid, CURRENT_TIMESTAMP), -- Gym Access

-- Beachfront Villa with Pool amenities
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '91c8e9b5-4d6f-4d4b-8b5f-1924d1f8a7d9'::uuid, CURRENT_TIMESTAMP), -- Private Pool
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'b2c9e8d7-6f5e-4c3b-9a4b-8d7e6f5c4b3a'::uuid, CURRENT_TIMESTAMP), -- Beach Access
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, 'ce4aff82-f987-4fab-8374-323c15d32cd8'::uuid, CURRENT_TIMESTAMP), -- Outdoor BBQ
('a6d8d8fc-53a7-4ddc-9974-09359b20e187'::uuid, '2545d9f1-47bb-4a2f-aef1-26e32d75012d'::uuid, CURRENT_TIMESTAMP), -- Smart Home System

-- Rustic Mountain Cabin amenities
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, 'd405182b-3359-41f5-992f-0cd2534fdd8a'::uuid, CURRENT_TIMESTAMP), -- Fireplace
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '8d837974-4253-4639-a1ad-e0e7a2497d43'::uuid, CURRENT_TIMESTAMP), -- Hot Tub
('bcd32b09-b38b-4002-b77d-3726b6be4961'::uuid, '79b9de6e-4bc1-4385-a1a3-edbbaaa93900'::uuid, CURRENT_TIMESTAMP), -- Hiking Access

-- Contemporary Urban Loft amenities
('cf530619-6873-4dca-86f4-314d239595b1'::uuid, 'af079b86-9fab-46d6-bf00-e10d8aa0297c'::uuid, CURRENT_TIMESTAMP), -- High Ceilings
('cf530619-6873-4dca-86f4-314d239595b1'::uuid, '27f2865f-6255-43b5-94e6-2d02f509dc62'::uuid, CURRENT_TIMESTAMP), -- Exposed Brick
('cf530619-6873-4dca-86f4-314d239595b1'::uuid, '8a149571-36ce-4f08-8b72-985ce70d4c2d'::uuid, CURRENT_TIMESTAMP), -- Rooftop Access

-- Suburban Family Home amenities
('314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'a632d869-1383-40d5-883e-b37c9cab9df7'::uuid, CURRENT_TIMESTAMP), -- Backyard
('314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, '85ef9fc0-7a65-4347-984a-f9cbb81fa2eb'::uuid, CURRENT_TIMESTAMP), -- Patio
('314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'c1cbd6ed-e18b-47e7-a3fd-446631c9e4ce'::uuid, CURRENT_TIMESTAMP), -- Finished Basement
('314f7a83-48c7-412f-8f64-5f2f5c307f31'::uuid, 'df4fbe4f-4a9b-40ad-902f-f4237031dfa0'::uuid, CURRENT_TIMESTAMP), -- Home Theater

-- Luxury Penthouse with City Views amenities
('3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, '1b793f28-7219-4c66-a68e-c389973f2047'::uuid, CURRENT_TIMESTAMP), -- Private Terrace
('3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'ac27aa48-dd38-4c91-af60-f3ada17db68b'::uuid, CURRENT_TIMESTAMP), -- Concierge Service
('3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, 'e1e191e0-5611-4a3a-9667-b66ad8ca1693'::uuid, CURRENT_TIMESTAMP), -- Wine Cellar
('3036c96e-3ec0-4290-a457-8f8a6ee7d972'::uuid, '1903fb95-a535-4ffe-8d79-f1566dfaf186'::uuid, CURRENT_TIMESTAMP); -- Floor-to-Ceiling Windows

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