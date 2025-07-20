import { createRoutesStub } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../app/app';
import React from 'react';

test('renders loader data', async () => {
  const ReactRouterStub = createRoutesStub([
    {
      path: '/',
      Component: App,
    },
  ]);

  render(<ReactRouterStub />);

  await waitFor(() => screen.findByText('Hello there,'));
});
