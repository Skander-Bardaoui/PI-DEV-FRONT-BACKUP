// src/types/console.types.ts

export interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  status: 'active' | 'inactive' | 'suspended';
  ownerId: string;
  owner: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  billingPlan: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  businessCount?: number;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  tenant: Tenant;
  plan_id: string;
  plan: Plan;
  status: 'pending_payment' | 'payment_submitted' | 'trial' | 'active' | 'overdue' | 'suspended' | 'cancelled';
  billing_cycle: 'monthly' | 'annual';
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string;
  cancelled_at?: string;
  suspended_at?: string;
  payment_method?: string;
  last_payment_at?: string;
  next_billing_at?: string;
  notes?: string;
  payment_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  max_users?: number;
  max_businesses?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    pendingApproval: number;
    newThisMonth: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    overdueAmount: number;
    newMrrThisMonth: number;
  };
  users: {
    total: number;
    newThisMonth: number;
  };
  churnRate: number;
  trialConversionRate: number;
}

export interface RevenueTrendItem {
  month: string;
  mrr: number;
  newTenants: number;
  churned: number;
}

export interface PlanBreakdownItem {
  planId: string;
  planName: string;
  tenantCount: number;
  monthlyRevenue: number;
  percentageOfTotal: number;
}

export interface SystemHealth {
  database: 'ok' | 'degraded';
  dbResponseMs: number;
  totalTenants: number;
  activeConnections: number;
  uptime: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin: {
    id: string;
    email: string;
  };
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  ip_address: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  tenant_id: string;
  tenant: {
    id: string;
    name: string;
  };
  submitted_by_id: string;
  submitted_by: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to_id?: string;
  assigned_to?: {
    id: string;
    email: string;
  };
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantApproval {
  id: string;
  tenant_id: string;
  tenant: Tenant;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_id?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
