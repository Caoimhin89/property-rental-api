import ShortUniqueId from 'short-unique-id';
import { Injectable, Inject } from '@nestjs/common';
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
import { BookingStatus } from '../graphql';
import { ClientKafka } from '@nestjs/microservices';
@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
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
    userId?: string,
    pagination?: PaginationInput
  ): Promise<BookingConnection> {
    const { after, before, first, last } = pagination || {};
    const qb = this.bookingRepository.createQueryBuilder('booking')
      .orderBy('booking.created_at', 'DESC');

    if (userId) {
      qb.andWhere('booking.userId = :userId', { userId });
    }

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

  async getKPIsByOrganizationId(organizationId: string) {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const stats = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('properties', 'property', 'property.id = booking.property_id')
      .select([
        // Current Month Stats
        'COUNT(CASE WHEN booking.start_date >= :currentMonthStart AND booking.end_date <= :currentMonthEnd AND booking.status = :confirmed THEN 1 END) as "totalCurrentMonthConfirmedBookings"',
        'COUNT(CASE WHEN booking.start_date >= :currentMonthStart AND booking.end_date <= :currentMonthEnd AND booking.status = :cancelled THEN 1 END) as "totalCurrentMonthCancelledBookings"',
        'COUNT(CASE WHEN booking.start_date >= :currentMonthStart AND booking.end_date <= :currentMonthEnd AND booking.status = :pending THEN 1 END) as "totalCurrentMonthPendingBookings"',
        'COUNT(CASE WHEN booking.start_date >= :currentMonthStart AND booking.end_date <= :currentMonthEnd AND booking.status = :rejected THEN 1 END) as "totalCurrentMonthRejectedBookings"',
        
        // Previous Month Stats
        'COUNT(CASE WHEN booking.start_date >= :previousMonthStart AND booking.end_date <= :previousMonthEnd AND booking.status = :confirmed THEN 1 END) as "totalPreviousMonthConfirmedBookings"',
        'COUNT(CASE WHEN booking.start_date >= :previousMonthStart AND booking.end_date <= :previousMonthEnd AND booking.status = :cancelled THEN 1 END) as "totalPreviousMonthCancelledBookings"',
        'COUNT(CASE WHEN booking.start_date >= :previousMonthStart AND booking.end_date <= :previousMonthEnd AND booking.status = :pending THEN 1 END) as "totalPreviousMonthPendingBookings"',
        'COUNT(CASE WHEN booking.start_date >= :previousMonthStart AND booking.end_date <= :previousMonthEnd AND booking.status = :rejected THEN 1 END) as "totalPreviousMonthRejectedBookings"',
        
        // Lifetime Stats
        'COUNT(CASE WHEN booking.status = :confirmed THEN 1 END) as "totalLifetimeConfirmedBookings"',
        'COUNT(CASE WHEN booking.status = :cancelled THEN 1 END) as "totalLifetimeCancelledBookings"',
        'COUNT(CASE WHEN booking.status = :rejected THEN 1 END) as "totalLifetimeRejectedBookings"'
      ])
      .where('property.organization_id = :organizationId', { organizationId })
      .setParameters({
        currentMonthStart,
        currentMonthEnd,
        previousMonthStart,
        previousMonthEnd,
        confirmed: BookingStatus.CONFIRMED,
        cancelled: BookingStatus.CANCELLED,
        pending: BookingStatus.PENDING,
        rejected: BookingStatus.REJECTED
      })
      .getRawOne();

    // Convert string values to numbers and provide defaults
    return {
      totalCurrentMonthConfirmedBookings: parseInt(stats.totalCurrentMonthConfirmedBookings) || 0,
      totalCurrentMonthCancelledBookings: parseInt(stats.totalCurrentMonthCancelledBookings) || 0,
      totalCurrentMonthPendingBookings: parseInt(stats.totalCurrentMonthPendingBookings) || 0,
      totalCurrentMonthRejectedBookings: parseInt(stats.totalCurrentMonthRejectedBookings) || 0,
      totalPreviousMonthConfirmedBookings: parseInt(stats.totalPreviousMonthConfirmedBookings) || 0,
      totalPreviousMonthCancelledBookings: parseInt(stats.totalPreviousMonthCancelledBookings) || 0,
      totalPreviousMonthPendingBookings: parseInt(stats.totalPreviousMonthPendingBookings) || 0,
      totalPreviousMonthRejectedBookings: parseInt(stats.totalPreviousMonthRejectedBookings) || 0,
      totalLifetimeConfirmedBookings: parseInt(stats.totalLifetimeConfirmedBookings) || 0,
      totalLifetimeCancelledBookings: parseInt(stats.totalLifetimeCancelledBookings) || 0,
      totalLifetimeRejectedBookings: parseInt(stats.totalLifetimeRejectedBookings) || 0
    };
  }

  async getRevenueKPIsByOrganizationId(organizationId: string) {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const yearStart = new Date(currentDate.getFullYear(), 0, 1); // January 1st of current year

    const stats = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('properties', 'property', 'property.id = booking.property_id')
      .select([
        // Current Month Revenue
        'SUM(CASE WHEN booking.start_date >= :currentMonthStart AND booking.end_date <= :currentMonthEnd THEN booking.total_price ELSE 0 END) as "currentMonthRevenue"',
        // Previous Month Revenue
        'SUM(CASE WHEN booking.start_date >= :previousMonthStart AND booking.end_date <= :previousMonthEnd THEN booking.total_price ELSE 0 END) as "previousMonthRevenue"',
        // Year to Date Revenue
        'SUM(CASE WHEN booking.start_date >= :yearStart AND booking.end_date <= :currentDate THEN booking.total_price ELSE 0 END) as "yearToDateRevenue"'
      ])
      .where('property.organization_id = :organizationId', { organizationId })
      .andWhere('booking.status = :confirmed') // Only count confirmed bookings
      .setParameters({
        organizationId,
        currentMonthStart,
        currentMonthEnd,
        previousMonthStart,
        previousMonthEnd,
        yearStart,
        currentDate,
        confirmed: BookingStatus.CONFIRMED
      })
      .getRawOne();

    return {
      currentMonthRevenue: parseFloat(stats.currentMonthRevenue) || 0,
      previousMonthRevenue: parseFloat(stats.previousMonthRevenue) || 0,
      yearToDateRevenue: parseFloat(stats.yearToDateRevenue) || 0,
      revenueGrowth: this.calculateRevenueGrowth(
        parseFloat(stats.currentMonthRevenue) || 0,
        parseFloat(stats.previousMonthRevenue) || 0
      )
    };
  }

  // Helper function to calculate revenue growth percentage
  private calculateRevenueGrowth(currentRevenue: number, previousRevenue: number): number {
    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
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
    await this.kafkaClient.emit('booking.created', {
      key: booking.id,
      value: booking,
      headers: {
        timestamp: new Date().toISOString(),
      },
    });

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

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = status;
    await this.bookingRepository.save(booking);
    await this.kafkaClient.emit('booking.status.updated', {
      key: booking.id,
      value: booking,
      headers: {
        timestamp: new Date().toISOString(),
      },
    });
    return booking;
  }
} 