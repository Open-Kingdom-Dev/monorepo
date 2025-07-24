import { render } from '@testing-library/react';

import SharedUiTheme from './shared-ui-theme';

describe('SharedUiTheme', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedUiTheme />);
    expect(baseElement).toBeTruthy();
  });
});
