import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });
  app.useGlobalPipes(new ValidationPipe());
  
  app.useLogger(new LoggerService());
  
  // Add Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'rental-app',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'rental-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  // enable CORS
  app.enableCors({
    origin: ['http://localhost:8081', 'http://localhost:8088'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  app.use(graphqlUploadExpress({
    maxFileSize: 10000000, // 10 MB
    maxFiles: 5
  }));

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();