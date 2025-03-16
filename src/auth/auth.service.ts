import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthResponse, LoginInput, SignupInput } from '../graphql';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' }  // Short-lived access token
    );
    
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' }   // Longer-lived refresh token
    );

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const tokens = this.generateTokens(user.id);
    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async signup(signupInput: SignupInput) {
    this.logger.log('Signing up', 'AuthService');

    // Check if user exists
    const existingUser = await this.userService.findByEmail(signupInput.email);
    if (existingUser) {
      this.logger.log('User already exists', 'AuthService');
      throw new ConflictException('User already exists');
    }
    this.logger.log('User does not exist', 'AuthService');

    // Hash password
    this.logger.log('Hashing password', 'AuthService');
    const hashedPassword = await bcrypt.hash(signupInput.password, 10);

    // Create new user
    this.logger.log('Creating new user', 'AuthService');
    const user = await this.userService.create({
      ...signupInput,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user.id);
    return {
      ...tokens,
      user,
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.generateTokens(user.id);
      return {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 