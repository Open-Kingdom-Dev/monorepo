import { ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthFailureRedirectFilter } from './google-auth-emulate.failure.filter';

describe('GoogleAuthFailureRedirectFilter', () => {
  let filter: GoogleAuthFailureRedirectFilter;
  const originalBaseUrl = process.env['BASE_URL'];

  const hostFor = (redirect: jest.Mock): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ redirect }),
      }),
    } as unknown as ArgumentsHost);

  beforeEach(() => {
    filter = new GoogleAuthFailureRedirectFilter();
    delete process.env['BASE_URL'];
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env['BASE_URL'];
    } else {
      process.env['BASE_URL'] = originalBaseUrl;
    }
  });

  it('redirects to the demo page with the URL-encoded reason', () => {
    const redirect = jest.fn();

    filter.catch(
      new UnauthorizedException('Invalid or expired OAuth state parameter'),
      hostFor(redirect)
    );

    expect(redirect).toHaveBeenCalledWith(
      'http://localhost:4200/google-auth-demo?auth=error&message=Invalid%20or%20expired%20OAuth%20state%20parameter'
    );
  });

  it('redirects to the configured BASE_URL', () => {
    process.env['BASE_URL'] = 'https://demo.example.com';
    const redirect = jest.fn();

    filter.catch(new UnauthorizedException('Boom'), hostFor(redirect));

    expect(redirect).toHaveBeenCalledWith(
      'https://demo.example.com/google-auth-demo?auth=error&message=Boom'
    );
  });

  it('falls back to a generic message when the exception has none', () => {
    const redirect = jest.fn();

    filter.catch({ message: '' } as UnauthorizedException, hostFor(redirect));

    expect(redirect).toHaveBeenCalledWith(
      'http://localhost:4200/google-auth-demo?auth=error&message=Google%20authentication%20failed'
    );
  });
});
