import { render } from '@testing-library/react';

import OpenKingdomUiDatagrid from './ui-datagrid';

describe('OpenKingdomUiDatagrid', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<OpenKingdomUiDatagrid />);
    expect(baseElement).toBeTruthy();
  });
});
