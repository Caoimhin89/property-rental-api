import ShortUniqueId from 'short-unique-id';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingConnection, BookingEdge, CreateBookingInput, BookingResponse } from '../graphql';
import { Booking as BookingType } from '../graphql';
import { PropertyService } from '../property/property.service';
import { LessThanOrEqual, MoreThanOrEqual, Not, In } from 'typeorm';
import { toCursor } from '../common/utils';
import { PaginationInput } from '../graphql';
import { buildPaginatedResponse } from '../common/utils';
import { Connection } from '../common/types/types';
import { Property } from 'property/entities/property.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly propertyService: PropertyService
  ) {}

  private toGraphQL(booking: Booking): BookingType {
    return booking as unknown as BookingType;
  }

  async hasBookingsInRange(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const count = await this.bookingRepository.count({
      where: {
        property: { id: propertyId },
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
        status: Not(In(['CANCELLED', 'REJECTED']))
      }
    });
    return count > 0;
  }

  private async fetchRequestedProperty(
    propertyId: string,
  ): Promise<Property | null> {
    return await this.propertyService.findById(propertyId);
  }

  private requestedPropertyExists(
    property: Property | null
  ): boolean {
    return property !== null;
  }

  private bookingNotExceedsMaxOccupancy(
    property: Property,
    numberOfGuests: number
  ): boolean {
    return numberOfGuests <= property.maxOccupancy;
  }

  async findAllBookings(
    after?: string,
    before?: string,
    first?: number,
    last?: number
  ): Promise<BookingConnection> {
    const qb = this.bookingRepository.createQueryBuilder('booking')
      .orderBy('booking.created_at', 'DESC');

    if (after) {
      qb.andWhere('booking.created_at < (SELECT created_at FROM bookings WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('booking.created_at > (SELECT created_at FROM bookings WHERE id = :before)', { before });
    }

    if (first) {
      qb.take(first + 1);
    } else if (last) {
      qb.orderBy('booking.created_at', 'ASC')
        .take(last + 1);
    }

    const bookings = await qb.getMany();
    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first && bookings.length > first) {
      hasNextPage = true;
      bookings.pop();
    } else if (last && bookings.length > last) {
      hasPreviousPage = true;
      bookings.pop();
    }

    const orderedBookings = last ? bookings.reverse() : bookings;

    const edges = orderedBookings.map(booking => ({
      cursor: toCursor(booking.id),
      node: this.toGraphQL(booking)
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount: await qb.getCount()
    };
  }

  async findOne(id: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({
      where: { id },
      relations: ['property', 'user'],
    });
  }

  async findByPropertyId(propertyId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { property: { id: propertyId } },
      relations: ['user'],
    });
  }

  async findByUserId(
    userId: string,
    pagination?: PaginationInput
  ): Promise<Connection<Booking>> {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.property', 'property')
      .where('booking.userId = :userId', { userId });

    if (pagination?.after) {
      query.andWhere('booking.createdAt < :after', {
        after: new Date(Buffer.from(pagination.after, 'base64').toString())
      });
    }

    query.orderBy('booking.createdAt', 'DESC');

    const limit = (pagination?.first || 10) + 1;
    query.take(limit);

    const [items, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      totalCount,
      pagination?.first || 10,
      (item) => Buffer.from(item.createdAt.toISOString()).toString('base64')
    );
  }

  async createBooking(propertyId: string, input: CreateBookingInput): Promise<BookingResponse> {

    // Check if property exists
    const property = await this.fetchRequestedProperty(propertyId);
    if (!this.requestedPropertyExists(property)) {
      return {
        success: false,
        message: 'Property not found',
        bookingId: null,
        confirmationCode: null
      };
    }

    // Check if booking does not exceed max occupancy
    if (!this.bookingNotExceedsMaxOccupancy(property!, input.numberOfGuests)) {
      return {
        success: false,
        message: 'Booking exceeds max occupancy',
        bookingId: null,
        confirmationCode: null
      };
    }

    // Check if dates are available
    const isAvailable = !(await this.hasBookingsInRange(
      propertyId,
      input.startDate,
      input.endDate
    ));

    if (!isAvailable) {
      return {
        success: false,
        message: 'Selected dates are not available',
        bookingId: null
      };
    }

    // Calculate total price
    const totalPrice = await this.propertyService.calculateTotalPrice(
      propertyId,
      input.startDate,
      input.endDate
    );

    // Create booking
    const uid = new ShortUniqueId({ length: 10 });
    const booking = this.bookingRepository.create({
      property: { id: propertyId! },
      user: { id: input.userId! },
      confirmationCode: uid.rnd(),
      numberOfGuests: input.numberOfGuests,
      startDate: input.startDate,
      endDate: input.endDate,
      totalPrice,
      status: 'PENDING'
    });

    await this.bookingRepository.save(booking);

    if (!booking) {
      return {
        success: false,
        message: 'Booking creation failed',
        bookingId: null,
        confirmationCode: null
      };
    }

    return {
      success: true,
      message: 'Booking created successfully',
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode
    };
  }
} 