import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { MaintenanceComment as MaintenanceCommentType } from '../graphql';
import { MaintenanceComment } from './entities/maintenance-comment.entity';
import { UserService } from '../user/user.service';
import { MaintenanceService } from './maintenance.service';

@Resolver(() => MaintenanceCommentType)
export class MaintenanceCommentResolver {
  constructor(
    private userService: UserService,
    private maintenanceService: MaintenanceService) {}

  @ResolveField('user')
  async user(@Parent() comment: MaintenanceComment) {
    return this.userService.findById(comment.userId);
  }

  @ResolveField('maintenanceRequest')
  async maintenanceRequest(@Parent() comment: MaintenanceComment) {
    return this.maintenanceService.findById(comment.maintenanceRequestId);
  }
} 