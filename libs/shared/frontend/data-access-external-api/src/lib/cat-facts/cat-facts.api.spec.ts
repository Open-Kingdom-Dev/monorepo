/**
 * Cat Facts API Integration Tests
 *
 * These tests demonstrate how to test an RTK Query API integration
 * built with createAxiosBaseQuery. Use this as a reference when
 * adding tests for other third-party API integrations.
 *
 * Key patterns:
 * - Mock axios at the module level
 * - Use a real Redux store with the API reducer and middleware
 * - Test endpoint behavior through the store's dispatch
 * - Verify request configuration and response handling
 * - Use ReturnType<typeof createTestStore> for proper store typing
 */

import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import { catFactsApi, CatFactsApiKey } from './cat-facts.api.js';
import type { CatFact, PaginatedResponse, Breed } from './cat-facts.types.js';

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
  AxiosHeaders: jest.requireActual('axios').AxiosHeaders,
}));

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

const createTestStore = () =>
  configureStore({
    reducer: {
      [CatFactsApiKey]: catFactsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(catFactsApi.middleware),
  });

type TestStore = ReturnType<typeof createTestStore>;
type CatFactsEndpoints = typeof catFactsApi.endpoints;

describe('catFactsApi', () => {
  let store: TestStore;
  let endpoints: CatFactsEndpoints;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
    endpoints = catFactsApi.endpoints;
  });

  describe('getFact', () => {
    it('fetches a single cat fact', async () => {
      const mockFact: CatFact = {
        fact: 'Cats sleep 70% of their lives.',
        length: 32,
      };
      mockedAxios.mockResolvedValueOnce({
        data: mockFact,
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const result = await store.dispatch(endpoints.getFact.initiate());

      expect(result.data).toEqual(mockFact);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/fact',
          baseURL: 'https://catfact.ninja',
        })
      );
    });
  });

  describe('getFacts', () => {
    it('fetches paginated cat facts', async () => {
      const mockResponse: PaginatedResponse<CatFact> = {
        current_page: 1,
        data: [{ fact: 'Cats have 9 lives.', length: 18 }],
        last_page: 10,
        total: 100,
      };
      mockedAxios.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const result = await store.dispatch(
        endpoints.getFacts.initiate({ page: 1, limit: 10 })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/facts',
          params: { page: 1, limit: 10 },
        })
      );
    });

    it('fetches facts without pagination params', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { current_page: 1, data: [], last_page: 1, total: 0 },
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      await store.dispatch(endpoints.getFacts.initiate());

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/facts',
          params: {},
        })
      );
    });
  });

  describe('getBreeds', () => {
    it('fetches paginated cat breeds', async () => {
      const mockResponse: PaginatedResponse<Breed> = {
        current_page: 1,
        data: [
          {
            breed: 'Abyssinian',
            country: 'Ethiopia',
            origin: 'Natural',
            coat: 'Short',
            pattern: 'Ticked',
          },
        ],
        last_page: 5,
        total: 50,
      };
      mockedAxios.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        config: {},
        statusText: 'OK',
      });

      const result = await store.dispatch(
        endpoints.getBreeds.initiate({ page: 1 })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/breeds',
          params: { page: 1 },
        })
      );
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          headers: {},
        },
      });

      const result = await store.dispatch(endpoints.getFact.initiate());

      expect(result.error).toEqual(
        expect.objectContaining({
          status: 500,
          data: { message: 'Internal server error' },
        })
      );
    });
  });
});
