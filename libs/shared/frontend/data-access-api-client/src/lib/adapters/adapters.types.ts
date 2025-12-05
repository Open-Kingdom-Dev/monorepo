export interface AuthAdapter {
  prepareHeaders(headers: Headers, token: string): void;
}
