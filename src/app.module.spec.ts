import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { DatabaseModule } from './database/database.module';
import { GraphQLModule } from '@nestjs/graphql';

describe('AppModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(DatabaseModule)).toBeDefined();
    expect(module.get(GraphQLModule)).toBeDefined();
  });

  it('should configure GraphQL correctly', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const gqlModule = module.get<GraphQLModule>(GraphQLModule);
    expect(gqlModule).toBeDefined();
  });
}); 