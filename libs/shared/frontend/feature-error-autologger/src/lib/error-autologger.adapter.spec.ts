import { ErrorAdapter } from './error-autologger.adapter';

describe('ErrorAdapter', () => {
  let adapter: ErrorAdapter;

  beforeEach(() => {
    adapter = new ErrorAdapter();
  });

  describe('Error instance handling', () => {
    it('should adapt Error instance with message, stack, and context', () => {
      const error = new Error('Test error message');
      const context = { userId: '123' };
      const result = adapter.adapt(error, context);

      expect(result.message).toBe('Test error message');
      expect(result.originalError).toBe(error);
      expect(result.stack).toBeDefined();
      expect(result.context).toEqual(context);
    });
  });

  describe('string error handling', () => {
    it('should adapt string error with context', () => {
      const context = { source: 'api' };
      const result = adapter.adapt('Something went wrong', context);

      expect(result.message).toBe('Something went wrong');
      expect(result.originalError).toBe('Something went wrong');
      expect(result.context).toEqual(context);
    });
  });

  describe('RTK fetch error handling', () => {
    it('should extract message from error property', () => {
      const rtkError = {
        status: 'FETCH_ERROR',
        error: 'TypeError: Failed to fetch',
      };
      const result = adapter.adapt(rtkError);

      expect(result.message).toBe('TypeError: Failed to fetch');
      expect(result.context?.status).toBe('FETCH_ERROR');
    });

    it('should extract message from data.message', () => {
      const rtkError = {
        status: 400,
        data: { message: 'Bad request' },
      };
      const result = adapter.adapt(rtkError);

      expect(result.message).toBe('Bad request');
      expect(result.context?.status).toBe(400);
    });

    it('should extract message from string data', () => {
      const rtkError = {
        status: 500,
        data: 'Internal server error',
      };
      const result = adapter.adapt(rtkError);

      expect(result.message).toBe('Internal server error');
    });

    it('should generate message from numeric status code', () => {
      const result = adapter.adapt({ status: 404 });
      expect(result.message).toBe('Request failed with status 404');
    });

    it('should fallback to default message for non-numeric status', () => {
      const result = adapter.adapt({ status: 'CUSTOM_ERROR' });
      expect(result.message).toBe('Request failed');
    });
  });

  describe('serialized error handling', () => {
    it('should adapt error with name and message', () => {
      const serializedError = {
        name: 'TypeError',
        message: 'Cannot read property of undefined',
      };
      const result = adapter.adapt(serializedError);

      expect(result.message).toBe('Cannot read property of undefined');
      expect(result.context?.name).toBe('TypeError');
    });

    it('should adapt error with code and include stack', () => {
      const serializedError = {
        code: 'ERR_NETWORK',
        message: 'Network error',
        stack: 'Error: Test\n    at test.js:1:1',
      };
      const result = adapter.adapt(serializedError);

      expect(result.message).toBe('Network error');
      expect(result.context?.code).toBe('ERR_NETWORK');
      expect(result.stack).toBe('Error: Test\n    at test.js:1:1');
    });

    it('should fallback to name when message is missing', () => {
      const result = adapter.adapt({ name: 'CustomError' });
      expect(result.message).toBe('CustomError');
    });
  });

  describe('generic object with message', () => {
    it('should adapt object with message property', () => {
      const error = { message: 'Custom error message', extra: 'data' };
      const result = adapter.adapt(error);

      expect(result.message).toBe('Custom error message');
      expect(result.originalError).toEqual(error);
    });
  });

  describe('unknown error handling', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['number', 500],
      ['empty object', {}],
    ])('should return default message for %s', (_, input) => {
      const result = adapter.adapt(input);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.originalError).toBe(input);
    });
  });
});
