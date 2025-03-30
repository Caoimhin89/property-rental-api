import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BookingService } from './booking.service';
import {
  PaginationInput,
  BookingConnection,
  CreateBookingInput,
  BookingResponse,
  Booking as BookingType, 
  BookingStatus} from '../graphql';
import { Booking as BookingEntity } from './entities/booking.entity';
import { DataLoaderService } from '../data-loader/data-loader.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from 'user/entities/user.entity';
import { CurrentUser } from 'auth/current-user.decorator';
import { AdminGuard } from 'auth/admin.guard';

@Resolver(BookingType)
export class BookingResolver {
  constructor(
    private readonly bookingService: BookingService,
    private readonly dataLoader: DataLoaderService
  ) {}

  @ResolveField()
  property(@Parent() booking: BookingEntity) {
    return this.dataLoader.propertiesLoader.load(booking.propertyId);
  }

  @ResolveField()
  user(@Parent() booking: BookingEntity) {
    return this.dataLoader.usersLoader.load(booking.userId);
  }

  @Query(() => BookingType, { nullable: true })
  async booking(@Args('id') id: string): Promise<BookingEntity | null> {
    return this.bookingService.findOne(id);
  }

  @Query(() => BookingConnection, { nullable: true })
  async bookings(
    @Args('pagination') pagination: PaginationInput,
  ): Promise<BookingConnection> {
    return this.bookingService.findAllBookings(undefined, pagination);
  }

  @Query(() => BookingConnection, { nullable: true })
  async bookingsByUser(
    @Args('userId') userId: string,
    @Args('pagination') pagination: PaginationInput,
  ): Promise<BookingConnection> {
    return this.bookingService.findAllBookings(userId, pagination);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => BookingResponse, { nullable: true })
  async createBooking(
    @Args('propertyId') propertyId: string,
    @Args('input') input: CreateBookingInput,
    @CurrentUser() user: User
  ): Promise<BookingResponse> {
    return this.bookingService.createBooking(propertyId, input, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Mutation(() => BookingType, { nullable: true })
  async confirmBooking(
    @Args('bookingId') bookingId: string,
    @CurrentUser() user: User
  ): Promise<BookingType> {
    return this.bookingService.confirmBooking(bookingId, user);
  }

  async cancelBooking(
    @Args('bookingId') bookingId: string,
    @CurrentUser() user: User
  ): Promise<BookingType> {
    return this.bookingService.cancelBooking(bookingId, user);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Mutation(() => BookingType, { nullable: true })
  async rejectBooking(
    @Args('bookingId') bookingId: string,
    @CurrentUser() user: User
  ): Promise<BookingType> {
    return this.bookingService.rejectBooking(bookingId, user);
  }
} 