import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      const result = await service.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      mockRepository.create.mockReturnValue({
        ...mockUser,
        ...createUserDto,
      });
      
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        ...createUserDto,
      });

      const result = await service.create(createUserDto);
      
      expect(result).toEqual({
        ...mockUser,
        ...createUserDto,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
}); 