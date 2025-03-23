# Property Rental API

A GraphQL API for property rentals built with NestJS, TypeORM, and PostgreSQL.

## Features

- 🏠 Property listings with detailed information
- 📍 Location tracking with nearby places
- 🏷️ Dynamic pricing and availability
- ⭐ Review system with ratings
- 🔄 Cursor-based pagination
- 📸 Property images management
- 🏃‍♂️ Performance optimized with DataLoader pattern & caching
- 🔔 Notifications
- 📫 Transactional emails

## Tech Stack

- **Language**: NodeJS, TypeScript
- **Framework**: NestJS
- **API**: GraphQL
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Cache**: Redis
- **Message Dispatcher**: Kafka
- **Testing**: Jest
- **Containerization**: Docker

## Prerequisites

- Node.js (v20+)
- Docker
- PostgreSQL (16+)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/Caoimhin89/property-rental-api.git
cd property-rental-api
```

2. Install dependencies:

```bash
npm install
```

3. Environment setup:

```bash
cp .env.example .env
```

4. Start the database:

```bash
docker-compose up -d
```

5. Run the application:

```bash
npm run start:dev
```

The GraphQL playground will be available at `http://localhost:3000/graphql`

## Database Schema

The application uses a comprehensive database schema including:
- Users
- Properties
- Locations
- Reviews
- Amenities
- Images
- Bookings
- Organizations
- Availability
- Maintenance Requests
- Maintenance Images
- Maintenance Comments
- Notifications

See `schema.sql` for complete database structure.

## Development
docker compose up -d
npm run start:dev

### Testing

# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov

### Database Seeding

Development environment automatically includes test data. To manually seed:
```bash
psql -U <username> -d <database> -f seed.sql
```

## Docker

Build and run the application using Docker:
```bash
# Build the image
docker build -t property-rental-api .

# Run the container
docker run -p 3000:3000 property-rental-api
```

## API Documentation

The API uses GraphQL and includes the following main types:
- Property
- Amenity
- User
- Review
- Booking
- Image
- Organization
- NearbyPlace
- MaintenanceRequest
- MaintenanceImage
- MaintenanceComment
- Notification

For detailed schema information, visit the GraphQL playground's documentation.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[MIT License](LICENSE)

