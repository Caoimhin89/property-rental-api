import { Test, TestingModule } from '@nestjs/testing';
import { AmenityService } from './amenity.service';
import { Amenity } from '../graphql';

describe('AmenityService', () => {
  let service: AmenityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmenityService],
    }).compile();

    service = module.get<AmenityService>(AmenityService);
  });

  describe('findByPropertyId', () => {
    it('should return mock amenities for now', async () => {
      const result = await service.findByPropertyId('1');
      expect(result).toEqual([
        {
          id: '1',
          name: 'WiFi',
          category: 'Internet',
        },
        {
          id: '2',
          name: 'Pool',
          category: 'Recreation',
        },
      ]);
    });
  });
}); 