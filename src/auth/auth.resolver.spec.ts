import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthService = {
    login: jest.fn(),
    signup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return auth token', async () => {
      const loginInput = { email: 'test@example.com', password: 'password123' };
      const expectedResult = { token: 'jwt-token', user: mockUser };
      
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await resolver.login(loginInput);
      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginInput);
    });
  });

  describe('signup', () => {
    it('should create new user and return auth token', async () => {
      const signupInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const expectedResult = { token: 'jwt-token', user: mockUser };
      
      mockAuthService.signup.mockResolvedValue(expectedResult);

      const result = await resolver.signup(signupInput);
      expect(result).toEqual(expectedResult);
      expect(authService.signup).toHaveBeenCalledWith(signupInput);
    });
  });
}); 