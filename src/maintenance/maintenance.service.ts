import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRequest, MaintenanceRequestStatus } from './entities/maintenance-request.entity';
import { MaintenanceComment } from './entities/maintenance-comment.entity';
import { MaintenanceImage } from './entities/maintenance-image.entity';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
import { LoggerService } from '../common/services/logger.service';
import {
    PaginationInput,
    CreateMaintenanceCommentInput,
    CreateMaintenanceImageInput,
    CreateMaintenanceRequestInput,
    UpdateMaintenanceRequestInput,
    OrganizationRole
} from '../graphql';
import { Connection } from '../common/types/types';
import { buildPaginatedResponse, userHasAccessToResource } from '../common/utils';
import { Property as PropertyEntity } from 'property/entities/property.entity';
import { User as UserEntity } from 'user/entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { CacheSetEvent } from 'cache/cache.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'event-processor/events/event-processor.events';
@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private maintenanceRequestRepository: Repository<MaintenanceRequest>,
    @InjectRepository(MaintenanceComment)
    private maintenanceCommentRepository: Repository<MaintenanceComment>,
    @InjectRepository(MaintenanceImage)
    private maintenanceImageRepository: Repository<MaintenanceImage>,
    private propertyService: PropertyService,
    private userService: UserService,
    private logger: LoggerService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string, relations?: string[]): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRequestRepository.findOne({ where: { id }, relations });
    if (!request) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found`);
    }
    return request;
  }

  async findByPropertyId(
    propertyId: string,
    status?: MaintenanceRequestStatus,
    pagination?: PaginationInput
  ): Promise<Connection<MaintenanceRequest>> {
    this.logger.debug('Finding maintenance requests', 'MaintenanceService', { propertyId, status, pagination });

    // check cache
    const cacheKey = this.cacheService.generateCacheKey('maintenance-requests', { propertyId, status, pagination });
    const cachedResult = await this.cacheService.get('maintenance-requests', cacheKey);
    if (cachedResult) {
      return cachedResult as Connection<MaintenanceRequest>;
    }

    // Build base query
    const query = this.maintenanceRequestRepository.createQueryBuilder('request')
      .where('request.property_id = :propertyId', { propertyId });

    // Add status filter if provided
    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    // Handle pagination
    const limit = pagination?.first || 10;
    
    if (pagination?.after) {
      try {
        const decodedCursor = fromCursor(pagination.after);
        query.andWhere('request.created_at < :after', { after: decodedCursor });
      } catch (error) {
        this.logger.error('Invalid cursor format', 'MaintenanceService', JSON.stringify({ cursor: pagination.after }));
        throw new Error('Invalid cursor format');
      }
    }

    // Optimize ordering and add index hint
    query
      .orderBy('request.created_at', 'DESC')
      .addOrderBy('request.id', 'DESC')  // Secondary sort for stability
      .take(limit + 1);  // Take one extra to determine if there's a next page

    // Add query hint for index usage
    // query.setQueryBuilderOption('hints', ['USE INDEX (idx_maintenance_requests_property_created)']);

    try {
      const [items, totalCount] = await Promise.all([
        query.getMany(),
        query.getCount()
      ]);

      const hasNextPage = items.length > limit;
      const edges = items.slice(0, limit).map(item => ({
        node: item,
        cursor: toCursor(item.createdAt.toISOString())
      }));

      const result = {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!pagination?.after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        },
        totalCount
      };

      // cache result
      await this.eventEmitter.emit('cache.set', new CacheSetEvent(
        'maintenance-requests',
        cacheKey,
        result
      ));;

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch maintenance requests', 'MaintenanceService', error);
      throw error;
    }
  }

  async findByUserId(userId: string, pagination?: PaginationInput): Promise<Connection<MaintenanceRequest>> {
    this.logger.debug('repository', 'MaintenanceService', 'FindByUserId');
    const query = this.maintenanceRequestRepository.createQueryBuilder('request')
      .where('request.userId = :userId', { userId });

      const [users, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      users,
      totalCount,
      pagination?.first || 10,
      (item) => Buffer.from(item.createdAt.toISOString()).toString('base64')
    );
  }

  async findAll({ propertyId, status, pagination }: {
    propertyId?: string;
    status?: string;
    pagination?: PaginationInput;
  }): Promise<Connection<MaintenanceRequest>> {
    this.logger.debug('repository', 'MaintenanceService', 'FindAll');
    const query = this.maintenanceRequestRepository.createQueryBuilder('request');

    if (propertyId) {
      query.andWhere('request.propertyId = :propertyId', { propertyId });
    }

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    if (pagination?.after) {
      query.andWhere('request.createdAt < :after', { 
        after: new Date(Buffer.from(pagination.after, 'base64').toString()) 
      });
    }

    query.orderBy('request.createdAt', 'DESC');

    const limit = (pagination?.first || 10) + 1;
    query.take(limit);

    const [items, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      totalCount,
      pagination?.first || 10,
      (item) => Buffer.from(item.createdAt.toISOString()).toString('base64')
    );
  }

  async create(userId: string, input: CreateMaintenanceRequestInput): Promise<MaintenanceRequest> {
    const request = this.maintenanceRequestRepository.create({
      ...input,
      userId,
      status: MaintenanceRequestStatus.PENDING
    });
    const savedRequest = await this.maintenanceRequestRepository.save(request);
    return {
        id: savedRequest.id,
        propertyId: savedRequest.propertyId,
        userId: savedRequest.userId,
        urgency: savedRequest.urgency,
        description: savedRequest.description,
        status: savedRequest.status,
        comments: [],
        photos: [],
        property: null as unknown as PropertyEntity,
        user: null as unknown as UserEntity,
        createdAt: savedRequest.createdAt,
        updatedAt: savedRequest.updatedAt
    };
  }

  async update(id: string, input: UpdateMaintenanceRequestInput): Promise<MaintenanceRequest> {
    const request = await this.findById(id);
    Object.assign(request, input);
    return this.maintenanceRequestRepository.save(request);
  }

  async addComment(user: UserEntity, input: CreateMaintenanceCommentInput): Promise<MaintenanceComment> {
    const request = await this.findById(input.maintenanceRequestId, ['property']);
    if (!(await userHasAccessToResource(user, request))) {
      throw new ForbiddenException('You are not allowed to add a comment to this maintenance request');
    }
    const comment = this.maintenanceCommentRepository.create({
      ...input,
      userId: user.id
    });

    this.logger.log('Adding comment', JSON.stringify({ comment, requestId: input.maintenanceRequestId, userId: user.id }));
    this.eventEmitter.emit(EVENTS.MAINTENANCE_COMMENT_CREATE, {
      comment,
      requestId: input.maintenanceRequestId,
      userId: user.id
    });
    return this.maintenanceCommentRepository.save(comment);
  }

  async addImage(input: CreateMaintenanceImageInput): Promise<MaintenanceImage> {
    const request = await this.findById(input.maintenanceRequestId);
    const image = this.maintenanceImageRepository.create(input);
    return this.maintenanceImageRepository.save(image);
  }

  async getProperty(propertyId: string) {
    return this.propertyService.findById(propertyId);
  }

  async getUser(userId: string) {
    return this.userService.findById(userId);
  }

  async findCommentsByRequestId(requestId: string, pagination?: PaginationInput): Promise<Connection<MaintenanceComment>> {
    const query = this.maintenanceCommentRepository.createQueryBuilder('comment')
      .where('comment.maintenanceRequestId = :requestId', { requestId });

    if (pagination?.after) {
      query.andWhere('comment.createdAt < :after', {
        after: new Date(Buffer.from(pagination.after, 'base64').toString())
      });
    }

    query.orderBy('comment.createdAt', 'DESC');

    const limit = (pagination?.first || 10) + 1;
    query.take(limit);

    const [items, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      totalCount,
      pagination?.first || 10,
      (item) => Buffer.from(item.createdAt.toISOString()).toString('base64')
    );
  }

  async findImagesByRequestId(requestId: string, pagination?: PaginationInput): Promise<Connection<MaintenanceImage>> {
    const query = this.maintenanceImageRepository.createQueryBuilder('image')
      .where('image.maintenanceRequestId = :requestId', { requestId });

    if (pagination?.after) {
      query.andWhere('image.createdAt < :after', {
        after: new Date(Buffer.from(pagination.after, 'base64').toString())
      });
    }

    query.orderBy('image.createdAt', 'DESC');

    const limit = (pagination?.first || 10) + 1;
    query.take(limit);

    const [items, totalCount] = await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      totalCount,
      pagination?.first || 10,
      (item) => Buffer.from(item.createdAt.toISOString()).toString('base64')
    );
  }

  async getComments(requestId: string, pagination?: PaginationInput): Promise<Connection<MaintenanceComment>> {
    return this.findCommentsByRequestId(requestId, pagination);
  }

  async getImages(requestId: string, pagination?: PaginationInput): Promise<Connection<MaintenanceImage>> {
    return this.findImagesByRequestId(requestId, pagination);
  }

  async getKPIsByOrganizationId(organizationId: string) {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const stats = await this.maintenanceRequestRepository
      .createQueryBuilder('request')
      .innerJoin('properties', 'property', 'property.id = request.property_id')
      .select([
        // Current Month Stats
        'COUNT(CASE WHEN request.createdAt BETWEEN :currentMonthStart AND :currentMonthEnd THEN 1 END) as "totalCurrentMonthMaintenanceRequests"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :currentMonthStart AND :currentMonthEnd AND request.status = :completed THEN 1 END) as "totalCurrentMonthMaintenanceRequestsCompleted"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :currentMonthStart AND :currentMonthEnd AND request.status = :pending THEN 1 END) as "totalCurrentMonthMaintenanceRequestsPending"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :currentMonthStart AND :currentMonthEnd AND request.status = :inProgress THEN 1 END) as "totalCurrentMonthMaintenanceRequestsInProgress"',
        
        // Previous Month Stats
        'COUNT(CASE WHEN request.createdAt BETWEEN :previousMonthStart AND :previousMonthEnd THEN 1 END) as "totalPreviousMonthMaintenanceRequests"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :previousMonthStart AND :previousMonthEnd AND request.status = :completed THEN 1 END) as "totalPreviousMonthMaintenanceRequestsCompleted"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :previousMonthStart AND :previousMonthEnd AND request.status = :pending THEN 1 END) as "totalPreviousMonthMaintenanceRequestsPending"',
        'COUNT(CASE WHEN request.createdAt BETWEEN :previousMonthStart AND :previousMonthEnd AND request.status = :inProgress THEN 1 END) as "totalPreviousMonthMaintenanceRequestsInProgress"'
      ])
      .where('property.organization_id = :organizationId', { organizationId })
      .setParameters({
        currentMonthStart,
        currentMonthEnd,
        previousMonthStart,
        previousMonthEnd,
        completed: MaintenanceRequestStatus.COMPLETED,
        pending: MaintenanceRequestStatus.PENDING,
        inProgress: MaintenanceRequestStatus.IN_PROGRESS
      })
      .getRawOne();

    // Convert string values to numbers
    return {
      totalCurrentMonthMaintenanceRequests: parseInt(stats.totalCurrentMonthMaintenanceRequests) || 0,
      totalCurrentMonthMaintenanceRequestsCompleted: parseInt(stats.totalCurrentMonthMaintenanceRequestsCompleted) || 0,
      totalCurrentMonthMaintenanceRequestsPending: parseInt(stats.totalCurrentMonthMaintenanceRequestsPending) || 0,
      totalCurrentMonthMaintenanceRequestsInProgress: parseInt(stats.totalCurrentMonthMaintenanceRequestsInProgress) || 0,
      totalPreviousMonthMaintenanceRequests: parseInt(stats.totalPreviousMonthMaintenanceRequests) || 0,
      totalPreviousMonthMaintenanceRequestsCompleted: parseInt(stats.totalPreviousMonthMaintenanceRequestsCompleted) || 0,
      totalPreviousMonthMaintenanceRequestsPending: parseInt(stats.totalPreviousMonthMaintenanceRequestsPending) || 0,
      totalPreviousMonthMaintenanceRequestsInProgress: parseInt(stats.totalPreviousMonthMaintenanceRequestsInProgress) || 0
    };
  }
  
}

// Utility functions
function toCursor(date: string): string {
  return Buffer.from(date).toString('base64');
}

function fromCursor(cursor: string): Date {
  return new Date(Buffer.from(cursor, 'base64').toString());
}
