import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { BookingConnection, CreateUserInput, MaintenanceRequestConnection, OrganizationType, PaginationInput, User as UserType } from '../graphql';
import { toCursor } from 'common/utils';
import { ClientKafka } from '@nestjs/microservices';
import { generateVerificationCode } from '@crispengari/random-verification-codes';
interface UserEntityConnection {
  edges: {
    cursor: string;
    node: User;
  }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const userInput = {
      ...input,
      verificationToken: await generateVerificationCode(5, true, true) as string,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    const user = this.userRepository.create(userInput);
    await this.userRepository.save(user);

    // Emit user registered event to Kafka
    await this.kafkaClient.emit('user.registered', {
      key: user.id,
      value: user,
      headers: {
        timestamp: new Date().toISOString(),
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByIdWithOrganizationMembership(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id }, relations: ['organizationMembership'] });
  }

  async findAll({ pagination }: { pagination?: PaginationInput }): Promise<UserEntityConnection> {
    const qb = this.userRepository.createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC');

    if (pagination?.after) {
      qb.andWhere(
        'user.created_at < (SELECT created_at FROM users WHERE id = :after)',
        { after: pagination.after }
      );
    }

    if (pagination?.before) {
      qb.andWhere(
        'user.created_at > (SELECT created_at FROM users WHERE id = :before)',
        { before: pagination.before }
      );
    }

    const [users, totalCount] = await qb.getManyAndCount();

    return this.createUserConnection(users, totalCount, pagination);
  }

  async findByOrganizationId(organizationId: string) {
    const qb = this.userRepository.createQueryBuilder('user')
      .innerJoin('organization_members', 'member', 'member.user_id = user.id')
      .where('member.organization_id = :organizationId', { organizationId })
      .orderBy('member.created_at', 'DESC');

    const users = await qb.getMany();
    return users || [];
  }

  toGraphQL(user: User): UserType {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      maintenanceRequests: null as unknown as MaintenanceRequestConnection,
      bookings: null as unknown as BookingConnection,
    };
  }

  private createUserConnection(users: User[], totalCount: number, pagination?: PaginationInput) {
    const { first, last } = pagination || { first: undefined, last: undefined };
    let hasNextPage = false;
    let hasPreviousPage = false;
    let resultUsers = [...users];

    if (first && users.length > first) {
      hasNextPage = true;
      resultUsers = users.slice(0, first);
    } else if (last && users.length > last) {
      hasPreviousPage = true;
      resultUsers = users.slice(-last);
    }

    const edges = resultUsers.map(user => ({
      cursor: toCursor(user.id),
      node: user
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null
      },
      totalCount: totalCount,
    };
  }
}