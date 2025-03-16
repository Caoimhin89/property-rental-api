import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await resolver.user('1');
      expect(result).toEqual(mockUser);
      expect(userService.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      const result = await resolver.user('999');
      expect(result).toBeNull();
      expect(userService.findById).toHaveBeenCalledWith('999');
    });
  });
}); 