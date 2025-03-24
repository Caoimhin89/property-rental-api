import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
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
import { ApolloServerPluginCacheControl } from 'apollo-server-core';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import Keyv from 'keyv';
import KeyvRedis from "@keyv/redis";
import { KeyvAdapter } from '@apollo/utils.keyvadapter';

@Module({
  imports: [
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./src/schema.graphql'],
      installSubscriptionHandlers: true,
      plugins: [
        ApolloServerPluginCacheControl({ defaultMaxAge: 5 }) as any,
        responseCachePlugin() as any,
      ],
      cache: new KeyvAdapter(new Keyv({
        store: new KeyvRedis(`redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`),
        ttl: 60000, // 60 seconds
        namespace: 'rental-app'
      })),
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
  ],
})
export class AppModule {}