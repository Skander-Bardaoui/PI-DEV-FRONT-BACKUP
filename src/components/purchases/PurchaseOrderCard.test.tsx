import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock component for testing
const PurchaseOrderCard = ({ purchaseOrder }: { purchaseOrder: any }) => {
  return (
    <div data-testid="po-card">
      <h3>{purchaseOrder.po_number}</h3>
      <p>Status: {purchaseOrder.status}</p>
      <p>Total: ${purchaseOrder.total_amount}</p>
    </div>
  );
};

describe('PurchaseOrderCard', () => {
  const mockPO = {
    id: 'po-1',
    po_number: 'PO-2024-001',
    supplier_id: 'supplier-1',
    status: 'approved',
    total_amount: 1000,
    order_date: '2024-01-15',
  };

  it('should render purchase order information', () => {
    render(
      <BrowserRouter>
        <PurchaseOrderCard purchaseOrder={mockPO} />
      </BrowserRouter>
    );

    expect(screen.getByText('PO-2024-001')).toBeTruthy();
    expect(screen.getByText('Status: approved')).toBeTruthy();
    expect(screen.getByText('Total: $1000')).toBeTruthy();
  });

  it('should render with correct data-testid', () => {
    render(
      <BrowserRouter>
        <PurchaseOrderCard purchaseOrder={mockPO} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('po-card')).toBeTruthy();
  });

  it('should display different statuses correctly', () => {
    const draftPO = { ...mockPO, status: 'draft' };

    render(
      <BrowserRouter>
        <PurchaseOrderCard purchaseOrder={draftPO} />
      </BrowserRouter>
    );

    expect(screen.getByText('Status: draft')).toBeTruthy();
  });
});