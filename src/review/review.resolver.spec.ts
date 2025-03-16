import { Test, TestingModule } from '@nestjs/testing';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';

describe('ReviewResolver', () => {
  let resolver: ReviewResolver;
  let reviewService: ReviewService;

  const mockReview = {
    id: '1',
    rating: 5,
    text: 'Great place!',
    createdAt: new Date(),
    user: { id: '1', name: 'Test User' },
  };

  const mockReviewService = {
    findByPropertyId: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewResolver,
        {
          provide: ReviewService,
          useValue: mockReviewService,
        },
      ],
    }).compile();

    resolver = module.get<ReviewResolver>(ReviewResolver);
    reviewService = module.get<ReviewService>(ReviewService);
  });

  describe('propertyReviews', () => {
    it('should return paginated reviews', async () => {
      const mockReviews = {
        edges: [{ cursor: '1', node: mockReview }],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      mockReviewService.findByPropertyId.mockResolvedValue(mockReviews);

      const result = await resolver.propertyReviews('1', undefined, undefined, 10, undefined);
      expect(result).toEqual(mockReviews);
      expect(reviewService.findByPropertyId).toHaveBeenCalledWith({
        propertyId: '1',
        after: undefined,
        before: undefined,
        first: 10,
        last: undefined,
      });
    });
  });

  describe('addReview', () => {
    it('should create a new review', async () => {
      const mockContext = {
        req: {
          user: { id: '1' },
        },
      };

      const reviewInput = {
        rating: 5,
        text: 'Great place!',
      };

      mockReviewService.create.mockResolvedValue(mockReview);

      const result = await resolver.addReview('1', reviewInput, mockContext);
      expect(result).toEqual(mockReview);
      expect(reviewService.create).toHaveBeenCalledWith('1', reviewInput, '1');
    });
  });
}); 