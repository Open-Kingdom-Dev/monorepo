import { render, screen } from '@testing-library/react';
import PortLeaseDemo from './port-lease-demo';
import { usePortLeaseControllerGetStatusQuery } from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  usePortLeaseControllerGetStatusQuery: jest.fn(),
}));

const mockQuery = usePortLeaseControllerGetStatusQuery as jest.Mock;

const lease = {
  slot: 1,
  source: 'registry',
  isPrimary: false,
  worktreePath: '/w/feature',
  branch: 'feature',
  registryPath: '/w/main/.git/port-lease-registry.json',
  width: 65,
  maxSlots: 8,
  backendPort: 3000,
  ports: [
    { name: 'PORT', base: 3000, leased: 3065, busy: false },
    { name: 'FRONTEND_PORT', base: 4200, leased: 4265, busy: true },
  ],
  registry: [
    { slot: 0, path: '/w/main', branch: 'main', current: false },
    { slot: 1, path: '/w/feature', branch: 'feature', current: true },
  ],
  warnings: [],
};

describe('PortLeaseDemo', () => {
  it('shows the slot, each leased port, and the clone’s registry', () => {
    mockQuery.mockReturnValue({ data: lease, refetch: jest.fn() });
    render(<PortLeaseDemo />);

    expect(screen.getByText('3065')).toBeTruthy();
    expect(screen.getByText('4265')).toBeTruthy();
    expect(screen.getByText('← this')).toBeTruthy();
    // The backend is on 3000 but the lease says 3065: the page says so.
    expect(screen.getByText(/the lease would give\s+it 3065/)).toBeTruthy();
  });

  it('offers a retry when the lease cannot be loaded', () => {
    mockQuery.mockReturnValue({ error: { status: 500 }, refetch: jest.fn() });
    render(<PortLeaseDemo />);

    expect(screen.getByText('Could not load the port lease.')).toBeTruthy();
  });
});
