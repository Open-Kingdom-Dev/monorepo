import { BadRequestException } from '@nestjs/common';

import { describeError, describeUnexpectedError } from '../index';

describe('describeError', () => {
  it('keeps the message of our own HttpException', () => {
    expect(describeError(new BadRequestException('Slide not found'))).toBe(
      'Slide not found'
    );
  });

  it('gives one line with the type of anything else, never its message', () => {
    expect(describeError(new TypeError('Cannot read Zelda Testperson'))).toBe(
      'TypeError'
    );
  });
});

describe('describeUnexpectedError', () => {
  it('keeps the error type and stack frames but not the message', () => {
    const error = new TypeError(
      'Cannot read name of resident Zelda Testperson'
    );

    const text = describeUnexpectedError(error);

    expect(text).toMatch(/^TypeError\n/);
    expect(text).toContain('    at ');
    expect(text).not.toContain('Zelda');
  });

  it('keeps the error code when there is one', () => {
    class UniqueConstraintError extends Error {
      code = 'P2002';
    }
    const error = new UniqueConstraintError(
      'Unique constraint failed for Zelda Testperson'
    );

    expect(describeUnexpectedError(error)).toMatch(
      /^UniqueConstraintError code=P2002\n/
    );
  });

  it("adds the host's safe summary after the type", () => {
    class ValidationError extends Error {}
    const error = new ValidationError('Bad value "Zelda"\nArgument `name`');
    const summarize = (e: Error) =>
      e instanceof ValidationError ? 'Argument `name` is invalid' : undefined;

    const text = describeUnexpectedError(error, summarize);

    expect(text).toMatch(/^ValidationError — Argument `name` is invalid\n/);
    expect(text).not.toContain('Zelda');
  });

  it('describes a thrown non-error by its type only', () => {
    expect(describeUnexpectedError('Zelda Testperson')).toBe(
      'Non-error thrown (string)'
    );
  });
});
