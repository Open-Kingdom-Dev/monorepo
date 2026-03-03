# @open-kingdom/shared-frontend-data-access-external-api

A unified integration layer for connecting any third-party REST API to the application's Redux store via RTK Query. The library provides `createAxiosBaseQuery` — an Axios-backed RTK Query base query factory — as the foundation for adding new external API integrations. The Cat Facts API is included as a reference implementation demonstrating the expected pattern; it is not the purpose of the library.

---

## Adding a New External API

In your application, import `createAxiosBaseQuery` and use it as the `baseQuery` for a new RTK Query `createApi` instance. This lives in your app's own code — not inside this library.

```typescript
// src/lib/weather-api/weather.api.ts (in your application)
import { createApi } from '@reduxjs/toolkit/query/react';
import { createAxiosBaseQuery } from '@open-kingdom/shared-frontend-data-access-external-api';

export const weatherApi = createApi({
  reducerPath: 'weatherApi',
  baseQuery: createAxiosBaseQuery({
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    prepareHeaders: (headers) => {
      headers.set('X-Api-Key', process.env.VITE_WEATHER_API_KEY ?? '');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCurrentWeather: builder.query<WeatherResponse, string>({
      query: (city) => ({ url: '/weather', params: { q: city } }),
    }),
  }),
});

export const WeatherApiKey = weatherApi.reducerPath;
export const weatherApiReducer = weatherApi.reducer;
export const weatherApiMiddleware = weatherApi.middleware;
export const { useGetCurrentWeatherQuery } = weatherApi;
```

Register the reducer and middleware in your store:

```typescript
// src/store.ts (in your application)
import { configureStore } from '@reduxjs/toolkit';
import { WeatherApiKey, weatherApiReducer, weatherApiMiddleware } from './lib/weather-api/weather.api';

export const store = configureStore({
  reducer: {
    [WeatherApiKey]: weatherApiReducer,
    // ...other reducers
  },
  middleware: (getDefault) => getDefault().concat(weatherApiMiddleware),
});
```

Then use the generated hook anywhere in your components:

```tsx
import { useGetCurrentWeatherQuery } from './lib/weather-api/weather.api';

function WeatherWidget({ city }: { city: string }) {
  const { data, isLoading, error } = useGetCurrentWeatherQuery(city);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Could not load weather</p>;
  return <p>{data?.weather[0].description}</p>;
}
```

---

## Exports

### Base Query Factory

| Export | Type | Description |
|---|---|---|
| `createAxiosBaseQuery(config)` | `(config: AxiosBaseQueryConfig) => BaseQueryFn` | Creates an RTK Query `baseQuery` function using Axios |
| `AxiosBaseQueryConfig` | `interface` | Configuration for the Axios base query |
| `AxiosBaseQueryArgs` | `interface` | Per-request arguments passed to the query |
| `AxiosBaseQueryError` | `interface` | Shape of errors returned on Axios failures |
| `AxiosBaseQueryMeta` | `interface` | Shape of response metadata |

### Cat Facts API (reference implementation)

| Export | Type | Description |
|---|---|---|
| `catFactsApi` | `Api<...>` | RTK Query `createApi` instance for `https://catfact.ninja`, `reducerPath: 'catFactsApi'` |
| `CatFactsApiKey` | `'catFactsApi'` | The reducer path string constant |
| `catFactsApiReducer` | `Reducer` | `catFactsApi.reducer` |
| `catFactsApiMiddleware` | `Middleware` | `catFactsApi.middleware` |
| `useGetFactQuery` | `QueryHook<CatFact, void>` | RTK Query hook for `GET /fact` |
| `useGetFactsQuery` | `QueryHook<PaginatedResponse<CatFact>, PaginationParams \| void>` | RTK Query hook for `GET /facts` |
| `useGetBreedsQuery` | `QueryHook<PaginatedResponse<Breed>, PaginationParams \| void>` | RTK Query hook for `GET /breeds` |

---

## Type Definitions

### `AxiosBaseQueryConfig`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `baseUrl` | `string` | Yes | — | The base URL for all requests made by this query function |
| `prepareHeaders` | `(headers: AxiosHeaders, api: BaseQueryApi) => AxiosHeaders` | No | — | Optional hook to inject headers (e.g. auth tokens) before each request |

### `AxiosBaseQueryArgs`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | `string` | Yes | — | Path appended to `baseUrl` |
| `method` | `AxiosRequestConfig['method']` | No | `'GET'` | HTTP method |
| `params` | `Record<string, unknown>` | No | — | URL query parameters |
| `body` | `unknown` | No | — | Request body |
| `headers` | `Record<string, string>` | No | — | Per-request header overrides |

Additional properties are passed through to the Axios config object.

### `AxiosBaseQueryError`

| Property | Type | Required | Description |
|---|---|---|---|
| `status` | `number` | No | HTTP status code |
| `data` | `unknown` | No | Response body from the failed request |
| `headers` | `unknown` | No | Response headers |

### `AxiosBaseQueryMeta`

| Property | Type | Required | Description |
|---|---|---|---|
| `headers` | `unknown` | No | Response headers |
| `status` | `number` | No | HTTP status code |
| `config` | `AxiosRequestConfig` | No | The Axios config used for the request |

### `CatFact`

| Property | Type | Description |
|---|---|---|
| `fact` | `string` | The fact text |
| `length` | `number` | Character length of the fact |

### `Breed`

| Property | Type | Description |
|---|---|---|
| `breed` | `string` | Breed name |
| `country` | `string` | Country of origin |
| `origin` | `string` | Origin description |
| `coat` | `string` | Coat type |
| `pattern` | `string` | Coat pattern |

### `PaginatedResponse<T>`

| Property | Type | Description |
|---|---|---|
| `current_page` | `number` | Current page number |
| `data` | `T[]` | Array of items for the current page |
| `last_page` | `number` | Total number of pages |
| `total` | `number` | Total number of items across all pages |

### `PaginationParams`

| Property | Type | Required | Description |
|---|---|---|---|
| `page` | `number` | No | Page number to fetch |
| `limit` | `number` | No | Number of items per page |

Additional properties are forwarded to the query string.

---

## Setup

### Adding the Cat Facts reference API to the store

```typescript
import { configureStore } from '@reduxjs/toolkit';
import {
  CatFactsApiKey,
  catFactsApiReducer,
  catFactsApiMiddleware,
} from '@open-kingdom/shared-frontend-data-access-external-api';

export const store = configureStore({
  reducer: {
    [CatFactsApiKey]: catFactsApiReducer, // 'catFactsApi'
  },
  middleware: (getDefault) =>
    getDefault().concat(catFactsApiMiddleware),
});
```

---

## Usage Examples

### Fetch a random cat fact

```tsx
import { useGetFactQuery } from '@open-kingdom/shared-frontend-data-access-external-api';

function CatFactWidget() {
  const { data, isLoading, error } = useGetFactQuery();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading fact</p>;
  return <p>{data?.fact}</p>;
}
```

### Fetch paginated facts

```tsx
import { useGetFactsQuery } from '@open-kingdom/shared-frontend-data-access-external-api';

function CatFactsList() {
  const { data } = useGetFactsQuery({ page: 1, limit: 10 });

  return (
    <ul>
      {data?.data.map((item, i) => (
        <li key={i}>{item.fact}</li>
      ))}
    </ul>
  );
}
```

### Fetch cat breeds

```tsx
import { useGetBreedsQuery } from '@open-kingdom/shared-frontend-data-access-external-api';

function BreedList() {
  const { data } = useGetBreedsQuery({ page: 1, limit: 25 });

  return (
    <ul>
      {data?.data.map((breed) => (
        <li key={breed.breed}>{breed.breed} — {breed.country}</li>
      ))}
    </ul>
  );
}
```

---

## Testing

```bash
nx test shared-frontend-data-access-external-api
```
