import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { TwinStatus } from './twin-status';

// Mock refetch function
const mockRefetch = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useTwinControllerGetStatusQuery: jest.fn(),
  useTwinControllerStartMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ]),
  useTwinControllerStopMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ]),
}));

describe('TwinStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching status', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(screen.getByText(/Checking status/i)).toBeTruthy();
      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error state', () => {
    it('shows error message and retry button when API fails', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(screen.getByText(/Failed to load status/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy();
    });

    it('calls refetch when retry button is clicked', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Stopped state', () => {
    it('shows stopped status with gray indicator', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: false, healthy: false, port: 9013 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(document.querySelector('.bg-gray-400')).toBeTruthy();
      const stoppedElements = screen.getAllByText(/Stopped/);
      expect(stoppedElements.length).toBeGreaterThan(0);
    });

    it('start button is enabled and stop button is disabled when twin is stopped', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: false, healthy: false, port: 9013 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      const startButton = screen.getByRole('button', { name: /Start Twin/i });
      const stopButton = screen.getByRole('button', { name: /Stop Twin/i });

      expect(startButton).not.toBeDisabled();
      expect(stopButton).toBeDisabled();
    });
  });

  describe('Running state', () => {
    it('shows running status with green indicator when healthy', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: true, healthy: true, port: 9013, url: 'http://localhost:9013' },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(screen.getByText(/Running/)).toBeTruthy();
      expect(document.querySelector('.bg-green-500')).toBeTruthy();
    });

    it('shows unhealthy status with yellow indicator when running but unhealthy', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: true, healthy: false, port: 9013 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      const unhealthyElements = screen.getAllByText(/Unhealthy/);
      expect(unhealthyElements.length).toBeGreaterThan(0);
      expect(document.querySelector('.bg-yellow-500')).toBeTruthy();
    });

    it('stop button is enabled and start button is disabled when twin is running', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: true, healthy: true, port: 9013 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      const startButton = screen.getByRole('button', { name: /Start Twin/i });
      const stopButton = screen.getByRole('button', { name: /Stop Twin/i });

      expect(startButton).toBeDisabled();
      expect(stopButton).not.toBeDisabled();
    });

    it('displays URL when provided', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: true, healthy: true, port: 9013, url: 'http://localhost:9013' },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(screen.getByText(/http:\/\/localhost:9013/i)).toBeTruthy();
    });
  });

  describe('Refresh button', () => {
    it('calls refetch when refresh button is clicked', () => {
      const { useTwinControllerGetStatusQuery } = require('@open-kingdom/shared-frontend-data-access-api-client');
      (useTwinControllerGetStatusQuery as jest.Mock).mockReturnValue({
        data: { running: true, healthy: true, port: 9013 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
