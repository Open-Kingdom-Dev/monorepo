import {
  showErrorNotification,
  showNotification,
  showSuccessNotification,
  showWarningNotification,
} from './notification.actions';

describe('the notification actions', () => {
  it('provides easy easy to create success notifications', () => {
    const message = 'Test success notification';
    const action = showSuccessNotification(message);
    expect(action.type).toBe('notifications/addNotification');
    expect(action.payload).toEqual({
      message,
      type: 'success',
    });
  });

  it('provides easy to create warning notifications', () => {
    const message = 'Test warning notification';
    const action = showWarningNotification(message);
    expect(action.type).toBe('notifications/addNotification');
    expect(action.payload).toEqual({
      message,
      type: 'warning',
    });
  });

  it('provides easy to create error notifications', () => {
    const message = 'Test error notification';
    const action = showErrorNotification(message);
    expect(action.type).toBe('notifications/addNotification');
    expect(action.payload).toEqual({
      message,
      type: 'error',
    });
  });

  it('provides easy to create notifications of any type', () => {
    const message = 'Test notification';
    const action = showNotification(message, 'success');
    expect(action.type).toBe('notifications/addNotification');
    expect(action.payload).toEqual({
      message,
      type: 'success',
    });
  });
});
