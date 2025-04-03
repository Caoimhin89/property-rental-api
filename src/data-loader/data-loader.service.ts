import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { AmenityService } from '../amenity/amenity.service';
import { ImageService } from '../image/image.service';
import { ReviewService } from '../review/review.service';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
import { LocationService } from '../location/location.service';
import { BookingService } from '../booking/booking.service';
import {
  AMENITIES_LOADER, IMAGES_LOADER, PROPERTY_IMAGES_LOADER,
  REVIEWS_LOADER, PROPERTIES_LOADER,
  USERS_LOADER, LOCATIONS_LOADER,
  ORGANIZATION_PROPERTIES_LOADER,
  ORGANIZATION_MEMBERS_LOADER,
  USER_MAINTENANCE_REQUESTS_LOADER,
  NEARBY_PLACES_LOADER,
  USER_FAVORITE_PROPERTIES_LOADER,
  ORGANIZATION_KPIS_LOADER
} from './data-loader.constants';
import { PaginationInput } from '../graphql';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { NearbyPlaceService } from '../nearby-place/nearby-place.service';
import { Location } from 'location/entities/location.entity';
import { MaintenanceRequestStatus } from '../maintenance/entities/maintenance-request.entity';
@Injectable()
export class DataLoaderService {
  [AMENITIES_LOADER]: DataLoader<string, any>;
  [IMAGES_LOADER]: DataLoader<string, any>;
  [PROPERTY_IMAGES_LOADER]: {
    load: (propertyId: string, paginationArgs?: PaginationInput) => Promise<any>;
  };
  [REVIEWS_LOADER]: DataLoader<string, any>;
  [PROPERTIES_LOADER]: DataLoader<string, any>;
  [USERS_LOADER]: DataLoader<string, any>;
  [LOCATIONS_LOADER]: DataLoader<string, any>;
  [ORGANIZATION_PROPERTIES_LOADER]: {
    load: (organizationId: string, paginationArgs: PaginationInput) => Promise<any>;
    loadMany: (organizationIds: readonly string[], paginationArgs: PaginationInput) => Promise<any>;
  };
  [ORGANIZATION_MEMBERS_LOADER]: {
    load: (organizationId: string) => Promise<any>;
  };
  [USER_MAINTENANCE_REQUESTS_LOADER]: {
    load: (userId: string, paginationArgs?: PaginationInput) => Promise<any>;
  };
  [NEARBY_PLACES_LOADER]: {
    load: (
      location: Location,
      paginationArgs?: PaginationInput,
      radiusInMi?: number,
      radiusInKm?: number) => Promise<any>;
  };
  [USER_FAVORITE_PROPERTIES_LOADER]: {
    load: (userId: string) => Promise<any>;
  };
  [ORGANIZATION_KPIS_LOADER]: {
    load: (organizationId: string) => Promise<any>;
  };
  maintenanceRequestsLoader: DataLoader<{ propertyId: string; status?: MaintenanceRequestStatus; pagination?: PaginationInput }, any>;
  
  constructor(
    private readonly amenityService: AmenityService,
    private readonly imageService: ImageService,
    private readonly reviewService: ReviewService,
    private readonly propertyService: PropertyService,
    private readonly userService: UserService,
    private readonly locationService: LocationService,
    private readonly maintenanceService: MaintenanceService,
    private readonly nearbyPlaceService: NearbyPlaceService,
    private readonly bookingService: BookingService,
  ) {
    this[AMENITIES_LOADER] = new DataLoader(
      (propertyIds: readonly string[]) => 
        Promise.all(propertyIds.map(id => this.amenityService.findByPropertyId(id)))
    );

    this[IMAGES_LOADER] = new DataLoader(
      (propertyIds: readonly string[]) => 
        Promise.all(propertyIds.map(id => this.imageService.findByPropertyId(id)))
    );

    this[REVIEWS_LOADER] = new DataLoader(
      (propertyIds: readonly string[]) => 
        Promise.all(propertyIds.map(id => this.reviewService.findByPropertyId({ propertyId: id })))
    );

    this[PROPERTIES_LOADER] = new DataLoader<string, any>(
      async (ids: string[]) => {
        const properties = await this.propertyService.findByIds(ids);
        return ids.map(id => {
          const property = properties.find(p => p.id === id);
          return property ? property : new Error(`Property not found: ${id}`);
        });
      }
    );

    this[USERS_LOADER] = new DataLoader(
      (ids: readonly string[]) => 
        Promise.all(ids.map(id => this.userService.findById(id)))
    );

    this[LOCATIONS_LOADER] = new DataLoader(
      (propertyIds: readonly string[]) => 
        Promise.all(propertyIds.map(id => this.locationService.findByPropertyId(id)))
    );

    this[ORGANIZATION_PROPERTIES_LOADER] = {
      load: async (organizationId: string, paginationArgs) => {
        const result = await this.propertyService.findByOrganizationId(organizationId, paginationArgs);
        return result;
      },
      loadMany: (organizationIds: readonly string[], paginationArgs: PaginationInput) =>
        this.propertyService.findByOrganizationIds(organizationIds, paginationArgs)
    };

    this[ORGANIZATION_MEMBERS_LOADER] = {
      load: (organizationId: string) => 
        this.userService.findByOrganizationId(organizationId),
    }

    this[PROPERTY_IMAGES_LOADER] = {
      load: async (propertyId: string, pagination?: PaginationInput) => {
        return this.imageService.findByPropertyId(propertyId, pagination);
      }
    };

    this[USER_MAINTENANCE_REQUESTS_LOADER] = {
      load: (userId: string, paginationArgs?: PaginationInput) => 
        this.maintenanceService.findByUserId(userId, paginationArgs)
    };

    this[NEARBY_PLACES_LOADER] = {
      load: (
        location: Location,
        paginationArgs?: PaginationInput,
        radiusInMi?: number,
        radiusInKm?: number) => this.nearbyPlaceService.findWithinRadiusOfLocation(
          location,
          paginationArgs,
          radiusInMi,
          radiusInKm)
    };

    this[USER_FAVORITE_PROPERTIES_LOADER] = {
      load: (userId: string) => this.propertyService.getFavoritesByUserId(userId)
    };

    this[ORGANIZATION_KPIS_LOADER] = {
      load: async (organizationId: string) => {
        // fetch all the kpis for the organization
        const [propertyStats, maintenanceStats, bookingStats, revenueStats] = await Promise.all([
          this.propertyService.getKPIsByOrganizationId(organizationId),
          this.maintenanceService.getKPIsByOrganizationId(organizationId),
          this.bookingService.getKPIsByOrganizationId(organizationId),
          this.bookingService.getRevenueKPIsByOrganizationId(organizationId)
        ]);

        // merge the kpis into a single object
        const kpis = {
          propertyKpis: {
            totalProperties: propertyStats.totalProperties || 0,
          },
          maintenanceKpis: {
            totalCurrentMonthMaintenanceRequests: maintenanceStats.totalCurrentMonthMaintenanceRequests || 0,
            totalCurrentMonthMaintenanceRequestsCompleted: maintenanceStats.totalCurrentMonthMaintenanceRequestsCompleted || 0,
            totalCurrentMonthMaintenanceRequestsPending: maintenanceStats.totalCurrentMonthMaintenanceRequestsPending || 0,
            totalCurrentMonthMaintenanceRequestsInProgress: maintenanceStats.totalCurrentMonthMaintenanceRequestsInProgress || 0,
            totalPreviousMonthMaintenanceRequests: maintenanceStats.totalPreviousMonthMaintenanceRequests || 0,
            totalPreviousMonthMaintenanceRequestsCompleted: maintenanceStats.totalPreviousMonthMaintenanceRequestsCompleted || 0,
            totalPreviousMonthMaintenanceRequestsPending: maintenanceStats.totalPreviousMonthMaintenanceRequestsPending || 0,
            totalPreviousMonthMaintenanceRequestsInProgress: maintenanceStats.totalPreviousMonthMaintenanceRequestsInProgress || 0,
          },
          bookingKpis: {
            totalCurrentMonthConfirmedBookings: bookingStats.totalCurrentMonthConfirmedBookings || 0,
            totalCurrentMonthCancelledBookings: bookingStats.totalCurrentMonthCancelledBookings || 0,
            totalCurrentMonthPendingBookings: bookingStats.totalCurrentMonthPendingBookings || 0,
            totalCurrentMonthRejectedBookings: bookingStats.totalCurrentMonthRejectedBookings || 0,
            totalPreviousMonthConfirmedBookings: bookingStats.totalPreviousMonthConfirmedBookings || 0,
            totalPreviousMonthCancelledBookings: bookingStats.totalPreviousMonthCancelledBookings || 0,
            totalPreviousMonthRejectedBookings: bookingStats.totalPreviousMonthRejectedBookings || 0,
            totalLifetimeConfirmedBookings: bookingStats.totalLifetimeConfirmedBookings || 0,
            totalLifetimeCancelledBookings: bookingStats.totalLifetimeCancelledBookings || 0,
            totalLifetimeRejectedBookings: bookingStats.totalLifetimeRejectedBookings || 0,
          },
          revenueKpis: {
            currentMonthRevenue: revenueStats.currentMonthRevenue || 0,
            lastMonthRevenue: revenueStats.previousMonthRevenue || 0,
            yearToDateRevenue: revenueStats.yearToDateRevenue || 0,
          }
        };
        return kpis;
      }
    };

    this.maintenanceRequestsLoader = new DataLoader(
      async (keys: Array<{ propertyId: string; status?: MaintenanceRequestStatus; pagination?: PaginationInput }>) => {
        const results = await Promise.all(
          keys.map(({ propertyId, status, pagination }) =>
            this.maintenanceService.findByPropertyId(propertyId, status, pagination)
          )
        );
        return results;
      }
    );

  }

  clear(): void {
    this[AMENITIES_LOADER].clearAll();
    this[IMAGES_LOADER].clearAll();
    this[REVIEWS_LOADER].clearAll();
    this[PROPERTIES_LOADER].clearAll();
    this[USERS_LOADER].clearAll();
    this[LOCATIONS_LOADER].clearAll();
  }
} 