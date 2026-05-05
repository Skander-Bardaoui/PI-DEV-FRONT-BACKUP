/**
 * Tests for SuppliersPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { business_id: 'test-business' } }),
}));

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    data: { data: [], total: 0, total_pages: 1 },
    isLoading: false,
  }),
  useArchiveSupplier: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreSupplier: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useSupplierPOs', () => ({
  useSupplierPOs: () => ({ data: { data: [] } }),
}));

vi.mock('@/hooks/usePurchaseInvoices', () => ({
  usePurchaseInvoices: () => ({ data: { data: [] } }),
}));

vi.mock('@/hooks/usePDFExport', () => ({
  usePDFExport: () => ({ exportReleve: vi.fn(), loading: false }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SuppliersPage', () => {
  it('should render page title', async () => {
    const SuppliersPage = (await import('./SuppliersPage')).default;
    renderWithProviders(<SuppliersPage />);
    expect(screen.getByText('Fournisseurs')).toBeInTheDocument();
  });

  it('should show empty state when no suppliers', async () => {
    const SuppliersPage = (await import('./SuppliersPage')).default;
    renderWithProviders(<SuppliersPage />);
    expect(screen.getByText('Aucun fournisseur trouvé')).toBeInTheDocument();
  });

  it('should render action buttons', async () => {
    const SuppliersPage = (await import('./SuppliersPage')).default;
    renderWithProviders(<SuppliersPage />);
    expect(screen.getByText('Nouveau fournisseur')).toBeInTheDocument();
    expect(screen.getByText('Inviter')).toBeInTheDocument();
    expect(screen.getByText('Filtres')).toBeInTheDocument();
  });
});
