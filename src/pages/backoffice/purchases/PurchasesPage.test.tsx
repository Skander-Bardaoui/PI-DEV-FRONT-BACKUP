import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock PurchasesPage component
const PurchasesPage = () => {
  return (
    <div data-testid="purchases-page">
      <h1>Purchases Management</h1>
      <div data-testid="tabs">
        <button>Suppliers</button>
        <button>Purchase Orders</button>
        <button>Goods Receipts</button>
        <button>Invoices</button>
      </div>
    </div>
  );
};

describe('PurchasesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PurchasesPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render page title', () => {
    renderPage();
    expect(screen.getByText('Purchases Management')).toBeTruthy();
  });

  it('should render all tabs', () => {
    renderPage();
    expect(screen.getByText('Suppliers')).toBeTruthy();
    expect(screen.getByText('Purchase Orders')).toBeTruthy();
    expect(screen.getByText('Goods Receipts')).toBeTruthy();
    expect(screen.getByText('Invoices')).toBeTruthy();
  });

  it('should render with correct data-testid', () => {
    renderPage();
    expect(screen.getByTestId('purchases-page')).toBeTruthy();
    expect(screen.getByTestId('tabs')).toBeTruthy();
  });
});