import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization as OrganizationEntity } from './entities/organization.entity';
import { OrganizationMember as OrganizationMemberEntity } from './entities/organization-member.entity';
import { CreateOrganizationInput, OrganizationFilter, OrganizationRole, UpdateOrganizationInput } from '../graphql';
import { User } from '../user/entities/user.entity';
import { toCursor } from 'common/utils';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationMemberEntity)
    private organizationMemberRepository: Repository<OrganizationMemberEntity>,
  ) {}

  async create(input: CreateOrganizationInput, user: User): Promise<OrganizationEntity> {

    const organization = this.organizationRepository.create({
      name: input.name,
      organizationType: input.organizationType,
      primaryUser: { id: input.primaryUserId || user.id },
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
    const { primaryUser: _, ...createdOrganization } = savedOrganization;

    return createdOrganization;
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<OrganizationEntity> {
    const organization = await this.findById(id);
    organization.name = input.name ? input.name : organization.name;
    organization.organizationType = input.organizationType ? input.organizationType : organization.organizationType;
    return this.organizationRepository.save(organization);
  }

  async findAll({ filter, after, before, first, last }: { 
    filter?: OrganizationFilter;
    after?: string;
    before?: string;
    first?: number;
    last?: number;
  }) {
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
    return this.createOrganizationConnection(organizations || [], { first, last });
  }

  async findById(id: string): Promise<OrganizationEntity> {
    return this.organizationRepository.findOneOrFail({ 
      where: { id },
      relations: ['primaryUser']
    });
  }

  async findByUserId(userId: string): Promise<OrganizationEntity[]> {
    return this.organizationRepository
      .createQueryBuilder('organization')
      .innerJoin('organization.members', 'member')
      .where('member.user_id = :userId', { userId })
      .getMany();
  }

  async addMember(organizationId: string, userId: string, role: OrganizationRole): Promise<OrganizationMemberEntity> {
    const membership = this.organizationMemberRepository.create({
      organization: { id: organizationId },
      user: { id: userId },
      role,
    });

    return this.organizationMemberRepository.save(membership);
  }

  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    const result = await this.organizationMemberRepository.delete({
      organization: { id: organizationId },
      user: { id: userId },
    });

    return result?.affected ? result.affected > 0 : false;
  }

  async updateMemberRole(organizationId: string, userId: string, role: OrganizationRole): Promise<OrganizationMemberEntity> {
    await this.organizationMemberRepository.update(
      {
        organization: { id: organizationId },
        user: { id: userId },
      },
      { role }
    );

    return this.organizationMemberRepository.findOneOrFail({
      where: {
        organization: { id: organizationId },
        user: { id: userId },
      },
    });
  }

  async findMembers(organizationId: string): Promise<OrganizationMemberEntity[]> {
    return this.organizationMemberRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['user'],
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
}
