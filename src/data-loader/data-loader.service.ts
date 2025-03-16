import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { AmenityService } from '../amenity/amenity.service';
import { ImageService } from '../image/image.service';
import { ReviewService } from '../review/review.service';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
import { LocationService } from '../location/location.service';
import {
  AMENITIES_LOADER, IMAGES_LOADER, PROPERTY_IMAGES_LOADER,
  REVIEWS_LOADER, PROPERTIES_LOADER,
  USERS_LOADER, LOCATIONS_LOADER,
  ORGANIZATION_PROPERTIES_LOADER,
  ORGANIZATION_MEMBERS_LOADER,
  USER_MAINTENANCE_REQUESTS_LOADER
} from './data-loader.constants';
import { PaginationInput } from '../graphql';
import { MaintenanceService } from '../maintenance/maintenance.service';

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
    load: (organizationId: string, paginationArgs: PaginationInput) => Promise<any>;
  };
  [USER_MAINTENANCE_REQUESTS_LOADER]: {
    load: (userId: string, paginationArgs?: PaginationInput) => Promise<any>;
  };
  
  constructor(
    private readonly amenityService: AmenityService,
    private readonly imageService: ImageService,
    private readonly reviewService: ReviewService,
    private readonly propertyService: PropertyService,
    private readonly userService: UserService,
    private readonly locationService: LocationService,
    private readonly maintenanceService: MaintenanceService
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
      load: (organizationId: string, paginationArgs: PaginationInput) => 
        this.userService.findByOrganizationId(organizationId, paginationArgs).then(results => results[0]),
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