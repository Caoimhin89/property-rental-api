import { Args, Mutation, Parent, Query, ResolveField, Resolver, Root } from '@nestjs/graphql';
import {
    Organization, UpdateOrganizationInput,
    OrganizationFilter, CreateOrganizationInput,
    OrganizationMember, PaginationInput
} from '../graphql';
import { OrganizationService } from './organization.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Res, UseGuards } from '@nestjs/common';
import { Organization as OrganizationEntity } from './entities/organization.entity';
import { OrganizationMember as OrganizationMemberEntity } from './entities/organization-member.entity';
import { DataLoaderService } from '../data-loader/data-loader.service';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';

@Resolver('Organization')
export class OrganizationResolver {
    constructor(
        private readonly organizationService: OrganizationService,
        private readonly dataLoader: DataLoaderService,
        private readonly propertyService: PropertyService,
        private readonly userService: UserService
    ) { }

    @Query(() => Organization)
    async organization(@Args('id') id: string) {
        return this.organizationService.findById(id);
    }

    @Query(() => [Organization])
    async organizations(
        @Args('filter', { nullable: true }) filter: OrganizationFilter,
        @Args('after', { nullable: true }) after: string,
        @Args('before', { nullable: true }) before: string,
        @Args('first', { nullable: true }) first: number,
        @Args('last', { nullable: true }) last: number
    ) {
        return this.organizationService.findAll({ filter, after, before, first, last });
    }

    @Query(() => [Organization])
    async myOrganizations(@CurrentUser() user: User) {
        return this.organizationService.findByUserId(user.id);
    }

    @Query(() => [Organization])
    @UseGuards(JwtAuthGuard)
    async organizationKPIs(@Args('organizationId') organizationId: string) {
        return this.dataLoader.organizationKPIsLoader.load(organizationId);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Organization)
    async createOrganization(
        @Args('input') input: CreateOrganizationInput,
        @CurrentUser() user: User
    ) {
        return this.organizationService.create(input, user);
    }

    @Mutation(() => Organization)
    async updateOrganization(@Args('id') id: string, @Args('input') input: UpdateOrganizationInput) {
        return this.organizationService.update(id, input);
    }

    @ResolveField()
    async primaryUser(@Parent() organization: OrganizationEntity) {
        const ownerMembership = await this.organizationService.getPrimaryUser(organization.id);
        if (!ownerMembership) {
            return null;
        }
        return ownerMembership;
    }

    @ResolveField()
    async members(@Parent() organization: OrganizationEntity) {
        return this.organizationService.findMembers(organization.id);
    }

    @ResolveField()
    async properties(
        @Parent() organization: Organization,
        @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    ) {
        const connection = await this.dataLoader.organizationPropertiesLoader
            .load(organization.id, { after: pagination?.after, before: pagination?.before, first: pagination?.first, last: pagination?.last });
        
        return {
            ...connection,
            edges: connection.edges.length > 0 ? connection.edges.map(edge => ({
                ...edge,
                node: this.propertyService.toGraphQL(edge.node)
            })) : [],
            totalCount: connection.totalCount || 0
        };
    }

    @ResolveField()
    async kpis(@Parent() organization: Organization) {
        return this.dataLoader.organizationKPIsLoader.load(organization.id);
    }
}