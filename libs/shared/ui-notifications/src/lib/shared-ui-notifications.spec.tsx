import { render } from '@testing-library/react';

import SharedUiNotifications from './shared-ui-notifications';

describe('SharedUiNotifications', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SharedUiNotifications />);
    expect(baseElement).toBeTruthy();
  });
});
