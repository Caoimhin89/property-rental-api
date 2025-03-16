import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyType } from '../graphql';
import { BlockedDate } from './entities/blocked-date.entity';
import { PriceRule } from './entities/price-rule.entity';
import { LoggerService } from '../common/services/logger.service';

describe('PropertyService Unit Tests', () => {
  let service: PropertyService;
  let propertyRepository: Repository<Property>;

  const mockProperty = {
    id: '1',
    name: 'Test Property',
    description: 'A test property',
    propertyType: PropertyType.HOUSE,
    price: 100,
  };

  const mockQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(BlockedDate),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PriceRule),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    propertyRepository = module.get<Repository<Property>>(getRepositoryToken(Property));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a property by id', async () => {
      const mockProperty = {
        id: '1',
        name: 'Test Property',
        description: 'Test Description',
        propertyType: PropertyType.HOUSE,
        basePrice: 100,
        location: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'Test Country',
        },
      };

      jest.spyOn(propertyRepository, 'findOne').mockResolvedValue(mockProperty as Property);

      const result = await service.findById('1');
      expect(result).toEqual(mockProperty);
      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should return null if property not found', async () => {
      mockQueryBuilder.findOne.mockResolvedValue(null);
      
      const result = await service.findById('999');
      expect(result).toBeNull();
      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' }
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      const mockProperties = [
        {
          id: '1',
          name: 'Test Property 1',
          description: 'Test Description 1',
          propertyType: PropertyType.HOUSE,
          basePrice: 100,
        },
        {
          id: '2',
          name: 'Test Property 2',
          description: 'Test Description 2',
          propertyType: PropertyType.APARTMENT,
          basePrice: 200,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProperties, 2]);
      mockQueryBuilder.getMany.mockResolvedValue(mockProperties);
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith('property');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('property.created_at', 'DESC');
    });

    it('should handle pagination parameters', async () => {
      const mockProperties = [
        {
          id: '1',
          name: 'Test Property 1',
          description: 'Test Description 1',
          propertyType: PropertyType.HOUSE,
          basePrice: 100,
        },
        {
          id: '2',
          name: 'Test Property 2',
          description: 'Test Description 2',
          propertyType: PropertyType.APARTMENT,
          basePrice: 200,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProperties, 2]);
      mockQueryBuilder.getMany.mockResolvedValue(mockProperties);
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const first = 10;

      const result = await service.findAll({
        first,
        after: 'someCursor',
        filter: {
          propertyType: PropertyType.HOUSE
        }
      });

      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith('property');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('property.created_at', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(first + 1);
    });

    it('should handle complex filters', async () => {
      const mockProperties = [
        {
          id: '2',
          name: 'Test Property 2',
          description: 'Test Description 2',
          propertyType: PropertyType.APARTMENT,
          basePrice: 150,
        }
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProperties, 1]);

      const filter = {
        minPrice: 100,
        maxPrice: 200,
        propertyType: PropertyType.APARTMENT,
      };

      const result = await service.findAll({
        first: 10,
        filter,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith('property');
      
      const filterCalls = mockQueryBuilder.andWhere.mock.calls.filter(call => call.length > 0);
      expect(filterCalls).toEqual([
        ['property.propertyType = :propertyType', { propertyType: PropertyType.APARTMENT }],
        ['property.basePrice >= :minPrice', { minPrice: 100 }],
        ['property.basePrice <= :maxPrice', { maxPrice: 200 }]
      ]);
      
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('property.created_at', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(11);
    });

    it('should handle empty filters', async () => {
      const mockProperties = [
        {
          id: '1',
          name: 'Test Property 1',
          description: 'Test Description 1',
          propertyType: PropertyType.HOUSE,
          basePrice: 100,
        },
        {
          id: '2',
          name: 'Test Property 2',
          description: 'Test Description 2',
          propertyType: PropertyType.APARTMENT,
          basePrice: 200,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockProperties, 2]);

      const first = 10;
      const result = await service.findAll({
        first,
        filter: {}  // Empty filter
      });

      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(propertyRepository.createQueryBuilder).toHaveBeenCalledWith('property');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('property.created_at', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(first + 1);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();  // Should NOT be called with empty filters
    });
  });
}); 