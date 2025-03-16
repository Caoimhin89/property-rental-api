import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewService } from './review.service';
import { Review } from './entities/review.entity';
import { DataLoaderService } from '../data-loader/data-loader.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: Repository<Review>;

  const mockReviews = [
    {
      id: '1',
      rating: 4.5,
      text: 'Great place!',
      createdAt: '2025-03-06T08:45:48.821Z',
      property: { id: '1' },
      user: { id: '1', name: 'John' },
    },
    {
      id: '2',
      rating: 5,
      text: 'Excellent!',
      createdAt: '2025-03-06T08:45:48.821Z',
      property: { id: '1' },
      user: { id: '2', name: 'Jane' },
    },
  ];

  const mockRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataLoaderService = {
    propertiesLoader: {
      load: jest.fn().mockImplementation((id) => Promise.resolve({ id })),
    },
    usersLoader: {
      load: jest.fn().mockImplementation((id) => Promise.resolve({ id })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockRepository,
        },
        {
          provide: DataLoaderService,
          useValue: mockDataLoaderService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    repository = module.get<Repository<Review>>(getRepositoryToken(Review));
  });

  describe('findByPropertyId', () => {
    it('should handle pagination with before cursor', async () => {
      const cursorId = '5';
      const cursor = Buffer.from(cursorId).toString('base64');
      mockRepository.findAndCount.mockResolvedValue([mockReviews, 2]);

      const result = await service.findByPropertyId({
        propertyId: '1',
        before: cursor,
        last: 5,
      });

      expect(result).toEqual({
        edges: mockReviews.map(review => ({
          node: review,
          cursor: Buffer.from(review.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: expect.any(String),
          endCursor: expect.any(String),
        },
        totalCount: 2
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { property: { id: '1' } },
        take: -5,
        skip: 0,
      });
    });

    it('should handle pagination with after cursor', async () => {
      const cursorId = '5'; // example ID
      const cursor = Buffer.from(cursorId).toString('base64');
      mockRepository.findAndCount.mockResolvedValue([mockReviews, 2]);

      const result = await service.findByPropertyId({
        propertyId: '1',
        after: cursor,
        first: 5,
      });

      expect(result).toEqual({
        edges: mockReviews.map(review => ({
          node: review,
          cursor: Buffer.from(review.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: expect.any(String),
          endCursor: expect.any(String),
        },
        totalCount: 2
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { property: { id: '1' } },
        take: 5,
        skip: parseInt(cursorId),
      });
    });

    it('should handle no pagination parameters', async () => {
      const mockReviews = [
        { 
          id: '1', 
          rating: 5, 
          text: 'Great!',
          property: { id: '1' },
          user: { id: '1' }
        },
        { 
          id: '2', 
          rating: 4, 
          text: 'Good!',
          property: { id: '1' },
          user: { id: '1' }
        }
      ] as unknown as Review[];

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockReviews, 2]);

      const result = await service.findByPropertyId({ propertyId: '1' });

      expect(result).toEqual({
        edges: mockReviews.map(review => ({
          node: review,
          cursor: expect.any(String),
        })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: expect.any(String),
          endCursor: expect.any(String),
        },
        totalCount: 2
      });
    });
  });

  describe('create', () => {
    it('should create a new review', async () => {
      const reviewInput = {
        rating: 5,
        text: 'Great place!',
      };

      mockRepository.create.mockReturnValue(mockReviews[0]);
      mockRepository.save.mockResolvedValue(mockReviews[0]);

      const result = await service.create('1', reviewInput, '1');

      expect(result).toEqual(mockReviews[0]);
      expect(repository.create).toHaveBeenCalledWith({
        rating: reviewInput.rating,
        text: reviewInput.text,
        createdAt: expect.any(Date),
        property: { id: '1' },
        user: { id: '1' },
      });
    });
  });
}); 