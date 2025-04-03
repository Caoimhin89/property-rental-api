import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'apollo-require-preflight',
      'x-apollo-operation-name',
    ],
    credentials: true,
  });
  
  console.log('Setting up graphqlUploadExpress middleware');
  app.use(graphqlUploadExpress());
  
  // Serve static files from the 'files' directory
  app.useStaticAssets(join(__dirname, '..', 'files'), {
    prefix: '/files/',
  });
  console.log('Middleware setup complete');

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();