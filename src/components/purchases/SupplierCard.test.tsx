<<<<<<< HEAD
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock component for testing
const SupplierCard = ({ supplier }: { supplier: any }) => {
  return (
    <div data-testid="supplier-card">
      <h3>{supplier.name}</h3>
      <p>{supplier.email}</p>
      <span>{supplier.is_active ? 'Active' : 'Inactive'}</span>
    </div>
  );
};

describe('SupplierCard', () => {
  const mockSupplier = {
    id: 'supplier-1',
    name: 'Test Supplier',
    email: 'test@supplier.com',
    phone: '+1234567890',
    is_active: true,
  };

  it('should render supplier information', () => {
    render(
      <BrowserRouter>
        <SupplierCard supplier={mockSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Supplier')).toBeTruthy();
    expect(screen.getByText('test@supplier.com')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('should show inactive status for inactive supplier', () => {
    const inactiveSupplier = { ...mockSupplier, is_active: false };

    render(
      <BrowserRouter>
        <SupplierCard supplier={inactiveSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByText('Inactive')).toBeTruthy();
  });

  it('should render with correct data-testid', () => {
    render(
      <BrowserRouter>
        <SupplierCard supplier={mockSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('supplier-card')).toBeTruthy();
  });
});
=======
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock component for testing
const SupplierCard = ({ supplier }: { supplier: any }) => {
  return (
    <div data-testid="supplier-card">
      <h3>{supplier.name}</h3>
      <p>{supplier.email}</p>
      <span>{supplier.is_active ? 'Active' : 'Inactive'}</span>
    </div>
  );
};

describe('SupplierCard', () => {
  const mockSupplier = {
    id: 'supplier-1',
    name: 'Test Supplier',
    email: 'test@supplier.com',
    phone: '+1234567890',
    is_active: true,
  };

  it('should render supplier information', () => {
    render(
      <BrowserRouter>
        <SupplierCard supplier={mockSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Supplier')).toBeTruthy();
    expect(screen.getByText('test@supplier.com')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('should show inactive status for inactive supplier', () => {
    const inactiveSupplier = { ...mockSupplier, is_active: false };

    render(
      <BrowserRouter>
        <SupplierCard supplier={inactiveSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByText('Inactive')).toBeTruthy();
  });

  it('should render with correct data-testid', () => {
    render(
      <BrowserRouter>
        <SupplierCard supplier={mockSupplier} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('supplier-card')).toBeTruthy();
  });
});
>>>>>>> 167a81b (added services in the BC and fixed warehouse error)
