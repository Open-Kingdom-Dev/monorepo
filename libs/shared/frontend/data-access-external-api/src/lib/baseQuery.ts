import axios, { AxiosError, AxiosHeaders } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type {
  AxiosBaseQueryConfig,
  AxiosBaseQueryArgs,
  AxiosBaseQueryError,
  AxiosBaseQueryMeta,
} from './baseQuery.types.js';

export const createAxiosBaseQuery = (
  config: AxiosBaseQueryConfig
): BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  AxiosBaseQueryError,
  object,
  AxiosBaseQueryMeta
> => {
  const { baseUrl, prepareHeaders } = config;

  return async (
    { url, method = 'GET', params, body, headers, ...rest },
    api
  ) => {
    try {
      let requestHeaders = new AxiosHeaders(headers);

      if (prepareHeaders) {
        requestHeaders = prepareHeaders(requestHeaders, api);
      }

      const {
        data,
        headers: responseHeaders,
        status,
        config,
      } = await axios({
        url,
        baseURL: baseUrl,
        method,
        params,
        data: body,
        headers: requestHeaders,
        signal: api.signal,
        ...rest,
      });

      return {
        data,
        meta: {
          headers: responseHeaders,
          status,
          config,
        },
      };
    } catch (axiosError) {
      const err = axiosError as AxiosError;

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
          headers: err.response?.headers,
        },
      };
    }
  };
};
