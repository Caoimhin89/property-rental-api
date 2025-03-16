import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BookingService', () => {
    let service: BookingService;
    let repository: Repository<Booking>;
    let module: TestingModule;

    const mockBooking = {
        id: '1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        property: { id: '1' },
        user: { id: '1' },
    } as Booking;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                BookingService,
                {
                    provide: getRepositoryToken(Booking),
                    useValue: {
                        find: jest.fn().mockResolvedValue([mockBooking]),
                        create: jest.fn().mockReturnValue(mockBooking),
                        save: jest.fn().mockResolvedValue(mockBooking),
                    },
                },
            ],
        }).compile();

        service = module.get<BookingService>(BookingService);
        repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    });

    afterEach(async () => {
        await module.close();
    });

    describe('findByPropertyId', () => {
        it('should return bookings for a property', async () => {
            jest.spyOn(repository, 'find').mockResolvedValue([mockBooking]);

            const result = await service.findByPropertyId('1');
            expect(result).toEqual([mockBooking]);
            expect(repository.find).toHaveBeenCalledWith({
                where: { property: { id: '1' } },
                relations: ['user'],
            });
        });
    });

    describe('findByUserId', () => {
        it('should return bookings for a user', async () => {
            jest.spyOn(repository, 'find').mockResolvedValue([mockBooking]);

            const result = await service.findByUserId('1');
            expect(result).toEqual([mockBooking]);
            expect(repository.find).toHaveBeenCalledWith({
                where: { user: { id: '1' } },
                relations: ['property'],
            });
        });
    });

    describe('create', () => {
        it('should create a new booking', async () => {
            const createBookingInput = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-07'),
                propertyId: '1',
                userId: '1',
            };

            const expectedCreateInput = {
                startDate: createBookingInput.startDate,
                endDate: createBookingInput.endDate,
                property: { id: createBookingInput.propertyId },
                user: { id: createBookingInput.userId },
            };

            jest.spyOn(repository, 'create').mockReturnValue(mockBooking);
            jest.spyOn(repository, 'save').mockResolvedValue(mockBooking);

            const result = await service.create(createBookingInput);
            expect(result).toEqual(mockBooking);
            expect(repository.create).toHaveBeenCalledWith(expectedCreateInput);
        });
    });

    describe('createBooking', () => {
        it('should create a new booking with hardcoded userId', async () => {
            const bookingInput = {
                startDate: new Date('2024-01-01').toISOString(),
                endDate: new Date('2024-01-07').toISOString(),
                numberOfGuests: 2,
                propertyId: '1',
                userId: '1',
            };

            const propertyId = '1';
            const expectedCreateInput = {
                startDate: bookingInput.startDate,  // Use ISO string directly
                endDate: bookingInput.endDate,      // Use ISO string directly
                propertyId,
                userId: '1', // Hardcoded value in service
                numberOfGuests: bookingInput.numberOfGuests,
            };

            jest.spyOn(service, 'create').mockResolvedValue(mockBooking);

            const result = await service.createBooking(propertyId, bookingInput);

            expect(result).toEqual({
                success: true,
                bookingId: mockBooking.id,
            });
            expect(service.create).toHaveBeenCalledWith(expectedCreateInput);
        });
    });
}); 