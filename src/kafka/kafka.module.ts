import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID || 'rental-app',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'rental-consumer-group',
          }
        }
      }
    ])
  ],
  providers: [KafkaService],
  exports: [KafkaService, ClientsModule]
})
export class KafkaModule {} 