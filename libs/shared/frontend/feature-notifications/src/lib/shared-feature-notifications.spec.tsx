import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { notificationReducer } from '@ynaa/shared-frontend-data-access-notifications';

import SharedFeatureNotifications from './shared-feature-notifications';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      notifications: notificationReducer,
    },
  });
};

describe('SharedFeatureNotifications', () => {
  it('should render successfully', () => {
    const store = createTestStore();

    const { baseElement } = render(
      <Provider store={store}>
        <SharedFeatureNotifications />
      </Provider>
    );
    expect(baseElement).toBeTruthy();
  });
});
