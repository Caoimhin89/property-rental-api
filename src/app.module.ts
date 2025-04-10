import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule, Context } from '@nestjs/graphql';
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
import { LlmModule } from './llm/llm.module';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import { FileModule } from './file/file.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { EventProcessorModule } from './event-processor/event-processor.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule, JwtModule],
      inject: [JwtService, JwtStrategy],
      useFactory: async (
        jwtService: JwtService,
        jwtStrategy: JwtStrategy) => {
        return {
          typePaths: ['./src/schema.graphql'],
          installSubscriptionHandlers: true,
          resolvers: {
            Upload: GraphQLUpload,
          },
          subscriptions: {
            'graphql-ws': {
              path: '/graphql',
              onConnect: async (context: { connectionParams?: { authorization?: string } }) => {
                console.log('onConnect', context.connectionParams);
                try {
                  if (!context.connectionParams?.authorization) {
                    throw new Error('No authorization token provided');
                  }

                  const token = context.connectionParams.authorization.replace('Bearer ', '');

                  // First decode the token
                  console.log('token', token);
                  const decoded = await jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
                  console.log('decoded', decoded);

                  // validate the token
                  const user = await jwtStrategy.validate(decoded);
                  console.log('user', user);
                  // Return the same context structure our guards expect
                  return {
                    req: {
                      user
                    }
                  };
                } catch (error) {
                  throw new Error('Unauthorized');
                }
              },
            },
          },
          context: ({ connection }) => {
            if (connection) {
              return connection.context;
            }
            return {};
          },
        };
      },
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
    LlmModule,
    FileModule,
    PubSubModule,
    EventProcessorModule,
  ],
  providers: [
    JwtService,
  ],
})
export class AppModule { }