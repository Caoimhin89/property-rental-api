import { Test, TestingModule } from '@nestjs/testing';
import { AmenityResolver } from './amenity.resolver';
import { AmenityService } from './amenity.service';

describe('AmenityResolver', () => {
  let resolver: AmenityResolver;
  let amenityService: AmenityService;

  const mockAmenities = [
    { id: '1', name: 'WiFi', category: 'Internet' },
    { id: '2', name: 'Pool', category: 'Recreation' },
  ];

  const mockAmenityService = {
    findByPropertyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmenityResolver,
        {
          provide: AmenityService,
          useValue: mockAmenityService,
        },
      ],
    }).compile();

    resolver = module.get<AmenityResolver>(AmenityResolver);
    amenityService = module.get<AmenityService>(AmenityService);
  });

  describe('propertyAmenities', () => {
    it('should return amenities for a property', async () => {
      mockAmenityService.findByPropertyId.mockResolvedValue(mockAmenities);

      const result = await resolver.propertyAmenities('1');
      expect(result).toEqual(mockAmenities);
      expect(amenityService.findByPropertyId).toHaveBeenCalledWith('1');
    });
  });
}); 