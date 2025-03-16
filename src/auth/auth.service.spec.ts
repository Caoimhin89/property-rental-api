import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// Create mock functions
const mockCompare = jest.fn();
const mockHash = jest.fn();

// Mock the entire bcrypt module
jest.mock('bcrypt', () => ({
  compare: (...args) => mockCompare(...args),
  hash: (...args) => mockHash(...args),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
  };

  const mockToken = 'jwt-token';

  beforeEach(async () => {
    // Reset all mocks before each test
    mockCompare.mockReset();
    mockHash.mockReset();
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue('hashedPassword');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user without password if validation succeeds', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      mockCompare.mockResolvedValueOnce(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockCompare).toHaveBeenCalledWith('password', mockUser.password);
      expect(result).toEqual(userWithoutPassword);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      mockCompare.mockResolvedValueOnce(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token and user', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login({ email: mockUser.email, password: 'password123' });

      expect(result).toEqual({
        token: mockToken,
        user: mockUser,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id });
    });
  });

  describe('signup', () => {
    const signupInput = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(service.signup(signupInput)).rejects.toThrow(ConflictException);
    });

    it('should create new user and return token', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userService, 'create').mockResolvedValue({
        ...mockUser,
        email: signupInput.email,
        name: signupInput.name,
      });

      const result = await service.signup(signupInput);

      expect(result).toEqual({
        token: 'test-token',
        user: expect.objectContaining({
          email: signupInput.email,
          name: signupInput.name,
        }),
      });
      expect(userService.create).toHaveBeenCalledWith({
        ...signupInput,
        password: 'hashedPassword',
      });
    });
  });
}); 