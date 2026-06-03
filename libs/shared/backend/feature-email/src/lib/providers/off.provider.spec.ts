import { OffEmailProvider } from './off.provider.js';

describe('OffEmailProvider', () => {
  let provider: OffEmailProvider;

  beforeEach(() => {
    provider = new OffEmailProvider();
  });

  it('should return undefined messageId and resolve successfully', async () => {
    const result = await provider.send({
      to: ['test@example.com'],
      subject: 'Test',
      text: 'Hello',
    });
    expect(result).toEqual({ messageId: undefined });
  });
});
