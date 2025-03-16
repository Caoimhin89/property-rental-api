import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewInput } from '../graphql';
import { toCursor } from '../common/utils';

interface FindReviewsArgs {
  propertyId: string;
  after?: string;
  before?: string;
  first?: number;
  last?: number;
}

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async findByPropertyId({ propertyId, after, before, first, last }: FindReviewsArgs) {
    const qb = this.reviewRepository.createQueryBuilder('reviews')
      .where('reviews.property_id = :propertyId', { propertyId })
      .orderBy('reviews.created_at', 'DESC');

    if (after) {
      qb.andWhere('reviews.created_at < (SELECT created_at FROM reviews WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('reviews.created_at > (SELECT created_at FROM reviews WHERE id = :before)', { before });
    }

    if (first) {
      qb.take(first + 1);
    } else if (last) {
      qb.orderBy('reviews.created_at', 'ASC')
        .take(last + 1);
    }

    const [reviews, totalCount] = await qb.getManyAndCount();
    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first && reviews.length > first) {
      hasNextPage = true;
      reviews.pop();
    } else if (last && reviews.length > last) {
      hasPreviousPage = true;
      reviews.pop();
    }

    const orderedReviews = last ? reviews.reverse() : reviews;

    const edges = orderedReviews.map(review => ({
      node: {
        id: review.id,
        rating: review.rating,
        text: review.text,
        userId: review.userId,
        propertyId: review.propertyId,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      cursor: toCursor(review.id)
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount,
    };
  }

  async create(propertyId: string, input: CreateReviewInput, userId: string): Promise<Review> {
    const review = this.reviewRepository.create({
      rating: input.rating,
      text: input.text || undefined,
      createdAt: new Date(),
      property: { id: propertyId },
      user: { id: userId },
    });
    
    return this.reviewRepository.save(review);
  }
} 