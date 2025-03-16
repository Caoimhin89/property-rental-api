import { Test, TestingModule } from '@nestjs/testing';
import { PropertyResolver } from './property.resolver';
import { PropertyService } from './property.service';
import { DataLoaderService } from '../data-loader/data-loader.service';
import { BookingService } from '../booking/booking.service';
import { PropertyType } from '../graphql';
import { Property } from '../graphql';

describe('PropertyResolver', () => {
  let resolver: PropertyResolver;
  let propertyService: PropertyService;
  let dataLoader: DataLoaderService;

  const mockProperty = {
    id: '1',
    name: 'Test Property',
    description: 'A test property',
    propertyType: PropertyType.HOUSE,
    price: 100,
    amenities: [],
    images: [],
    reviews: null,
    location: {
      coordinates: { latitude: 0, longitude: 0 },
      nearbyPlaces: []
    },
    blockedDates: [],
    priceRules: [],
    basePrice: 100,
    createdAt: new Date()
  };

  const mockPropertyService = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPriceRulesInRange: jest.fn(),
    calculateTotalPrice: jest.fn(),
  };

  const mockDataLoader = {
    amenitiesLoader: { load: jest.fn() },
    imagesLoader: { load: jest.fn() },
    reviewsLoader: { load: jest.fn() },
    getLoader: jest.fn(),
  };

  const mockBookingService = {
    hasBookingsInRange: jest.fn().mockResolvedValue(false),
    findByPropertyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyResolver,
        {
          provide: PropertyService,
          useValue: mockPropertyService,
        },
        {
          provide: DataLoaderService,
          useValue: mockDataLoader,
        },
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    resolver = module.get<PropertyResolver>(PropertyResolver);
    propertyService = module.get<PropertyService>(PropertyService);
    dataLoader = module.get<DataLoaderService>(DataLoaderService);
  });

  describe('propertyById', () => {
    it('should return a property with default related fields', async () => {
      mockPropertyService.findById.mockResolvedValue(mockProperty);

      const result = await resolver.propertyById('1');
      expect(result).toEqual({
        ...mockProperty,
        amenities: [],
        images: [],
        reviews: null,
        location: {
          coordinates: { latitude: 0, longitude: 0 },
          nearbyPlaces: [],
        },
      });
    });

    it('should return null if property not found', async () => {
      mockPropertyService.findById.mockResolvedValue(null);

      const result = await resolver.propertyById('999');
      expect(result).toBeNull();
    });
  });

  describe('Field Resolvers', () => {
    const mockParent: Property = {
      id: '1',
      name: 'Test Property',
      description: 'Test Description',
      propertyType: PropertyType.HOUSE,
      basePrice: 100,
      amenities: [],
      images: [],
      reviews: null,
      location: {
        coordinates: { latitude: 0, longitude: 0 },
        nearbyPlaces: [],
      },
      blockedDates: [],
      priceRules: [],
      createdAt: new Date(),
    };

    it('should resolve amenities', async () => {
      const mockAmenities = [{ id: '1', name: 'WiFi' }];
      mockDataLoader.amenitiesLoader.load.mockResolvedValue(mockAmenities);

      const result = await resolver.amenities(mockParent);
      expect(result).toEqual(mockAmenities);
      expect(dataLoader.amenitiesLoader.load).toHaveBeenCalledWith('1');
    });

    it('should resolve images', async () => {
      const mockImages = [{ id: '1', url: 'test.jpg' }];
      mockDataLoader.imagesLoader.load.mockResolvedValue(mockImages);

      const result = await resolver.images(mockParent);
      expect(result).toEqual(mockImages);
      expect(dataLoader.imagesLoader.load).toHaveBeenCalledWith('1');
    });

    it('should resolve reviews', async () => {
      const mockReviews = { edges: [], pageInfo: {} };
      mockDataLoader.reviewsLoader.load.mockResolvedValue(mockReviews);

      const result = await resolver.reviews(mockParent);
      expect(result).toEqual(mockReviews);
      expect(dataLoader.reviewsLoader.load).toHaveBeenCalledWith('1');
    });
  });
}); 