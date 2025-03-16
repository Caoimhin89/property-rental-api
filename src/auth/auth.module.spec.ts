import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthModule', () => {
  let module: TestingModule;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        UserModule,
        AuthModule,
      ],
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue(mockUserRepository)
    .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should export AuthService', () => {
    const authService = module.get(AuthService);
    expect(authService).toBeDefined();
  });
}); 