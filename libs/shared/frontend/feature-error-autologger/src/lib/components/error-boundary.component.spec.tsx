import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from './error-boundary.component';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  let mockLogger: jest.Mock;
  let mockNotificationHandler: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
    mockNotificationHandler = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
        >
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render fallback when error occurs', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          fallback={<div>Error fallback</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error fallback')).toBeInTheDocument();
    });

    it('should render nothing when error occurs and no fallback provided', () => {
      const { container } = render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should support fallback as a function with error access', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          fallback={(error) => <div>Error: {error.message}</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  describe('error reporting', () => {
    it('should report error to logger and notification handler', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          fallback={<div>Error</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('componentStack')
      );
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should call onError callback when provided', () => {
      const mockOnError = jest.fn();
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          onError={mockOnError}
          fallback={<div>Error</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('configuration options', () => {
    it('should use custom userMessage', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          userMessage="Custom error message"
          fallback={<div>Error</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockNotificationHandler).toHaveBeenCalledWith(
        'Custom error message'
      );
    });

    it('should respect notify: false', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          notify={false}
          fallback={<div>Error</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockLogger).toHaveBeenCalled();
      expect(mockNotificationHandler).not.toHaveBeenCalled();
    });

    it('should respect log: false', () => {
      render(
        <ErrorBoundary
          logger={mockLogger}
          notificationHandler={mockNotificationHandler}
          log={false}
          fallback={<div>Error</div>}
        >
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockLogger).not.toHaveBeenCalled();
      expect(mockNotificationHandler).toHaveBeenCalled();
    });

    it('should use default handlers when not provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <ErrorBoundary fallback={<div>Error</div>}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
