export interface CatFact {
  fact: string;
  length: number;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
}

export interface Breed {
  breed: string;
  country: string;
  origin: string;
  coat: string;
  pattern: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}
