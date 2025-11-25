import { dataAccessApiClient } from './data-access-api-client.js';

describe('dataAccessApiClient', () => {
  it('should work', () => {
    expect(dataAccessApiClient()).toEqual('data-access-api-client');
  });
});
