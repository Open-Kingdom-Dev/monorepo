import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public decorator', () => {
  it('marks a route as public', () => {
    @Public()
    class TestRoute {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestRoute);
    expect(metadata).toBe(true);
  });

  it('uses isPublic as the metadata key', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});
