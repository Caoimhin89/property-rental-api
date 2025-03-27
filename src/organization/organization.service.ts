import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization as OrganizationEntity } from './entities/organization.entity';
import { OrganizationMember as OrganizationMemberEntity } from './entities/organization-member.entity';
import { CreateOrganizationInput, OrganizationFilter, OrganizationRole, UpdateOrganizationInput } from '../graphql';
import { User } from '../user/entities/user.entity';
import { toCursor } from 'common/utils';
import { LoggerService } from '../common/services/logger.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheSetEvent, CacheInvalidateEvent } from '../cache/cache.events';

@Injectable()
export class OrganizationService {
  private readonly NAMESPACE = 'organization';
  private readonly TTL = 60000 * 5; // 5 minutes

  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private organizationMemberRepository: Repository<OrganizationMemberEntity>,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(input: CreateOrganizationInput, user: User): Promise<OrganizationEntity> {
    const organization = this.organizationRepository.create({
      name: input.name,
      organizationType: input.organizationType,
      members: [{ id: user.id, role: OrganizationRole.OWNER }],
    });

    const savedOrganization = await this.organizationRepository.save(organization);

    // Create owner membership for the creating user
    const membership = this.organizationMemberRepository.create({
      organization: { id: savedOrganization.id },
      user,
      role: OrganizationRole.OWNER,
    });
    await this.organizationMemberRepository.save(membership);

    this.logger.log('Organization created', 'OrganizationService', { 
      organizationType: savedOrganization.organizationType,
      organizationId: savedOrganization.id 
    });

    // Invalidate list cache
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      'list:*'
    ));

    return savedOrganization;
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<OrganizationEntity> {
    const organization = await this.findById(id);
    organization.name = input.name ? input.name : organization.name;
    organization.organizationType = input.organizationType ? input.organizationType : organization.organizationType;
    const updatedOrganization = await this.organizationRepository.save(organization);
    
    // Invalidate both single and list caches
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      'list:*'
    ));
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      `single:${id}`
    ));
    
    return updatedOrganization;
  }

  async findAll({ filter, after, before, first, last }: { 
    filter?: OrganizationFilter;
    after?: string;
    before?: string;
    first?: number;
    last?: number;
  }) {
    const cacheKey = this.cacheService.generateCacheKey('list', { filter, after, before, first, last });
    
    // Try cache first
    const cached = await this.cacheService.get<any>(this.NAMESPACE, cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', 'OrganizationService', { cacheKey });
      return cached;
    }

    const qb = this.organizationRepository.createQueryBuilder('organization')
      .orderBy('organization.created_at', 'DESC');

    if (filter?.search) {
      qb.andWhere('organization.name ILIKE :search', { search: `%${filter.search}%` });
    }

    if (after) {
      qb.andWhere('organization.created_at < (SELECT created_at FROM organizations WHERE id = :after)', { after });
    }

    if (before) {
      qb.andWhere('organization.created_at > (SELECT created_at FROM organizations WHERE id = :before)', { before });
    }

    const organizations = await qb.getMany();
    const connection = this.createOrganizationConnection(organizations || [], { first, last });

    // Cache the result asynchronously
    this.eventEmitter.emit('cache.set', new CacheSetEvent(
      this.NAMESPACE,
      cacheKey,
      connection,
      this.TTL
    ));

    return connection;
  }

  async findById(id: string): Promise<OrganizationEntity> {
    const cacheKey = this.cacheService.generateCacheKey('single', id);
    
    // Try cache first
    const cached = await this.cacheService.get<OrganizationEntity>(this.NAMESPACE, cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', 'OrganizationService', { cacheKey });
      return cached;
    }

    const organization = await this.organizationRepository.findOneOrFail({ 
      where: { id },
    });

    // Cache the result asynchronously
    this.eventEmitter.emit('cache.set', new CacheSetEvent(
      this.NAMESPACE,
      cacheKey,
      organization,
      this.TTL
    ));

    return organization;
  }

  async findByUserId(userId: string): Promise<OrganizationEntity | null> {
    return this.organizationRepository
      .createQueryBuilder('organization')
      .innerJoin('organization.members', 'member')
      .where('member.user_id = :userId', { userId })
      .getOne();
  }

  async getPrimaryUser(organizationId: string): Promise<OrganizationMemberEntity | null> {
    return this.organizationMemberRepository
      .createQueryBuilder('organization_member')
      .where('organization_member.organization_id = :organizationId', { organizationId })
      .andWhere('organization_member.role = :role', { role: OrganizationRole.OWNER })
      .getOne();
  }
  

  async addMember(organizationId: string, userId: string, role: OrganizationRole): Promise<OrganizationMemberEntity> {
    const membership = await this.organizationMemberRepository.save(
      this.organizationMemberRepository.create({
        organization: { id: organizationId },
        user: { id: userId },
        role,
      })
    );

    // Invalidate organization caches
    this.invalidateOrganizationCache(organizationId);

    return membership;
  }

  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    const result = await this.organizationMemberRepository.delete({
      organization: { id: organizationId },
      user: { id: userId },
    });

    // Invalidate organization caches
    this.invalidateOrganizationCache(organizationId);

    return result?.affected ? result.affected > 0 : false;
  }

  async updateMemberRole(organizationId: string, userId: string, role: OrganizationRole): Promise<OrganizationMemberEntity> {
    const membership = await this.organizationMemberRepository.findOneOrFail({
      where: {
        organization: { id: organizationId },
        user: { id: userId },
      },
    });

    membership.role = role;
    const updated = await this.organizationMemberRepository.save(membership);

    // Invalidate organization caches
    this.invalidateOrganizationCache(organizationId);

    return updated;
  }

  async findMembers(organizationId: string): Promise<OrganizationMemberEntity[]> {
    return this.organizationMemberRepository.find({
      where: { organization: { id: organizationId } },
    });
  }

  private createOrganizationConnection(organizations: OrganizationEntity[], { first, last }: { first?: number, last?: number }) {
    let hasNextPage = false;
    let hasPreviousPage = false;
    let resultOrganizations = [...organizations];
  
    if (first && organizations.length > first) {
      hasNextPage = true;
      resultOrganizations = organizations.slice(0, first);
    } else if (last && organizations.length > last) {
      hasPreviousPage = true;
      resultOrganizations = organizations.slice(-last);
    }
  
    const edges = resultOrganizations.map(org => ({
      cursor: toCursor(org.id),
      node: org
    }));
  
    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount: organizations.length,
    };
  }

  // Helper method for cache invalidation
  private invalidateOrganizationCache(organizationId: string) {
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      `single:${organizationId}`
    ));
    this.eventEmitter.emit('cache.invalidate', new CacheInvalidateEvent(
      this.NAMESPACE,
      'list:*'
    ));
  }
}
