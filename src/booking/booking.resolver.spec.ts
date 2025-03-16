import { Test, TestingModule } from '@nestjs/testing';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';

describe('BookingResolver', () => {
  let resolver: BookingResolver;
  let bookingService: BookingService;

  const mockBookingResponse = {
    success: true,
    message: 'Booking created successfully',
    bookingId: '1',
  };

  const mockBookingService = {
    createBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingResolver,
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    resolver = module.get<BookingResolver>(BookingResolver);
    bookingService = module.get<BookingService>(BookingService);
  });

  describe('createBooking', () => {
    it('should create a new booking', async () => {
      const bookingInput = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        numberOfGuests: 2,
        propertyId: '1',
        userId: '1',
        totalPrice: 1000,
      };

      mockBookingService.createBooking.mockResolvedValue(mockBookingResponse);

      const result = await resolver.createBooking('1', bookingInput);
      expect(result).toEqual(mockBookingResponse);
      expect(bookingService.createBooking).toHaveBeenCalledWith('1', bookingInput);
    });
  });
}); 