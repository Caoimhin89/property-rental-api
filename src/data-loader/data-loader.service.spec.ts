import { Test, TestingModule } from '@nestjs/testing';
import { DataLoaderService } from './data-loader.service';
import { AmenityService } from '../amenity/amenity.service';
import { ImageService } from '../image/image.service';
import { ReviewService } from '../review/review.service';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
import { LocationService } from '../location/location.service';
import { AMENITIES_LOADER, LOCATIONS_LOADER, IMAGES_LOADER, REVIEWS_LOADER, PROPERTIES_LOADER, USERS_LOADER } from './data-loader.constants';

describe('DataLoaderService', () => {
  let service: DataLoaderService;

  const mockAmenities = [{ id: '1', propertyId: '1' }];
  const mockLocations = [{ id: '1', propertyId: '1' }];
  const mockImages = [{ id: '1', propertyId: '1' }];
  const mockProperties = [{ id: '1', name: 'Test Property' }];
  const mockUsers = [{ id: '1', name: 'Test User' }];
  const mockReviews = {
    edges: [{ node: { id: '1', propertyId: '1' } }],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null
    },
    totalCount: 1
  };

  const mockAmenityService = {
    findByPropertyId: jest.fn((id) => Promise.resolve(mockAmenities[0])),
  };

  const mockImageService = {
    findByPropertyId: jest.fn((id) => Promise.resolve(mockImages[0])),
  };

  const mockReviewService = {
    findByPropertyId: jest.fn((params) => Promise.resolve(mockReviews)),
  };

  const mockPropertyService = {
    findById: jest.fn((id) => Promise.resolve(mockProperties[0])),
  };

  const mockUserService = {
    findById: jest.fn((id) => Promise.resolve(mockUsers[0])),
  };

  const mockLocationService = {
    findByPropertyId: jest.fn((id) => Promise.resolve(mockLocations[0])),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataLoaderService,
        { provide: AmenityService, useValue: mockAmenityService },
        { provide: ImageService, useValue: mockImageService },
        { provide: ReviewService, useValue: mockReviewService },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: UserService, useValue: mockUserService },
        { provide: LocationService, useValue: mockLocationService },
      ],
    }).compile();

    service = module.get<DataLoaderService>(DataLoaderService);
  });

  it('should load amenities for a property', async () => {
    const propertyId = '1';
    await service[AMENITIES_LOADER].load(propertyId);
    expect(mockAmenityService.findByPropertyId).toHaveBeenCalledWith(propertyId);
  });

  it('should load images for a property', async () => {
    const propertyId = '1';
    await service[IMAGES_LOADER].load(propertyId);
    expect(mockImageService.findByPropertyId).toHaveBeenCalledWith(propertyId);
  });

  it('should load reviews for a property', async () => {
    const propertyId = '1';
    await service[REVIEWS_LOADER].load(propertyId);
    expect(mockReviewService.findByPropertyId).toHaveBeenCalledWith({ propertyId });
  });

  it('should load a property by id', async () => {
    const propertyId = '1';
    await service[PROPERTIES_LOADER].load(propertyId);
    expect(mockPropertyService.findById).toHaveBeenCalledWith(propertyId);
  });

  it('should load a user by id', async () => {
    const userId = '1';
    await service[USERS_LOADER].load(userId);
    expect(mockUserService.findById).toHaveBeenCalledWith(userId);
  });

  it('should load locations for a property', async () => {
    const propertyId = '1';
    await service[LOCATIONS_LOADER].load(propertyId);
    expect(mockLocationService.findByPropertyId).toHaveBeenCalledWith(propertyId);
  });

  it('should clear all loaders', () => {
    service.clear();
    // Add expectations for clear method
  });
});