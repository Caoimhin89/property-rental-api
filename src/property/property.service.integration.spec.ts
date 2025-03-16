import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { Location } from '../location/entities/location.entity';
import { BlockedDate } from './entities/blocked-date.entity';
import { PriceRule } from './entities/price-rule.entity';
import { Booking } from '../booking/entities/booking.entity';
import { User } from '../user/entities/user.entity';
import { Review } from '../review/entities/review.entity';
import { Image } from '../image/entities/image.entity';
import { Amenity } from '../amenity/entities/amenity.entity';
import { NearbyPlace } from '../nearby-place/entities/nearby-place.entity';
import { LoggerService } from '../common/services/logger.service';
import { PropertyType } from '../graphql';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('PropertyService Integration Tests', () => {
  let service: PropertyService;
  let propertyRepository: Repository<Property>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: parseInt(configService.get('DB_PORT', '5432')),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_NAME', 'rental_db'),
            entities: [
              Property,
              Location,
              BlockedDate,
              PriceRule,
              Booking,
              User,
              Review,
              Image,
              Amenity,
              NearbyPlace
            ],
            synchronize: true,
            logging: false,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Property, Location, BlockedDate, PriceRule])
      ],
      providers: [PropertyService, LoggerService],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    propertyRepository = module.get<Repository<Property>>(getRepositoryToken(Property));
  });

  beforeEach(async () => {
    // Clear the database before each test
    await propertyRepository.clear();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('findAll with filters', () => {
    it('should filter properties by price range and type', async () => {
      // Create test properties
      await propertyRepository.save([
        {
          name: 'Cheap House',
          description: 'A cheap house',
          propertyType: PropertyType.HOUSE,
          basePrice: 50,
        },
        {
          name: 'Mid-range Apartment',
          description: 'A mid-range apartment',
          propertyType: PropertyType.APARTMENT,
          basePrice: 150,
        },
        {
          name: 'Expensive House',
          description: 'An expensive house',
          propertyType: PropertyType.HOUSE,
          basePrice: 250,
        },
      ]);

      const result = await service.findAll({
        first: 10,
        filter: {
          propertyType: PropertyType.HOUSE,
          minPrice: 100,
          maxPrice: 300,
        },
      });

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].node.name).toBe('Expensive House');
      expect(result.totalCount).toBe(1);
    });

    it('should return all properties when no filters are applied', async () => {
      // Create test properties
      await propertyRepository.save([
        {
          name: 'Property 1',
          description: 'Description 1',
          propertyType: PropertyType.HOUSE,
          basePrice: 100,
        },
        {
          name: 'Property 2',
          description: 'Description 2',
          propertyType: PropertyType.APARTMENT,
          basePrice: 200,
        },
      ]);

      const result = await service.findAll({
        first: 10,
        filter: {},
      });

      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });
  });
}); 