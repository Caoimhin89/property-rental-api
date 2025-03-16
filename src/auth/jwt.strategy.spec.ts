import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../user/user.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: UserService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);
  });

  describe('validate', () => {
    it('should return user if token payload is valid', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: '1' });
      expect(result).toEqual(mockUser);
      expect(userService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      await expect(strategy.validate({ sub: '999' })).rejects.toThrow();
      expect(userService.findById).toHaveBeenCalledWith('999');
    });
  });
}); 