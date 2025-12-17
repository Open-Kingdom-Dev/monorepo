import type { AxiosRequestConfig, AxiosHeaders } from 'axios';
import type { BaseQueryApi } from '@reduxjs/toolkit/query/react';

export interface AxiosBaseQueryConfig {
  baseUrl: string;
  prepareHeaders?: (headers: AxiosHeaders, api: BaseQueryApi) => AxiosHeaders;
}

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export interface AxiosBaseQueryError {
  status?: number;
  data?: unknown;
  headers?: unknown;
}

export interface AxiosBaseQueryMeta {
  headers?: unknown;
  status?: number;
  config?: AxiosRequestConfig;
}
