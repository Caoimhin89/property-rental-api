import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { OrganizationMember as OrganizationMemberEntity } from './entities/organization-member.entity';
import { UserService } from '../user/user.service';
import { OrganizationService } from './organization.service';

@Resolver('OrganizationMember')
export class OrganizationMemberResolver {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  @ResolveField()
  async user(@Parent() organizationMember: OrganizationMemberEntity) {
    return this.userService.findById(organizationMember.userId);
  }

  @ResolveField()
  async organization(@Parent() organizationMember: OrganizationMemberEntity) {
    return this.organizationService.findById(organizationMember.organizationId);
  }
} 