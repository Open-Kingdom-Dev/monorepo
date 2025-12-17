import axios, { AxiosHeaders, AxiosRequestConfig } from 'axios';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { createAxiosBaseQuery } from './baseQuery.js';

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: jest.fn(),
    AxiosHeaders: jest.requireActual('axios').AxiosHeaders,
  };
});

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('createAxiosBaseQuery', () => {
  const abortController = new AbortController();
  const mockApi: BaseQueryApi = {
    signal: abortController.signal,
    abort: jest.fn(),
    getState: jest.fn(),
    dispatch: jest.fn(),
    extra: undefined,
    endpoint: '',
    type: 'query',
    forced: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('making requests', () => {
    it('sends GET request to the correct URL', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { result: 'ok' },
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      await baseQuery({ url: '/users' }, mockApi, {});

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/users',
          baseURL: 'https://api.example.com',
          method: 'GET',
        })
      );
    });

    it('sends request body as data', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {},
        status: 201,
        headers: {},
        config: {},
        statusText: 'Created',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      await baseQuery(
        { url: '/users', method: 'POST', body: { name: 'John' } },
        mockApi,
        {}
      );

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'John' },
        })
      );
    });

    it('supports request cancellation', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {},
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      await baseQuery({ url: '/users' }, mockApi, {});

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: mockApi.signal,
        })
      );
    });
  });

  describe('preparing headers', () => {
    it('applies custom headers via prepareHeaders', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {},
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
        prepareHeaders: (headers: AxiosHeaders) => {
          headers.set('X-Custom', 'value');
          return headers;
        },
      });
      await baseQuery({ url: '/users' }, mockApi, {});

      const callArgs = mockedAxios.mock
        .calls[0][0] as unknown as AxiosRequestConfig;
      expect((callArgs.headers as AxiosHeaders).get('X-Custom')).toBe('value');
    });

    it('provides access to Redux state in prepareHeaders', async () => {
      const mockState = { auth: { token: 'secret' } };
      (mockApi.getState as jest.Mock).mockReturnValue(mockState);
      mockedAxios.mockResolvedValueOnce({
        data: {},
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
        prepareHeaders: (headers: AxiosHeaders, api: BaseQueryApi) => {
          const state = api.getState() as typeof mockState;
          headers.set('Authorization', `Bearer ${state.auth.token}`);
          return headers;
        },
      });
      await baseQuery({ url: '/protected' }, mockApi, {});

      const callArgs = mockedAxios.mock
        .calls[0][0] as unknown as AxiosRequestConfig;
      expect((callArgs.headers as AxiosHeaders).get('Authorization')).toBe(
        'Bearer secret'
      );
    });
  });

  describe('handling responses', () => {
    it('returns response data on success', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { users: [] },
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      const result = await baseQuery({ url: '/users' }, mockApi, {});

      expect(result.data).toEqual({ users: [] });
    });

    it('includes response metadata', async () => {
      const responseHeaders = { 'x-request-id': '123' };
      mockedAxios.mockResolvedValueOnce({
        data: {},
        status: 200,
        headers: responseHeaders,
        config: {},
        statusText: 'OK',
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      const result = await baseQuery({ url: '/users' }, mockApi, {});

      expect(result.meta?.status).toBe(200);
      expect(result.meta?.headers).toEqual(responseHeaders);
    });
  });

  describe('handling errors', () => {
    it('returns error details when request fails', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' }, headers: {} },
      });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      const result = await baseQuery({ url: '/missing' }, mockApi, {});

      expect(result.error?.status).toBe(404);
      expect(result.error?.data).toEqual({ message: 'Not found' });
    });

    it('returns error message when no response received', async () => {
      mockedAxios.mockRejectedValueOnce({ message: 'Network Error' });

      const baseQuery = createAxiosBaseQuery({
        baseUrl: 'https://api.example.com',
      });
      const result = await baseQuery({ url: '/users' }, mockApi, {});

      expect(result.error?.data).toBe('Network Error');
    });
  });
});
