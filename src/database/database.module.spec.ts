import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Property } from '../property/entities/property.entity';
import { Location } from '../location/entities/location.entity';
import { BlockedDate } from '../property/entities/blocked-date.entity';
import { PriceRule } from '../property/entities/price-rule.entity';
import { Booking } from '../booking/entities/booking.entity';
import { User } from '../user/entities/user.entity';
import { Review } from '../review/entities/review.entity';
import { Image } from '../image/entities/image.entity';
import { Amenity } from '../amenity/entities/amenity.entity';
import { NearbyPlace } from '../nearby-place/entities/nearby-place.entity';

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
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
            database: configService.get('DB_DATABASE_TEST', 'rental_db_test'),
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
            synchronize: true, // Be careful with this in production!
            logging: false,
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
}); 