import { Resolver, Query, Mutation, Args, ResolveField, Parent, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRequest as MaintenanceRequestEntity } from './entities/maintenance-request.entity';
import {
    MaintenanceRequest as MaintenanceRequestType,
    MaintenanceComment as MaintenanceCommentType,
    MaintenanceImage as MaintenanceImageType,
    User as UserType,
    Property as PropertyType,
    PaginationInput,
    CreateMaintenanceCommentInput,
    CreateMaintenanceImageInput,
    CreateMaintenanceRequestInput,
    UpdateMaintenanceRequestInput,
    MaintenanceCommentConnection,
    MaintenanceImageConnection } from '../graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User as UserEntity } from '../user/entities/user.entity';

@Resolver(() => MaintenanceRequestType)
export class MaintenanceResolver {
  constructor(private maintenanceService: MaintenanceService) {}

  @Query(() => MaintenanceRequestType, { nullable: true })
  async maintenanceRequest(
    @Args('id', { type: () => ID }) id: string
  ) {
    return this.maintenanceService.findById(id);
  }

  @Query(() => MaintenanceRequestType)
  async maintenanceRequests(
    @Args('propertyId', { type: () => ID, nullable: true }) propertyId?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.findAll({ propertyId, status, pagination });
  }

  @Mutation(() => MaintenanceRequestType)
  @UseGuards(JwtAuthGuard)
  async createMaintenanceRequest(
    @Args('input') input: CreateMaintenanceRequestInput,
    @CurrentUser() user: UserEntity
  ) {
    return this.maintenanceService.create(user.id, input);
  }

  @Mutation(() => MaintenanceRequestType)
  @UseGuards(JwtAuthGuard)
  async updateMaintenanceRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateMaintenanceRequestInput
  ) {
    return this.maintenanceService.update(id, input);
  }

  @Mutation(() => MaintenanceCommentType)
  @UseGuards(JwtAuthGuard)
  async addMaintenanceComment(
    @Args('input') input: CreateMaintenanceCommentInput,
    @CurrentUser() user: UserEntity
  ) {
    return this.maintenanceService.addComment(user, input);
  }

  @Mutation(() => MaintenanceImageType)
  @UseGuards(JwtAuthGuard)
  async addMaintenanceImage(
    @Args('input') input: CreateMaintenanceImageInput
  ) {
    return this.maintenanceService.addImage(input);
  }

  @ResolveField(() => PropertyType)
  async property(@Parent() request: MaintenanceRequestEntity) {
    return this.maintenanceService.getProperty(request.propertyId);
  }

  @ResolveField(() => UserType)
  async user(@Parent() request: MaintenanceRequestEntity) {
    return this.maintenanceService.getUser(request.userId);
  }

  @ResolveField(() => MaintenanceCommentConnection)
  async comments(
    @Parent() request: MaintenanceRequestEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.getComments(request.id, pagination);
  }

  @ResolveField(() => MaintenanceImageConnection)
  async photos(
    @Parent() request: MaintenanceRequestEntity,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ) {
    return this.maintenanceService.getImages(request.id, pagination);
  }
}
