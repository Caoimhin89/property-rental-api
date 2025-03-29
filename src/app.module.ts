import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
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
import { KafkaModule } from './kafka/kafka.module';
import { NotificationModule } from './notification/notification.module';
import { CacheModule } from './cache/cache.module';
import { EmailModule } from './email/email.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    KafkaModule,
    NotificationModule,
    CacheModule,
    EmailModule,
  ],
})
export class AppModule {}