import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('getRequest', () => {
    it('should extract request from GQL context', () => {
      const mockRequest = { headers: {} };
      const mockGqlContext = {
        getContext: jest.fn().mockReturnValue({ req: mockRequest }),
      };

      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

      class TestClass {}
      
      const context = {
        getType: () => 'graphql',
        getArgs: () => [],
        getContext: () => ({ req: mockRequest }),
        getHandler: () => function() {},
        getClass: () => TestClass,
        switchToRpc: () => ({ getData: () => ({}), getContext: () => ({}) }),
        switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}), getNext: () => ({}) }),
        switchToWs: () => ({ getClient: () => ({}), getData: () => ({}), getPattern: () => '' }),
        getArgByIndex: () => ({}),
      } as ExecutionContext;

      const request = guard.getRequest(context);
      expect(request).toBe(mockRequest);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(context);
    });
  });
}); 