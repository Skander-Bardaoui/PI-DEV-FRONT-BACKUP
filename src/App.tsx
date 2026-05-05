// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlatformAdminProvider } from './context/PlatformAdminContext';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Console Components
import { PlatformAdminGuard } from './console/components/PlatformAdminGuard';
import { PlatformAdminLayout } from './console/layouts/PlatformAdminLayout';
import { ConsoleLoginPage } from './console/pages/ConsoleLoginPage';
import { ConsoleTotpVerifyPage } from './console/pages/ConsoleTotpVerifyPage';
import { ConsoleDashboardPage } from './console/pages/ConsoleDashboardPage';

import { ConsoleTenantDetailPage } from './console/pages/ConsoleTenantDetailPage';
import { ConsoleSubscriptionsPage } from './console/pages/ConsoleSubscriptionsPage';
import { ConsolePlansPage } from './console/pages/ConsolePlansPage';
import { ConsoleSupportPage } from './console/pages/ConsoleSupportPage';
import { ConsoleAuditLogPage } from './console/pages/ConsoleAuditLogPage';
import AiPricingAssistantPage from './pages/platform-admin/AiPricingAssistant';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Front Office Pages
import LandingPage   from './pages/frontoffice/LandingPage';
import LoginPage     from './pages/frontoffice/LoginPage';
import RegisterPage  from './pages/frontoffice/RegisterPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import ForgotPasswordPage from './pages/frontoffice/ForgotPasswordPage';
import ResetPasswordPage from './pages/frontoffice/ResetPasswordPage';
import VerifyEmailPage from './pages/frontoffice/VerifyEmailPage';
import PricingPage   from './pages/frontoffice/PricingPage';
import ClientPortal  from './pages/frontoffice/ClientPortal';
import AcceptInvitationPage from './pages/frontoffice/AcceptInvitationPage';
import SalesOrderClientPortal from './pages/frontoffice/SalesOrderClientPortal';
import QuotePortal from './pages/frontoffice/QuotePortal';
import ClientOnboarding from './pages/frontoffice/ClientOnboarding';
import SubscriptionManagePage from './pages/frontoffice/SubscriptionManagePage';

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
// ==================== Alaa change for service type ====================
import Services       from './pages/backoffice/Services';
import ServiceCategories from './pages/backoffice/ServiceCategories';
// ====================================================================
import Categories     from './pages/backoffice/Categories';
import StockMovements from './pages/backoffice/StockMovements';
import Warehouses from './pages/backoffice/Warehouses';
import WarehouseDetail from './pages/backoffice/WarehouseDetail';
import Archive from './pages/backoffice/Archive';

// ── Module 3 — Gestion Fournisseurs & Achats ──────────────────────────────
import SuppliersPage          from './pages/backoffice/purchases/SuppliersPage';
import SupplierPOsPage        from './pages/backoffice/purchases/SupplierPOsPage';
import PurchaseInvoicesPage   from './pages/backoffice/purchases/PurchaseInvoicesPage';
import PurchasesDashboardPage from './pages/backoffice/purchases/Purchasesdashboardpage';
import GoodsReceiptsPage      from './pages/backoffice/purchases/Goodsreceiptspage';

// ── Module Ventes ──────────────────────────────────────────────────────────
import SalesDashboardPage     from './pages/backoffice/sales/SalesDashboardPage';
import QuotesPage             from './pages/backoffice/sales/QuotesPage';
import SalesOrdersPage        from './pages/backoffice/sales/SalesOrdersPage';
import DeliveryNotesPage      from './pages/backoffice/sales/DeliveryNotesPage';
import SalesInvoicesPage      from './pages/backoffice/sales/SalesInvoicesPage';
import RecurringInvoicesPage  from './pages/backoffice/sales/RecurringInvoicesPage';
import ClientsPage            from './pages/backoffice/sales/ClientsPage';

// Layout
import BackOfficeLayout from './layouts/BackOfficeLayout';
import SupplierPortalPage from './pages/backoffice/purchases/SupplierPortalPage';
import SupplierRankingPage from './pages/backoffice/purchases/SupplierRankingPage';
import AccountsPage from './pages/backoffice/treasury/AccountsPage';
import TreasuryInvoicesPage from './components/treasury/TreasuryInvoicesPage';
import ExpensesToPayPage from './components/treasury/ExpensesToPayPage';
import Transactions from './components/treasury/Transactions';
import RecurringInvoices from './components/treasury/RecurringInvoices';

import SupplierIntelligencePage from './pages/backoffice/purchases/SupplierIntelligencePage';
import ThreeWayMatchingPage from './pages/backoffice/purchases/ThreeWayMatchingPage';
import SupplierRegisterPage from './pages/frontoffice/SupplierRegisterPage';
import MLPredictionsPage from './pages/backoffice/purchases/MLPredictionsPage';
import SalaryToPayPage from './components/treasury/SalaryToPayPage';
import SalaryRespondPage from './pages/frontoffice/SalaryRespondPage';
import SupplierScheduleResponsePage from './pages/frontoffice/SupplierScheduleResponsePage';
import { ConsoleTenantsPage } from './console/pages/ConsoleTenantsPage';

// Inner component to access accessibility context
function AppContent() {
  const { isFingerScrollActive, toggleFingerScroll } = useAccessibility();
  const { t } = useTranslation();

  return (
    <>
      {/* Sonner Toast Notifications */}
      <Toaster 
        position="bottom-right" 
        richColors 
        closeButton 
      />


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
        <Route path="/pay/:token" element={<PaymentPage />} />
        <Route path="/pay/:token/success" element={<PaymentSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/pricing" element={<PricingPage />}  />
        <Route path="/supplier-portal" element={<SupplierPortalPage />} />
        <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
        <Route path="/client-portal" element={<SalesOrderClientPortal />} />
        <Route path="/subscription-manage" element={<SubscriptionManagePage />} />
        <Route path="/quote-portal" element={<QuotePortal />} />
        <Route path="/supplier-register" element={<SupplierRegisterPage />} />
        <Route path="/salary-respond/:token" element={<SalaryRespondPage />}  />
        <Route path="/supplier/schedule/:token/:action" element={<SupplierScheduleResponsePage />}/>

        <Route path="/client-onboarding/:token" element={<ClientOnboarding />} />

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
          {/* ==================== Alaa change for service type ==================== */}
          <Route path="stock/services"    element={<Services />}       />
          <Route path="stock/service-categories" element={<ServiceCategories />} />
          {/* ==================================================================== */}
          <Route path="stock/categories"  element={<Categories />}     />
          <Route path="stock/movements"   element={<StockMovements />} />
          {/* Archive - Only for BUSINESS_OWNER and BUSINESS_ADMIN */}
          <Route 
            path="stock/archive" 
            element={
              <ProtectedRoute allowedRoles={[Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN]}>
                <Archive />
              </ProtectedRoute>
            } 
          />
          <Route path="warehouses"        element={<Warehouses />}     />
          <Route path="warehouses/:id"    element={<WarehouseDetail />} />

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
          <Route path="purchases/supplier-ranking" element={<SupplierRankingPage />} />
          <Route path="purchases/supplier-intelligence" element={<SupplierIntelligencePage />} />
          <Route path="purchases/three-way-matching" element={<ThreeWayMatchingPage />} />
          <Route path="purchases/three-way-matching/:invoiceId" element={<ThreeWayMatchingPage />} />
          <Route path="purchases/ml-predictions" element={<MLPredictionsPage />} />


          {/*treasury*/}
          <Route path="/app/treasury/accounts" element={<AccountsPage />} />

          {/*treasury*/}
          <Route path="treasury/accounts" element={<AccountsPage />} />
          <Route path="treasury/invoices" element={<TreasuryInvoicesPage />} />
          <Route path="treasury/expenses" element={<ExpensesToPayPage />} />
          <Route path="treasury/transactions" element={<Transactions />} />
          <Route path="treasury/salaries" element={<SalaryToPayPage />} />
          <Route path="treasury/recurring-invoices" element={<RecurringInvoices />} />


          {/* ── Module Ventes ──────────────────────────────────────── */}
          <Route path="sales/dashboard"          element={<SalesDashboardPage />}     />
          <Route path="sales/clients"            element={<ClientsPage />}            />
          <Route path="sales/quotes"             element={<QuotesPage />}             />
          <Route path="sales/orders"             element={<SalesOrdersPage />}        />
          <Route path="sales/delivery-notes"     element={<DeliveryNotesPage />}      />
          <Route path="sales/invoices"           element={<SalesInvoicesPage />}      />
          <Route path="sales/recurring-invoices" element={<RecurringInvoicesPage />}  />
        </Route>

        {/* ─── Platform Admin Console Routes ──────────────────────── */}
        <Route path="/console/login" element={<ConsoleLoginPage />} />
        <Route path="/console/totp-verify" element={<ConsoleTotpVerifyPage />} />
        <Route
          path="/console/*"
          element={
            <PlatformAdminGuard>
              <PlatformAdminLayout />
            </PlatformAdminGuard>
          }
        >
          <Route index element={<Navigate to="/console/dashboard" replace />} />
          <Route path="dashboard" element={<ConsoleDashboardPage />} />
          <Route path="tenants" element={<ConsoleTenantsPage />} />
          <Route path="tenants/:id" element={<ConsoleTenantDetailPage />} />
          <Route path="subscriptions" element={<ConsoleSubscriptionsPage />} />
          <Route path="subscriptions/overdue" element={<ConsoleSubscriptionsPage />} />
          <Route path="plans" element={<ConsolePlansPage />} />
          <Route path="ai-pricing" element={<AiPricingAssistantPage />} />
          <Route path="support" element={<ConsoleSupportPage />} />
          <Route path="audit-log" element={<ConsoleAuditLogPage />} />
        </Route>

        {/* ─── Catch-all redirect ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AuthProvider>
          <PlatformAdminProvider>
            <AppContent />
          </PlatformAdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
