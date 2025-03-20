import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { PropertyModule } from './property/property.module';
import { AmenityModule } from './amenity/amenity.module';
import { ImageModule } from './image/image.module';
import { ReviewModule } from './review/review.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { DatabaseModule } from './database/database.module';
import { LocationModule } from './location/location.module';
import { DataLoaderModule } from 'data-loader/data-loader.module';
import { NearbyPlaceModule } from 'nearby-place/nearby-place.module';
import { OrganizationModule } from './organization/organization.module';
import { AuthModule } from './auth/auth.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SearchModule } from './search/search.module';
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || 'redis',
        ttl: 60,
      }),
    }),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./src/schema.graphql'],
      installSubscriptionHandlers: true,
    }),
    PropertyModule,
    AmenityModule,
    ImageModule,
    ReviewModule,
    UserModule,
    BookingModule,
    LocationModule,
    DataLoaderModule,
    NearbyPlaceModule,
    OrganizationModule,
    MaintenanceModule,
    AuthModule,
    SearchModule,
  ],
})
export class AppModule {}