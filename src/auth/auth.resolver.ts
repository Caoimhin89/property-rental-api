import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResponse, LoginInput, SignupInput } from '../graphql';
import { DataLoaderService } from '../data-loader/data-loader.service';

@Resolver(AuthResponse)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly dataLoaderService: DataLoaderService
  ) {}

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Mutation(() => AuthResponse)
  async signup(@Args('input') input: SignupInput) {
    const authResponse = await this.authService.signup(input);
    return {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      user: {
        id: authResponse.user.id,
      },
    };
  }

  @Mutation(() => AuthResponse)
  async refreshToken(@Args('token') token: string): Promise<AuthResponse> {
    return this.authService.refreshToken(token);
  }

  @ResolveField()
  async user(@Parent() auth: AuthResponse) {
    return this.dataLoaderService.usersLoader.load(auth.user.id);
  }
} 