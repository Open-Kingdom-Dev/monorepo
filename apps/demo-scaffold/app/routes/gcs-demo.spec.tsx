/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GcsDemo from './gcs-demo';
import { useDispatch } from 'react-redux';
import {
  useGcsStorageControllerListFilesQuery,
  useGcsStorageControllerUploadFileMutation,
  useGcsStorageControllerDeleteFileMutation,
  useTwinControllerGetStatusQuery,
  useTwinControllerStartMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useGcsStorageControllerListFilesQuery: jest.fn(),
  useGcsStorageControllerUploadFileMutation: jest.fn(),
  useGcsStorageControllerDeleteFileMutation: jest.fn(),
  useTwinControllerGetStatusQuery: jest.fn(),
  useTwinControllerStartMutation: jest.fn(),
}));

jest.mock('../utils/env', () => ({
  getGcsEmulatorUrl: () => 'http://localhost:4443',
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg) => ({ type: 'SUCCESS', msg })),
  showErrorNotification: jest.fn((msg) => ({ type: 'ERROR', msg })),
}));

jest.mock('../components', () => ({
  TwinStatus: () => <div data-testid="twin-status">TwinStatus Mock</div>,
  ErrorSimulatorPanel: () => (
    <div data-testid="error-simulator-panel">ErrorSimulatorPanel Mock</div>
  ),
  ErrorBanner: ({ mode }: any) => (
    <div data-testid="error-banner">ErrorBanner: {mode.type}</div>
  ),
}));

describe('GcsDemo', () => {
  let mockDispatch: jest.Mock;
  let mockStartTwin: jest.Mock;
  let mockUploadFile: jest.Mock;
  let mockDeleteFile: jest.Mock;
  let mockRefetchFiles: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);

    mockStartTwin = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useTwinControllerStartMutation as any).mockReturnValue([
      mockStartTwin,
      { isLoading: false },
    ]);

    mockUploadFile = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useGcsStorageControllerUploadFileMutation as any).mockReturnValue([
      mockUploadFile,
      { isLoading: false },
    ]);

    mockDeleteFile = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    (useGcsStorageControllerDeleteFileMutation as any).mockReturnValue([
      mockDeleteFile,
      { isLoading: false },
    ]);

    mockRefetchFiles = jest.fn();
    (useGcsStorageControllerListFilesQuery as any).mockReturnValue({
      data: {
        files: [
          {
            name: 'file1.txt',
            bucket: 'app-assets',
            size: 1024,
            contentType: 'text/plain',
            updated: '2026-05-28T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      refetch: mockRefetchFiles,
    });

    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: { active: false },
      },
    });
  });

  it('renders correctly when GCS Twin is running', () => {
    render(<GcsDemo />);
    expect(screen.getByText('GCS Twin Demo')).toBeTruthy();
    expect(screen.getByText('file1.txt')).toBeTruthy();
    expect(screen.getByText('1.0 KB')).toBeTruthy();
    expect(screen.getByText('text/plain')).toBeTruthy();
  });

  it('shows warnings and allows starting twin when GCS Twin is not running', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        errorMode: { active: false },
      },
    });

    render(<GcsDemo />);
    expect(screen.getByText('GCS Twin is not running')).toBeTruthy();

    const startBtn = screen.getByRole('button', { name: 'Start Twin' });
    fireEvent.click(startBtn);

    expect(mockStartTwin).toHaveBeenCalled();
    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SUCCESS', msg: 'GCS Twin started' })
    );
  });

  it('renders error banner when error mode is active', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        errorMode: { active: true, type: 'quota-exceeded' },
      },
    });

    render(<GcsDemo />);
    expect(screen.getByTestId('error-banner').textContent).toContain(
      'quota-exceeded'
    );
  });

  it('handles delete file interaction', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    render(<GcsDemo />);

    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteBtn);

    expect(mockDeleteFile).toHaveBeenCalledWith({
      bucket: 'app-assets',
      fileName: 'file1.txt',
    });
    await Promise.resolve();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUCCESS',
        msg: 'Deleted "file1.txt" successfully',
      })
    );
  });

  it('handles file download', async () => {
    const mockJson = jest
      .fn()
      .mockResolvedValue({ url: 'http://download-link' });
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: mockJson,
    });
    global.fetch = mockFetch;

    render(<GcsDemo />);

    const downloadBtn = screen.getByRole('button', { name: 'Download' });
    fireEvent.click(downloadBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  });

  it('handles file upload successfully', async () => {
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsDataURL: jest
        .fn()
        .mockImplementation(function (this: any, file: File) {
          this.result = 'data:text/plain;base64,aGVsbG8=';
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }),
      result: 'data:text/plain;base64,aGVsbG8=',
      onload: null as any,
      onerror: null as any,
    };
    const originalFileReader = global.FileReader;
    global.FileReader = jest
      .fn()
      .mockImplementation(() => mockFileReaderInstance) as any;

    render(<GcsDemo />);

    const fileInput = screen.getByLabelText('Choose a file');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: 'Upload' });
    await waitFor(() => expect(uploadBtn).not.toBeDisabled());
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith({
        uploadFileDto: {
          bucket: 'app-assets',
          fileName: 'hello.txt',
          content: 'aGVsbG8=',
          contentType: 'text/plain',
        },
      });
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SUCCESS',
        msg: 'Uploaded "hello.txt" successfully',
      })
    );

    global.FileReader = originalFileReader;
  });

  it('handles file upload failure', async () => {
    mockUploadFile.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        data: {
          error: {
            message: 'Quota exceeded for upload',
          },
        },
      }),
    });

    const mockFileReaderInstance = {
      readAsDataURL: jest
        .fn()
        .mockImplementation(function (this: any, file: File) {
          this.result = 'data:text/plain;base64,aGVsbG8=';
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }),
      result: 'data:text/plain;base64,aGVsbG8=',
      onload: null as any,
      onerror: null as any,
    };
    const originalFileReader = global.FileReader;
    global.FileReader = jest
      .fn()
      .mockImplementation(() => mockFileReaderInstance) as any;

    render(<GcsDemo />);

    const fileInput = screen.getByLabelText('Choose a file');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: 'Upload' });
    await waitFor(() => expect(uploadBtn).not.toBeDisabled());
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Upload failed: Quota exceeded for upload',
        })
      );
    });

    global.FileReader = originalFileReader;
  });

  it('handles file upload FileReader error', async () => {
    const mockFileReaderInstance = {
      readAsDataURL: jest
        .fn()
        .mockImplementation(function (this: any, file: File) {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Reader failed'));
          }, 0);
        }),
      result: null,
      onload: null as any,
      onerror: null as any,
    };
    const originalFileReader = global.FileReader;
    global.FileReader = jest
      .fn()
      .mockImplementation(() => mockFileReaderInstance) as any;

    render(<GcsDemo />);

    const fileInput = screen.getByLabelText('Choose a file');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: 'Upload' });
    await waitFor(() => expect(uploadBtn).not.toBeDisabled());
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Upload failed: Reader failed',
        })
      );
    });

    global.FileReader = originalFileReader;
  });

  it('handles file download failure (network / status error)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
    });
    global.fetch = mockFetch;

    render(<GcsDemo />);

    const downloadBtn = screen.getByRole('button', { name: 'Download' });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Download failed: Failed to get download URL: Forbidden',
        })
      );
    });
  });

  it('handles file download failure (empty url returned)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: '' }),
    });
    global.fetch = mockFetch;

    render(<GcsDemo />);

    const downloadBtn = screen.getByRole('button', { name: 'Download' });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Download failed: No download URL returned',
        })
      );
    });
  });

  it('handles file delete failure', async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    mockDeleteFile.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Internal Server Error')),
    });

    render(<GcsDemo />);

    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Delete failed: Internal Server Error',
        })
      );
    });
  });

  it('handles twin start failure', async () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        errorMode: { active: false },
      },
    });
    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Container crashed')),
    });

    render(<GcsDemo />);
    const startBtn = screen.getByRole('button', { name: 'Start Twin' });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Failed to start twin: Container crashed',
        })
      );
    });
  });

  it('renders correctly when loading files', () => {
    (useGcsStorageControllerListFilesQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetchFiles,
    });

    render(<GcsDemo />);
    expect(screen.getByText('Loading files...')).toBeTruthy();
  });

  it('renders correctly when no files are found', () => {
    (useGcsStorageControllerListFilesQuery as any).mockReturnValue({
      data: { files: [] },
      isLoading: false,
      refetch: mockRefetchFiles,
    });

    render(<GcsDemo />);
    expect(screen.getByText('No files found.')).toBeTruthy();
  });

  it('renders warning message when starting twin', () => {
    (useTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        errorMode: { active: false },
      },
    });
    (useTwinControllerStartMutation as any).mockReturnValue([
      mockStartTwin,
      { isLoading: true },
    ]);

    render(<GcsDemo />);
    expect(
      screen.getByText(
        'Starting twin emulator — this may take a few seconds...'
      )
    ).toBeTruthy();
  });

  it('handles file upload failure with nested array error', async () => {
    mockUploadFile.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({
        data: {
          error: {
            errors: [{ message: 'Nested array error' }],
          },
        },
      }),
    });

    const mockFileReaderInstance = {
      readAsDataURL: jest
        .fn()
        .mockImplementation(function (this: any, file: File) {
          this.result = 'data:text/plain;base64,aGVsbG8=';
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }),
      result: 'data:text/plain;base64,aGVsbG8=',
      onload: null as any,
      onerror: null as any,
    };
    const originalFileReader = global.FileReader;
    global.FileReader = jest
      .fn()
      .mockImplementation(() => mockFileReaderInstance) as any;

    render(<GcsDemo />);

    const fileInput = screen.getByLabelText('Choose a file');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: 'Upload' });
    await waitFor(() => expect(uploadBtn).not.toBeDisabled());
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Upload failed: Nested array error',
        })
      );
    });

    global.FileReader = originalFileReader;
  });

  it('handles file upload failure with unknown error', async () => {
    mockUploadFile.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue('Some string error'),
    });

    const mockFileReaderInstance = {
      readAsDataURL: jest
        .fn()
        .mockImplementation(function (this: any, file: File) {
          this.result = 'data:text/plain;base64,aGVsbG8=';
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }),
      result: 'data:text/plain;base64,aGVsbG8=',
      onload: null as any,
      onerror: null as any,
    };
    const originalFileReader = global.FileReader;
    global.FileReader = jest
      .fn()
      .mockImplementation(() => mockFileReaderInstance) as any;

    render(<GcsDemo />);

    const fileInput = screen.getByLabelText('Choose a file');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByRole('button', { name: 'Upload' });
    await waitFor(() => expect(uploadBtn).not.toBeDisabled());
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ERROR',
          msg: 'Upload failed: Unknown error',
        })
      );
    });

    global.FileReader = originalFileReader;
  });
});
