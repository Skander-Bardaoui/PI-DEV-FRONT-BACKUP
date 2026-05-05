// src/types/permissions.types.ts

/**
 * Permission types matching backend enum
 * Each position in the permission string represents a specific permission
 */
export enum PermissionType {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
  ADD_MEMBER = 3,
  KICK_MEMBER = 4,
  PROMOTE = 5,
}

/**
 * Collaboration permissions structure
 */
export interface CollaborationPermissions {
  create_task?: boolean;
  update_task?: boolean;
  delete_task?: boolean;
  create_subtask?: boolean;
  update_subtask?: boolean;
  delete_subtask?: boolean;
  mark_complete_subtask?: boolean;
  assign_task?: boolean;
  view_all_tasks?: boolean;
  add_member?: boolean;
  kick_member?: boolean;
  promote_member?: boolean;
}

/**
 * Stock permissions structure
 */
export interface StockPermissions {
  create_product?: boolean;
  update_product?: boolean;
  delete_product?: boolean;
  create_movement?: boolean;
  delete_movement?: boolean;
  create_category?: boolean;
  update_category?: boolean;
  delete_category?: boolean;
  create_warehouse?: boolean;
  update_warehouse?: boolean;
  delete_warehouse?: boolean;
  create_reservation?: boolean;
  delete_reservation?: boolean;
  create_service?: boolean;
  update_service?: boolean;
  delete_service?: boolean;
  create_service_category?: boolean;
  update_service_category?: boolean;
  delete_service_category?: boolean;
}

/**
 * Payment permissions structure
 */
export interface PaymentPermissions {
  create_client_payment?: boolean;
  delete_client_payment?: boolean;
  create_supplier_payment?: boolean;
  delete_supplier_payment?: boolean;
  create_schedule?: boolean;
  update_schedule?: boolean;
  delete_schedule?: boolean;
  pay_installment?: boolean;
  create_account?: boolean;
  update_account?: boolean;
  delete_account?: boolean;
  create_transfer?: boolean;
  delete_transfer?: boolean;
}

/**
 * Salary permissions structure
 */
export interface SalaryPermissions {
  create_salary?: boolean;
  update_salary?: boolean;
  delete_salary?: boolean;
  send_proposal?: boolean;
  pay_salary?: boolean;
}

/**
 * Sales permissions structure
 */
export interface SalesPermissions {
  create_client?: boolean;
  update_client?: boolean;
  delete_client?: boolean;
  invite_client?: boolean;
  create_quote?: boolean;
  update_quote?: boolean;
  delete_quote?: boolean;
  send_quote?: boolean;
  convert_quote?: boolean;
  create_order?: boolean;
  update_order?: boolean;
  cancel_order?: boolean;
  create_delivery?: boolean;
  update_delivery?: boolean;
  cancel_delivery?: boolean;
  create_invoice?: boolean;
  update_invoice?: boolean;
  delete_invoice?: boolean;
  send_invoice?: boolean;
  create_recurring?: boolean;
  update_recurring?: boolean;
  delete_recurring?: boolean;
}

/**
 * Purchase permissions structure
 */
export interface PurchasePermissions {
  create_supplier?: boolean;
  update_supplier?: boolean;
  delete_supplier?: boolean;
  invite_supplier?: boolean;
  create_purchase_order?: boolean;
  update_purchase_order?: boolean;
  delete_purchase_order?: boolean;
  send_purchase_order?: boolean;
  confirm_purchase_order?: boolean;
  create_goods_receipt?: boolean;
  update_goods_receipt?: boolean;
  delete_goods_receipt?: boolean;
  validate_goods_receipt?: boolean;
  create_purchase_invoice?: boolean;
  update_purchase_invoice?: boolean;
  delete_purchase_invoice?: boolean;
  pay_purchase_invoice?: boolean;
  create_purchase_return?: boolean;
  update_purchase_return?: boolean;
  delete_purchase_return?: boolean;
  approve_purchase_return?: boolean;
}

/**
 * Business member with permissions
 */
export interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  permissions?: string; // Legacy 6-character permission string (cudakp format)
  collaboration_permissions?: CollaborationPermissions;
  stock_permissions?: StockPermissions;
  payment_permissions?: PaymentPermissions;
  salary_permissions?: SalaryPermissions; // Optional for backward compatibility
  sales_permissions?: SalesPermissions;
  purchase_permissions?: PurchasePermissions;
  is_active: boolean;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * DTO for updating member permissions
 */
export interface UpdatePermissionsDto {
  collaboration_permissions?: CollaborationPermissions;
  stock_permissions?: StockPermissions;
  payment_permissions?: PaymentPermissions;
  salary_permissions?: SalaryPermissions;
  sales_permissions?: SalesPermissions;
  purchase_permissions?: PurchasePermissions;
}

/**
 * Parsed permissions object for easier manipulation
 */
export interface ParsedPermissions {
  [PermissionType.CREATE]: boolean;
  [PermissionType.UPDATE]: boolean;
  [PermissionType.DELETE]: boolean;
  [PermissionType.ADD_MEMBER]: boolean;
  [PermissionType.KICK_MEMBER]: boolean;
  [PermissionType.PROMOTE]: boolean;
}

/**
 * Permission metadata for UI display
 */
export interface PermissionMetadata {
  label: string;
  description: string;
}

/**
 * Map of permission types to their UI metadata
 */
export const PERMISSION_LABELS: Record<PermissionType, string> = {
  [PermissionType.CREATE]: 'Create',
  [PermissionType.UPDATE]: 'Update',
  [PermissionType.DELETE]: 'Delete',
  [PermissionType.ADD_MEMBER]: 'Add Member',
  [PermissionType.KICK_MEMBER]: 'Kick Member',
  [PermissionType.PROMOTE]: 'Promote',
};

/**
 * Map of permission types to their descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<PermissionType, string> = {
  [PermissionType.CREATE]: 'Create new records and resources',
  [PermissionType.UPDATE]: 'Edit existing records and resources',
  [PermissionType.DELETE]: 'Delete records and resources',
  [PermissionType.ADD_MEMBER]: 'Invite new members to the business',
  [PermissionType.KICK_MEMBER]: 'Remove members from the business',
  [PermissionType.PROMOTE]: 'Change member roles and permissions',
};

/**
 * Role default permissions mapping
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string> = {
  BUSINESS_OWNER: 'cudakp',  // All permissions
  BUSINESS_ADMIN: 'cud---',  // Create, Update, Delete
  TEAM_MEMBER: '-u----',     // Update only
  ACCOUNTANT: '-u----',      // Update only
  CLIENT: '------',          // No permissions
  SUPPLIER: '------',        // No permissions
  PLATFORM_ADMIN: 'cudakp',  // All permissions
};
