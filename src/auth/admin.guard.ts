import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    console.log('user', user);
    
    return (user?.role === 'ADMIN'
      || (user?.organizationMembership?.role === 'OWNER'
        || user?.organizationMembership?.role === 'MEMBER'));
  }
} 