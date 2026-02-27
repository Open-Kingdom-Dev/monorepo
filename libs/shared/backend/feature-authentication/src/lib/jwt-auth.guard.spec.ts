import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  it('lets anyone access routes marked as public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('requires a valid token for routes that are not public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const parentCheck = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(mockExecutionContext);

    expect(parentCheck).toHaveBeenCalledWith(mockExecutionContext);
    parentCheck.mockRestore();
  });
});
