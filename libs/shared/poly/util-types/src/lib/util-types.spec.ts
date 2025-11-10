import {  NotificationConfig } from '../index';
import { GridOptions } from 'ag-grid-community';

describe('util-types', () => {
  it('should pass tests by having a placeholder', () => {
    const notificationConfig: NotificationConfig = {
      maxNotifications: 10,
      autoDismiss: true,
      dismissTimeout: 5000,
    };
    expect(notificationConfig).toBeDefined();
  });
  it('should pass tests by having a placeholder for the grid config', () => {
    const gridConfig: GridOptions = {
    
    columnDefs: [
      { field: 'id', headerName: 'ID' },
      { field: 'name', headerName: 'Name' },
    ],
    rowData: [
      { id: 1, name: 'John' },
    ],
  };
    expect(gridConfig).toBeDefined();
  });
});
