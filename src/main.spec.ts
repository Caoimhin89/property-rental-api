import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';

describe('Bootstrap', () => {
  let app: any;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should bootstrap the app with validation pipe', async () => {
    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const server = app.getHttpServer();
    const response = await request(server).get('/health');
    expect(response.status).toBe(404); // Or 200 if you have a health check endpoint
  });

  it('should handle validation errors', async () => {
    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const server = app.getHttpServer();
    const response = await request(server)
      .post('/graphql')
      .send({
        query: `
          mutation {
            createBooking(propertyId: "1", bookingInput: {
              startDate: null,
              endDate: null,
              numberOfGuests: -1
            }) {
              success
              bookingId
            }
          }
        `
      });

    expect(response.status).toBe(400);
  });
}); 