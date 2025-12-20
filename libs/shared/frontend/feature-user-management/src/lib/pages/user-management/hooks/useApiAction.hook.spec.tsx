import { renderHook, act } from '@testing-library/react';
import { useApiAction } from './useApiAction.hook';

describe('useApiAction', () => {
  it('runs the action and notifies on success', async () => {
    const onSuccess = jest.fn();
    const onNotify = jest.fn();
    const action = jest.fn().mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useApiAction(onNotify));

    await act(async () => {
      await result.current(
        action,
        onSuccess,
        'Operation completed',
        'Operation failed'
      );
    });

    expect(action).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledWith('success', 'Operation completed');
  });

  it('shows error notification when action fails', async () => {
    const onSuccess = jest.fn();
    const onNotify = jest.fn();
    const action = jest
      .fn()
      .mockResolvedValue({ error: new Error('Network error') });

    const { result } = renderHook(() => useApiAction(onNotify));

    await act(async () => {
      await result.current(
        action,
        onSuccess,
        'Operation completed',
        'Operation failed'
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledWith('error', 'Operation failed');
  });

  it('displays error message from API response when available', async () => {
    const onNotify = jest.fn();
    const action = jest.fn().mockResolvedValue({
      error: { data: { message: 'User already exists' } },
    });

    const { result } = renderHook(() => useApiAction(onNotify));

    await act(async () => {
      await result.current(action, jest.fn(), 'Success', 'Default error');
    });

    expect(onNotify).toHaveBeenCalledWith('error', 'User already exists');
  });

  it('asks for confirmation before running destructive actions', async () => {
    const mockConfirm = jest.fn().mockReturnValue(true);
    const action = jest.fn().mockResolvedValue({ data: { success: true } });
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useApiAction(undefined, mockConfirm));

    await act(async () => {
      await result.current(
        action,
        onSuccess,
        'Deleted',
        'Delete failed',
        'Are you sure you want to delete this?'
      );
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this?'
    );
    expect(action).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('cancels the action when user declines confirmation', async () => {
    const mockConfirm = jest.fn().mockReturnValue(false);
    const action = jest.fn();
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useApiAction(undefined, mockConfirm));

    await act(async () => {
      await result.current(
        action,
        onSuccess,
        'Deleted',
        'Delete failed',
        'Are you sure?'
      );
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('skips confirmation when no confirmation message is provided', async () => {
    const mockConfirm = jest.fn();
    const action = jest.fn().mockResolvedValue({ data: { success: true } });

    const { result } = renderHook(() => useApiAction(undefined, mockConfirm));

    await act(async () => {
      await result.current(action, jest.fn(), 'Done', 'Failed');
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalled();
  });

  it('works without a notification callback', async () => {
    const action = jest.fn().mockResolvedValue({ data: { success: true } });
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useApiAction());

    await act(async () => {
      await result.current(action, onSuccess, 'Done', 'Failed');
    });

    expect(action).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles errors gracefully without notification callback', async () => {
    const action = jest.fn().mockResolvedValue({ error: new Error('Failed') });

    const { result } = renderHook(() => useApiAction());

    await act(async () => {
      await result.current(action, jest.fn(), 'Done', 'Failed');
    });

    expect(action).toHaveBeenCalled();
  });
});
