import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ColDef } from '@open-kingdom/shared-frontend-ui-datagrid';
import { RoleList } from './RoleList.component';

const mockFindAllQuery = jest.fn();
const mockDeleteRole = jest.fn();

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  useRolesControllerFindAllQuery: () => mockFindAllQuery(),
  useRolesControllerDeleteMutation: () => [
    mockDeleteRole,
    { isLoading: false },
  ],
  usePermissionsControllerFindAllQuery: () => ({ data: [] }),
  useRolesControllerGetPermissionsQuery: () => ({ data: [] }),
  useRolesControllerSetPermissionsMutation: () => [
    jest.fn(),
    { isLoading: false },
  ],
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg: string) => ({
    type: 'notify',
    payload: msg,
  })),
}));

jest.mock('@open-kingdom/shared-frontend-ui-theme', () => ({
  __esModule: true,
  useTheme: () => ({ theme: {}, mode: 'light' }),
}));

const mockHasPermission = jest.fn();
jest.mock('../../hooks/useHasPermission', () => ({
  __esModule: true,
  useHasPermission: (...args: string[]) => mockHasPermission(...args),
}));

let capturedColumnDefs: ColDef[] = [];
jest.mock('@open-kingdom/shared-frontend-ui-datagrid', () => ({
  __esModule: true,
  DataGrid: ({
    rowData,
    loading,
    columnDefs,
  }: {
    rowData: Record<string, unknown>[];
    loading: boolean;
    columnDefs: ColDef[];
  }) => {
    capturedColumnDefs = columnDefs;
    const rows = rowData ?? [];
    return (
      <div data-testid="data-grid">
        {loading && <span>Loading...</span>}
        {!loading &&
          rows.map((row, i) => (
            <div key={i} data-testid="grid-row">
              {columnDefs.map((col, j) => {
                const value = col.valueGetter
                  ? (col.valueGetter as CallableFunction)({ data: row })
                  : (row as Record<string, unknown>)[col.field as string];
                const rendered = col.cellRenderer
                  ? (col.cellRenderer as CallableFunction)({ data: row })
                  : value;
                return <span key={j}>{rendered}</span>;
              })}
            </div>
          ))}
      </div>
    );
  },
}));

jest.mock('../shared/ConfirmDialog.component', () => ({
  __esModule: true,
  ConfirmDialog: ({
    isOpen,
    title,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Dismiss</button>
      </div>
    ) : null,
}));

jest.mock('./RolePermissionsModal.component', () => ({
  __esModule: true,
  RolePermissionsModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
    role: { id: number; name: string };
  }) =>
    isOpen ? (
      <div data-testid="permissions-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const store = configureStore({ reducer: {} });

function renderWithProviders(ui: React.ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>);
}

const mockRoles = [
  { id: 1, name: 'guest', description: 'Limited access', isSystem: 1 },
  { id: 2, name: 'user', description: 'Standard user', isSystem: 1 },
  { id: 3, name: 'admin', description: 'Full access', isSystem: 1 },
];

describe('RoleList', () => {
  beforeEach(() => {
    mockDeleteRole.mockReset();
    mockDeleteRole.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockHasPermission.mockReturnValue(true);
    capturedColumnDefs = [];
  });

  it('shows a loading indicator while roles are being fetched', () => {
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the role list with a heading', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getAllByTestId('grid-row')).toHaveLength(3);
  });

  it('lets the user retry when loading fails', () => {
    const refetch = jest.fn();
    mockFindAllQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch,
    });
    renderWithProviders(<RoleList />);
    expect(screen.getByText('Failed to load roles.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  it('hides action buttons when the user lacks permissions', () => {
    mockHasPermission.mockReturnValue(false);
    mockFindAllQuery.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const rendered = (actionsCol?.cellRenderer as CallableFunction)({
      data: mockRoles[0],
    });
    const { container } = render(<Provider store={store}>{rendered}</Provider>);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('disables delete for system roles', () => {
    mockFindAllQuery.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const rendered = (actionsCol?.cellRenderer as CallableFunction)({
      data: mockRoles[0],
    });
    const { container } = render(<Provider store={store}>{rendered}</Provider>);
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete'
    );
    expect(deleteBtn).toBeDisabled();
  });

  it('opens the permissions modal when Permissions is clicked', async () => {
    mockFindAllQuery.mockReturnValue({
      data: mockRoles,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const { container } = render(
      <Provider store={store}>
        {(actionsCol?.cellRenderer as CallableFunction)({
          data: mockRoles[2],
        })}
      </Provider>
    );
    const permBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Permissions'
    );
    fireEvent.click(permBtn as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('permissions-modal')).toBeInTheDocument();
    });
  });

  it('asks for confirmation before deleting a role', async () => {
    mockFindAllQuery.mockReturnValue({
      data: [{ id: 10, name: 'custom', description: 'Custom', isSystem: 0 }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithProviders(<RoleList />);

    const actionsCol = capturedColumnDefs.find(
      (c) => c.headerName === 'Actions'
    );
    const { container } = render(
      <Provider store={store}>
        {(actionsCol?.cellRenderer as CallableFunction)({
          data: { id: 10, name: 'custom', description: 'Custom', isSystem: 0 },
        })}
      </Provider>
    );
    const deleteBtn = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Delete'
    );
    fireEvent.click(deleteBtn as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockDeleteRole).toHaveBeenCalledWith({ id: 10 });
    });
  });
});
