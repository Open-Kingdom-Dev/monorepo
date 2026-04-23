import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  useTwinControllerGetStatusQuery,
  useTwinControllerStartMutation,
  useTwinControllerStopMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

import { TwinStatus } from './twin-status';

jest.mock('@open-kingdom/shared-frontend-data-access-api-client');

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const mockRefetch = jest.fn();
const mockUseGetStatus = useTwinControllerGetStatusQuery as jest.Mock;
const mockUseStart = useTwinControllerStartMutation as jest.Mock;
const mockUseStop = useTwinControllerStopMutation as jest.Mock;

describe('TwinStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStart.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false },
    ]);
    mockUseStop.mockReturnValue([
      jest.fn().mockResolvedValue({}),
      { isLoading: false },
    ]);
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching status', () => {
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
        data: {
          running: true,
          healthy: true,
          port: 9013,
          url: 'http://localhost:9013',
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<TwinStatus />);

      expect(screen.getByText(/Running/)).toBeTruthy();
      expect(document.querySelector('.bg-green-500')).toBeTruthy();
    });

    it('shows unhealthy status with yellow indicator when running but unhealthy', () => {
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
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
      mockUseGetStatus.mockReturnValue({
        data: {
          running: true,
          healthy: true,
          port: 9013,
          url: 'http://localhost:9013',
        },
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
      mockUseGetStatus.mockReturnValue({
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
