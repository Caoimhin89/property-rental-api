import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { MaintenanceComment as MaintenanceCommentType } from '../graphql';
import { MaintenanceComment } from './entities/maintenance-comment.entity';
import { UserService } from '../user/user.service';

@Resolver(() => MaintenanceCommentType)
export class MaintenanceCommentResolver {
  constructor(private userService: UserService) {}

  @ResolveField('user')
  async user(@Parent() comment: MaintenanceComment) {
    return this.userService.findById(comment.userId);
  }
} 