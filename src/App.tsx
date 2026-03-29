// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AccessibilityButton from './components/AccessibilityButton';
import AccessibilityPanel from './components/AccessibilityPanel';
import FingerScrollControl from './components/FingerScrollControl';
import TextToSpeechReader from './components/TextToSpeechReader';
import FocusModeManager from './components/FocusModeManager';
import { useAccessibility } from './context/AccessibilityContext';
import { Role } from './types/auth.types';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';

// Front Office Pages
import LandingPage   from './pages/frontoffice/LandingPage';
import LoginPage     from './pages/frontoffice/LoginPage';
import RegisterPage  from './pages/frontoffice/RegisterPage';
import PricingPage   from './pages/frontoffice/PricingPage';
import ClientPortal  from './pages/frontoffice/ClientPortal';
import AcceptInvitationPage from './pages/frontoffice/AcceptInvitationPage';
import SalesOrderClientPortal from './pages/frontoffice/SalesOrderClientPortal';

// Back Office Pages
import Dashboard     from './pages/backoffice/Dashboard';
import Clients       from './pages/backoffice/Clients';
import Invoices      from './pages/backoffice/Invoices';
import Expenses      from './pages/backoffice/Expenses';
import Reports       from './pages/backoffice/Reports';
import Team          from './pages/backoffice/Team';
import Collaboration from './pages/backoffice/Collaboration';
import Settings      from './pages/backoffice/Settings';

// Stock Management Pages
import StockDashboard from './pages/backoffice/StockDashboard';
import Products       from './pages/backoffice/Products';
import Categories     from './pages/backoffice/Categories';
import StockMovements from './pages/backoffice/StockMovements';

// ── Module 3 — Gestion Fournisseurs & Achats ──────────────────────────────
import SuppliersPage          from './pages/backoffice/purchases/SuppliersPage';
import SupplierPOsPage        from './pages/backoffice/purchases/SupplierPOsPage';
import PurchaseInvoicesPage   from './pages/backoffice/purchases/PurchaseInvoicesPage';
import SupplierPaymentsPage   from './pages/backoffice/purchases/SupplierPaymentsPage';
import PurchasesDashboardPage from './pages/backoffice/purchases/Purchasesdashboardpage';
import GoodsReceiptsPage      from './pages/backoffice/purchases/Goodsreceiptspage';

// ── Module Ventes ──────────────────────────────────────────────────────────
import SalesDashboardPage     from './pages/backoffice/sales/SalesDashboardPage';
import QuotesPage             from './pages/backoffice/sales/QuotesPage';
import SalesOrdersPage        from './pages/backoffice/sales/SalesOrdersPage';
import DeliveryNotesPage      from './pages/backoffice/sales/DeliveryNotesPage';
import SalesInvoicesPage      from './pages/backoffice/sales/SalesInvoicesPage';
import RecurringInvoicesPage  from './pages/backoffice/sales/RecurringInvoicesPage';

// Layout
import BackOfficeLayout from './layouts/BackOfficeLayout';
import SupplierPortalPage from './pages/backoffice/purchases/SupplierPortalPage';
import SupplierRankingPage from './pages/backoffice/purchases/SupplierRankingPage';
import AccountsPage from './pages/backoffice/treasury/AccountsPage';
import TreasuryInvoicesPage from './components/treasury/TreasuryInvoicesPage';
import ExpensesToPayPage from './components/treasury/ExpensesToPayPage';
import Transactions from './components/treasury/Transactions';

import SupplierIntelligencePage from './pages/backoffice/purchases/SupplierIntelligencePage';
import ThreeWayMatchingPage from './pages/backoffice/purchases/ThreeWayMatchingPage';
import SupplierRegisterPage from './pages/frontoffice/SupplierRegisterPage';

// Inner component to access accessibility context
function AppContent() {
  const { isFingerScrollActive, toggleFingerScroll } = useAccessibility();
  const { t } = useTranslation();

  return (
    <>
      {/* Sonner Toast Notifications */}
      <Toaster position="bottom-right" richColors closeButton />
      
      
      {/* Accessibility Components - Available on all pages */}
      <AccessibilityButton />
      <AccessibilityPanel />
      <TextToSpeechReader />
      <FocusModeManager />

      {/* Finger Scroll Control - Rendered at app level, independent of panel */}
      <FingerScrollControl
        isActive={isFingerScrollActive}
        onClose={toggleFingerScroll}
      />

      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-to-content">
        {t('accessibility.skipToContent', { defaultValue: 'Aller au contenu principal' })}
      </a>

      <Routes>
        {/* ─── Public Routes ───────────────────────────────────────── */}
        <Route path="/"        element={<LandingPage />}  />
        <Route path="/login"   element={<LoginPage />}    />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />}  />
        <Route path="/supplier-portal" element={<SupplierPortalPage />} />
        <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
        <Route path="/client-portal" element={<SalesOrderClientPortal />} />
        <Route path="/supplier-register" element={<SupplierRegisterPage />} />

        {/* ─── Client Portal (CLIENT role only) ───────────────────── */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={[Role.CLIENT]}>
              <ClientPortal />
            </ProtectedRoute>
          }
        />

        {/* ─── Back Office (all roles except CLIENT) ──────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute
              allowedRoles={[
                Role.PLATFORM_ADMIN,
                Role.BUSINESS_OWNER,
                Role.BUSINESS_ADMIN,
                Role.ACCOUNTANT,
                Role.TEAM_MEMBER,
              ]}
            >
              <BackOfficeLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes inside BackOfficeLayout */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />}   />
          <Route path="clients"     element={<Clients />}     />
          <Route path="invoices"    element={<Invoices />}    />
          <Route path="expenses"    element={<Expenses />}    />

          {/* Stock Management Routes */}
          <Route path="stock"             element={<StockDashboard />} />
          <Route path="stock/products"    element={<Products />}       />
          <Route path="stock/categories"  element={<Categories />}     />
          <Route path="stock/movements"   element={<StockMovements />} />

          <Route path="reports"       element={<Reports />}       />
          <Route path="team"          element={<Team />}          />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="settings"      element={<Settings />}      />

          {/* ── Module 3 — Achats ─────────────────────────────────── */}
          <Route path="purchases/dashboard"       element={<PurchasesDashboardPage />} />
          <Route path="purchases/suppliers"       element={<SuppliersPage />}          />
          <Route path="purchases/orders"          element={<SupplierPOsPage />}        />
          <Route path="purchases/goods-receipts"  element={<GoodsReceiptsPage />}      />
          <Route path="purchases/invoices"        element={<PurchaseInvoicesPage />}   />
          <Route path="purchases/payments"        element={<SupplierPaymentsPage />}   />
          <Route path="purchases/supplier-ranking" element={<SupplierRankingPage />} />
          <Route path="purchases/supplier-intelligence" element={<SupplierIntelligencePage />} />
          <Route path="purchases/three-way-matching" element={<ThreeWayMatchingPage />} />
          <Route path="purchases/three-way-matching/:invoiceId" element={<ThreeWayMatchingPage />} />

          {/*treasury*/}
          <Route path="/app/treasury/accounts" element={<AccountsPage />} />

          {/*treasury*/}
          <Route path="treasury/accounts" element={<AccountsPage />} />
          <Route path="treasury/invoices" element={<TreasuryInvoicesPage />} />
          <Route path="treasury/expenses" element={<ExpensesToPayPage />} />
          <Route path="treasury/transactions" element={<Transactions />} />

          {/* ── Module Ventes ──────────────────────────────────────── */}
          <Route path="sales/dashboard"          element={<SalesDashboardPage />}     />
          <Route path="sales/quotes"             element={<QuotesPage />}             />
          <Route path="sales/orders"             element={<SalesOrdersPage />}        />
          <Route path="sales/delivery-notes"     element={<DeliveryNotesPage />}      />
          <Route path="sales/invoices"           element={<SalesInvoicesPage />}      />
          <Route path="sales/recurring-invoices" element={<RecurringInvoicesPage />}  />
        </Route>

        {/* ─── Catch-all redirect ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
