import { render } from '@testing-library/react';

import Logger from './logger';

describe('Logger', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Logger />);
    expect(baseElement).toBeTruthy();
  });
});
