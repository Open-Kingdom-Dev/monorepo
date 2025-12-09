import { createApi } from '@reduxjs/toolkit/query/react';
import { createAxiosBaseQuery } from '../baseQuery.js';
import type {
  CatFact,
  PaginatedResponse,
  Breed,
  PaginationParams,
} from './cat-facts.types.js';

export const CatFactsApiKey = 'catFactsApi';

export const catFactsApi = createApi({
  reducerPath: CatFactsApiKey,
  baseQuery: createAxiosBaseQuery({ baseUrl: 'https://catfact.ninja' }),
  endpoints: (build) => ({
    getFact: build.query<CatFact, void>({
      query: () => ({ url: '/fact' }),
    }),
    getFacts: build.query<PaginatedResponse<CatFact>, PaginationParams | void>({
      query: (args) => ({ url: '/facts', params: args ?? {} }),
    }),
    getBreeds: build.query<PaginatedResponse<Breed>, PaginationParams | void>({
      query: (args) => ({ url: '/breeds', params: args ?? {} }),
    }),
  }),
});

export const catFactsApiReducer = catFactsApi.reducer;
export const catFactsApiMiddleware = catFactsApi.middleware;
export const { useGetFactQuery, useGetFactsQuery, useGetBreedsQuery } =
  catFactsApi;
