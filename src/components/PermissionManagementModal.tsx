// src/components/PermissionManagementModal.tsx

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Users, Package, CreditCard, CheckCircle2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { permissionsApi } from '../api/permissions.api';
import { BusinessMember, CollaborationPermissions, StockPermissions, PaymentPermissions, SalesPermissions, PurchasePermissions } from '../types/permissions.types';
import { useToast } from './ui/Toast';

interface PermissionManagementModalProps {
  member: BusinessMember;
  businessId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal component for managing member permissions with granular controls
 * Displays two sections: Collaboration and Stock Management
 * Each section has specific toggles for each permission type
 * 
 * BUSINESS_OWNER permissions cannot be modified - they always have full access
 */
export function PermissionManagementModal({
  member,
  businessId,
  isOpen,
  onClose,
  onSuccess,
}: PermissionManagementModalProps) {
  // Check if member is BUSINESS_OWNER - their permissions cannot be modified
  const isBusinessOwner = member.role === 'BUSINESS_OWNER';

  const [collaborationPermissions, setCollaborationPermissions] = useState<CollaborationPermissions>(
    member.collaboration_permissions || {
      create_task: false,
      update_task: false,
      delete_task: false,
      create_subtask: false,
      update_subtask: false,
      delete_subtask: false,
      mark_complete_subtask: false,
      add_member: false,
      kick_member: false,
      promote_member: false,
    }
  );

  const [stockPermissions, setStockPermissions] = useState<StockPermissions>(
    member.stock_permissions || {
      create_product: false,
      update_product: false,
      delete_product: false,
      create_movement: false,
      delete_movement: false,
      create_category: false,
      update_category: false,
      delete_category: false,
      create_warehouse: false,
      update_warehouse: false,
      delete_warehouse: false,
      create_reservation: false,
      delete_reservation: false,
      create_service: false,
      update_service: false,
      delete_service: false,
      create_service_category: false,
      update_service_category: false,
      delete_service_category: false,
    }
  );

  const [paymentPermissions, setPaymentPermissions] = useState<PaymentPermissions>(
    member.payment_permissions || {
      create_client_payment: false,
      delete_client_payment: false,
      create_supplier_payment: false,
      delete_supplier_payment: false,
      create_schedule: false,
      update_schedule: false,
      delete_schedule: false,
      pay_installment: false,
      create_account: false,
      update_account: false,
      delete_account: false,
      create_transfer: false,
      delete_transfer: false,
    }
  );

  const [salesPermissions, setSalesPermissions] = useState<SalesPermissions>(
    member.sales_permissions || {
      create_client: false,
      update_client: false,
      delete_client: false,
      invite_client: false,
      create_quote: false,
      update_quote: false,
      delete_quote: false,
      send_quote: false,
      convert_quote: false,
      create_order: false,
      update_order: false,
      cancel_order: false,
      create_delivery: false,
      update_delivery: false,
      cancel_delivery: false,
      create_invoice: false,
      update_invoice: false,
      delete_invoice: false,
      send_invoice: false,
      create_recurring: false,
      update_recurring: false,
      delete_recurring: false,
    }
  );

  const [purchasePermissions, setPurchasePermissions] = useState<PurchasePermissions>(
    member.purchase_permissions || {
      create_supplier: false,
      update_supplier: false,
      delete_supplier: false,
      invite_supplier: false,
      create_purchase_order: false,
      update_purchase_order: false,
      delete_purchase_order: false,
      send_purchase_order: false,
      confirm_purchase_order: false,
      create_goods_receipt: false,
      update_goods_receipt: false,
      delete_goods_receipt: false,
      validate_goods_receipt: false,
      create_purchase_invoice: false,
      update_purchase_invoice: false,
      delete_purchase_invoice: false,
      pay_purchase_invoice: false,
      create_purchase_return: false,
      update_purchase_return: false,
      delete_purchase_return: false,
      approve_purchase_return: false,
    }
  );

  const queryClient = useQueryClient();
  const toast = useToast();

  // Mutation for updating permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: () =>
      permissionsApi.updateMemberPermissions(
        businessId,
        member.user_id,
        collaborationPermissions,
        stockPermissions,
        paymentPermissions,
        salesPermissions,
        purchasePermissions
      ),
    onSuccess: () => {
      // Invalidate business members cache to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['business-members', businessId],
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      toast.success('Permissions updated', `${member.user.firstName}'s permissions have been updated successfully`);
      onClose();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update permissions';
      toast.error('Error', errorMessage);
    },
  });

  // Handle collaboration permission toggle
  const handleCollaborationToggle = (key: keyof CollaborationPermissions) => {
    setCollaborationPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle stock permission toggle
  const handleStockToggle = (key: keyof StockPermissions) => {
    setStockPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle payment permission toggle
  const handlePaymentToggle = (key: keyof PaymentPermissions) => {
    setPaymentPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle sales permission toggle
  const handleSalesToggle = (key: keyof SalesPermissions) => {
    setSalesPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle purchase permission toggle
  const handlePurchaseToggle = (key: keyof PurchasePermissions) => {
    setPurchasePermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle save button click
  const handleSave = () => {
    updatePermissionsMutation.mutate();
  };

  // Check if anything changed
  const hasChanges =
    JSON.stringify(collaborationPermissions) !== JSON.stringify(member.collaboration_permissions) ||
    JSON.stringify(stockPermissions) !== JSON.stringify(member.stock_permissions) ||
    JSON.stringify(paymentPermissions) !== JSON.stringify(member.payment_permissions) ||
    JSON.stringify(salesPermissions) !== JSON.stringify(member.sales_permissions) ||
    JSON.stringify(purchasePermissions) !== JSON.stringify(member.purchase_permissions);

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // If member is BUSINESS_OWNER, show read-only view
  if (isBusinessOwner) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Business Owner Permissions</h2>
              <p className="text-sm text-gray-600 mt-1">
                {member.user.firstName} {member.user.lastName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Full Access Granted
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Business owners have full access to all features across all modules. 
              Their permissions cannot be modified to ensure proper business management.
            </p>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                ✓ All Collaboration Features<br />
                ✓ All Stock Management Features<br />
                ✓ All Payment Management Features<br />
                ✓ All Sales Management Features<br />
                ✓ All Purchases Management Features
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure permissions for {member.user.firstName} {member.user.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={updatePermissionsMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Collaboration Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">🤝 Collaboration</h3>
            </div>

            {/* Tasks Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tasks</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Task"
                  description="create new tasks in kanban"
                  isGranted={collaborationPermissions.create_task}
                  onToggle={() => handleCollaborationToggle('create_task')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Task"
                  description="edit and move tasks"
                  isGranted={collaborationPermissions.update_task}
                  onToggle={() => handleCollaborationToggle('update_task')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Task"
                  description="delete tasks permanently"
                  isGranted={collaborationPermissions.delete_task}
                  onToggle={() => handleCollaborationToggle('delete_task')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Subtasks Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Subtasks</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Subtask"
                  description="create subtasks and generate with AI"
                  isGranted={collaborationPermissions.create_subtask}
                  onToggle={() => handleCollaborationToggle('create_subtask')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Subtask"
                  description="edit and toggle subtask completion"
                  isGranted={collaborationPermissions.update_subtask}
                  onToggle={() => handleCollaborationToggle('update_subtask')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Subtask"
                  description="delete subtasks permanently"
                  isGranted={collaborationPermissions.delete_subtask}
                  onToggle={() => handleCollaborationToggle('delete_subtask')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Mark Complete Subtask"
                  description="mark subtasks as complete (team member action)"
                  isGranted={collaborationPermissions.mark_complete_subtask}
                  onToggle={() => handleCollaborationToggle('mark_complete_subtask')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Members Subsection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Members</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Add Member"
                  description="invite new members"
                  isGranted={collaborationPermissions.add_member}
                  onToggle={() => handleCollaborationToggle('add_member')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Kick Member"
                  description="remove members"
                  isGranted={collaborationPermissions.kick_member}
                  onToggle={() => handleCollaborationToggle('kick_member')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Promote Member"
                  description="change member roles"
                  isGranted={collaborationPermissions.promote_member}
                  onToggle={() => handleCollaborationToggle('promote_member')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Stock Management Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">📦 Stock Management</h3>
            </div>

            {/* Products Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Products</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Product"
                  description="add new products"
                  isGranted={stockPermissions.create_product}
                  onToggle={() => handleStockToggle('create_product')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Product"
                  description="edit product details"
                  isGranted={stockPermissions.update_product}
                  onToggle={() => handleStockToggle('update_product')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Product"
                  description="delete products"
                  isGranted={stockPermissions.delete_product}
                  onToggle={() => handleStockToggle('delete_product')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Stock Movements Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Stock Movements</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Movement"
                  description="add stock entries and exits"
                  isGranted={stockPermissions.create_movement}
                  onToggle={() => handleStockToggle('create_movement')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Movement"
                  description="cancel stock movements"
                  isGranted={stockPermissions.delete_movement}
                  onToggle={() => handleStockToggle('delete_movement')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Categories Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Categories</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Category"
                  description="add categories"
                  isGranted={stockPermissions.create_category}
                  onToggle={() => handleStockToggle('create_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Category"
                  description="edit categories"
                  isGranted={stockPermissions.update_category}
                  onToggle={() => handleStockToggle('update_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Category"
                  description="delete categories"
                  isGranted={stockPermissions.delete_category}
                  onToggle={() => handleStockToggle('delete_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Warehouses Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Warehouses</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Warehouse"
                  description="add warehouses"
                  isGranted={stockPermissions.create_warehouse}
                  onToggle={() => handleStockToggle('create_warehouse')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Warehouse"
                  description="edit warehouses"
                  isGranted={stockPermissions.update_warehouse}
                  onToggle={() => handleStockToggle('update_warehouse')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Warehouse"
                  description="delete warehouses"
                  isGranted={stockPermissions.delete_warehouse}
                  onToggle={() => handleStockToggle('delete_warehouse')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Reservations Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Reservations</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Reservation"
                  description="reserve stock"
                  isGranted={stockPermissions.create_reservation}
                  onToggle={() => handleStockToggle('create_reservation')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Reservation"
                  description="cancel reservations"
                  isGranted={stockPermissions.delete_reservation}
                  onToggle={() => handleStockToggle('delete_reservation')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Services Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Services</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Service"
                  description="add new services"
                  isGranted={stockPermissions.create_service}
                  onToggle={() => handleStockToggle('create_service')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Service"
                  description="edit service details"
                  isGranted={stockPermissions.update_service}
                  onToggle={() => handleStockToggle('update_service')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Service"
                  description="delete services"
                  isGranted={stockPermissions.delete_service}
                  onToggle={() => handleStockToggle('delete_service')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Service Categories Subsection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Service Categories</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Service Category"
                  description="add service categories"
                  isGranted={stockPermissions.create_service_category}
                  onToggle={() => handleStockToggle('create_service_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Service Category"
                  description="edit service categories"
                  isGranted={stockPermissions.update_service_category}
                  onToggle={() => handleStockToggle('update_service_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Service Category"
                  description="delete service categories"
                  isGranted={stockPermissions.delete_service_category}
                  onToggle={() => handleStockToggle('delete_service_category')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Payment Management Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">💳 Payment Management</h3>
            </div>

            {/* Client Payments Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Client Payments</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Client Payment"
                  description="register client invoice payments"
                  isGranted={paymentPermissions.create_client_payment}
                  onToggle={() => handlePaymentToggle('create_client_payment')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Client Payment"
                  description="cancel client payments"
                  isGranted={paymentPermissions.delete_client_payment}
                  onToggle={() => handlePaymentToggle('delete_client_payment')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Supplier Payments Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Supplier Payments</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Supplier Payment"
                  description="register supplier invoice payments"
                  isGranted={paymentPermissions.create_supplier_payment}
                  onToggle={() => handlePaymentToggle('create_supplier_payment')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Supplier Payment"
                  description="cancel supplier payments"
                  isGranted={paymentPermissions.delete_supplier_payment}
                  onToggle={() => handlePaymentToggle('delete_supplier_payment')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Payment Schedules Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Schedules</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Schedule"
                  description="create installment schedules"
                  isGranted={paymentPermissions.create_schedule}
                  onToggle={() => handlePaymentToggle('create_schedule')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Schedule"
                  description="modify installment schedules"
                  isGranted={paymentPermissions.update_schedule}
                  onToggle={() => handlePaymentToggle('update_schedule')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Schedule"
                  description="delete installment schedules"
                  isGranted={paymentPermissions.delete_schedule}
                  onToggle={() => handlePaymentToggle('delete_schedule')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Pay Installment"
                  description="record payment for an installment"
                  isGranted={paymentPermissions.pay_installment}
                  onToggle={() => handlePaymentToggle('pay_installment')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Bank Accounts Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Bank Accounts</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Account"
                  description="add bank accounts"
                  isGranted={paymentPermissions.create_account}
                  onToggle={() => handlePaymentToggle('create_account')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Account"
                  description="edit bank accounts"
                  isGranted={paymentPermissions.update_account}
                  onToggle={() => handlePaymentToggle('update_account')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Account"
                  description="delete bank accounts"
                  isGranted={paymentPermissions.delete_account}
                  onToggle={() => handlePaymentToggle('delete_account')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Transfers Subsection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Transfers</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Transfer"
                  description="create internal transfers"
                  isGranted={paymentPermissions.create_transfer}
                  onToggle={() => handlePaymentToggle('create_transfer')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Transfer"
                  description="cancel internal transfers"
                  isGranted={paymentPermissions.delete_transfer}
                  onToggle={() => handlePaymentToggle('delete_transfer')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Sales Management Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">🛒 Sales Management</h3>
            </div>

            {/* Clients Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Clients</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Client"
                  description="add new clients"
                  isGranted={salesPermissions.create_client}
                  onToggle={() => handleSalesToggle('create_client')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Client"
                  description="edit client information"
                  isGranted={salesPermissions.update_client}
                  onToggle={() => handleSalesToggle('update_client')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Client"
                  description="delete clients"
                  isGranted={salesPermissions.delete_client}
                  onToggle={() => handleSalesToggle('delete_client')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Invite Client"
                  description="send portal invitation to client"
                  isGranted={salesPermissions.invite_client}
                  onToggle={() => handleSalesToggle('invite_client')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Quotes Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quotes</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Quote"
                  description="create new quotes"
                  isGranted={salesPermissions.create_quote}
                  onToggle={() => handleSalesToggle('create_quote')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Quote"
                  description="edit draft quotes"
                  isGranted={salesPermissions.update_quote}
                  onToggle={() => handleSalesToggle('update_quote')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Quote"
                  description="delete quotes"
                  isGranted={salesPermissions.delete_quote}
                  onToggle={() => handleSalesToggle('delete_quote')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Send Quote"
                  description="send quote by email to client"
                  isGranted={salesPermissions.send_quote}
                  onToggle={() => handleSalesToggle('send_quote')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Convert Quote"
                  description="convert quote to order or invoice"
                  isGranted={salesPermissions.convert_quote}
                  onToggle={() => handleSalesToggle('convert_quote')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Sales Orders Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales Orders</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Order"
                  description="create new sales orders"
                  isGranted={salesPermissions.create_order}
                  onToggle={() => handleSalesToggle('create_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Order"
                  description="edit confirmed orders"
                  isGranted={salesPermissions.update_order}
                  onToggle={() => handleSalesToggle('update_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Cancel Order"
                  description="cancel sales orders"
                  isGranted={salesPermissions.cancel_order}
                  onToggle={() => handleSalesToggle('cancel_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Delivery Notes Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Delivery Notes</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Delivery"
                  description="create delivery notes"
                  isGranted={salesPermissions.create_delivery}
                  onToggle={() => handleSalesToggle('create_delivery')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Delivery"
                  description="edit delivery notes"
                  isGranted={salesPermissions.update_delivery}
                  onToggle={() => handleSalesToggle('update_delivery')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Cancel Delivery"
                  description="cancel deliveries"
                  isGranted={salesPermissions.cancel_delivery}
                  onToggle={() => handleSalesToggle('cancel_delivery')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Invoices Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Invoices</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Invoice"
                  description="create new invoices"
                  isGranted={salesPermissions.create_invoice}
                  onToggle={() => handleSalesToggle('create_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Invoice"
                  description="edit draft invoices"
                  isGranted={salesPermissions.update_invoice}
                  onToggle={() => handleSalesToggle('update_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Invoice"
                  description="delete invoices"
                  isGranted={salesPermissions.delete_invoice}
                  onToggle={() => handleSalesToggle('delete_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Send Invoice"
                  description="send invoice by email to client"
                  isGranted={salesPermissions.send_invoice}
                  onToggle={() => handleSalesToggle('send_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Recurring Invoices Subsection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Recurring Invoices</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Recurring"
                  description="create recurring invoice templates"
                  isGranted={salesPermissions.create_recurring}
                  onToggle={() => handleSalesToggle('create_recurring')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Recurring"
                  description="edit recurring templates"
                  isGranted={salesPermissions.update_recurring}
                  onToggle={() => handleSalesToggle('update_recurring')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Recurring"
                  description="delete recurring templates"
                  isGranted={salesPermissions.delete_recurring}
                  onToggle={() => handleSalesToggle('delete_recurring')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Purchases Management Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">🛒 Purchases Management</h3>
            </div>

            {/* Suppliers Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Suppliers</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Supplier"
                  description="add new suppliers"
                  isGranted={purchasePermissions.create_supplier}
                  onToggle={() => handlePurchaseToggle('create_supplier')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Supplier"
                  description="edit supplier information"
                  isGranted={purchasePermissions.update_supplier}
                  onToggle={() => handlePurchaseToggle('update_supplier')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Supplier"
                  description="delete suppliers"
                  isGranted={purchasePermissions.delete_supplier}
                  onToggle={() => handlePurchaseToggle('delete_supplier')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Invite Supplier"
                  description="send portal invitation to supplier"
                  isGranted={purchasePermissions.invite_supplier}
                  onToggle={() => handlePurchaseToggle('invite_supplier')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Purchase Orders Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchase Orders</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Order"
                  description="create new purchase orders"
                  isGranted={purchasePermissions.create_purchase_order}
                  onToggle={() => handlePurchaseToggle('create_purchase_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Order"
                  description="edit draft purchase orders"
                  isGranted={purchasePermissions.update_purchase_order}
                  onToggle={() => handlePurchaseToggle('update_purchase_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Order"
                  description="delete purchase orders"
                  isGranted={purchasePermissions.delete_purchase_order}
                  onToggle={() => handlePurchaseToggle('delete_purchase_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Send Order"
                  description="send purchase order by email to supplier"
                  isGranted={purchasePermissions.send_purchase_order}
                  onToggle={() => handlePurchaseToggle('send_purchase_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Confirm Order"
                  description="confirm a purchase order"
                  isGranted={purchasePermissions.confirm_purchase_order}
                  onToggle={() => handlePurchaseToggle('confirm_purchase_order')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Goods Receipts Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Goods Receipts</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Receipt"
                  description="create goods receipts"
                  isGranted={purchasePermissions.create_goods_receipt}
                  onToggle={() => handlePurchaseToggle('create_goods_receipt')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Receipt"
                  description="edit goods receipts"
                  isGranted={purchasePermissions.update_goods_receipt}
                  onToggle={() => handlePurchaseToggle('update_goods_receipt')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Receipt"
                  description="delete goods receipts"
                  isGranted={purchasePermissions.delete_goods_receipt}
                  onToggle={() => handlePurchaseToggle('delete_goods_receipt')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Validate Receipt"
                  description="validate receipt (updates stock)"
                  isGranted={purchasePermissions.validate_goods_receipt}
                  onToggle={() => handlePurchaseToggle('validate_goods_receipt')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Purchase Invoices Subsection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchase Invoices</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Invoice"
                  description="create or import supplier invoices"
                  isGranted={purchasePermissions.create_purchase_invoice}
                  onToggle={() => handlePurchaseToggle('create_purchase_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Invoice"
                  description="edit supplier invoices"
                  isGranted={purchasePermissions.update_purchase_invoice}
                  onToggle={() => handlePurchaseToggle('update_purchase_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Invoice"
                  description="delete supplier invoices"
                  isGranted={purchasePermissions.delete_purchase_invoice}
                  onToggle={() => handlePurchaseToggle('delete_purchase_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Pay Invoice"
                  description="record a payment for an invoice"
                  isGranted={purchasePermissions.pay_purchase_invoice}
                  onToggle={() => handlePurchaseToggle('pay_purchase_invoice')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>

            {/* Purchase Returns Subsection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchase Returns</h4>
              <div className="space-y-3">
                <PermissionToggle
                  label="Create Return"
                  description="create supplier return requests"
                  isGranted={purchasePermissions.create_purchase_return}
                  onToggle={() => handlePurchaseToggle('create_purchase_return')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Update Return"
                  description="edit return requests"
                  isGranted={purchasePermissions.update_purchase_return}
                  onToggle={() => handlePurchaseToggle('update_purchase_return')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Delete Return"
                  description="delete return requests"
                  isGranted={purchasePermissions.delete_purchase_return}
                  onToggle={() => handlePurchaseToggle('delete_purchase_return')}
                  disabled={updatePermissionsMutation.isPending}
                />
                <PermissionToggle
                  label="Approve Return"
                  description="approve, ship, or refund returns"
                  isGranted={purchasePermissions.approve_purchase_return}
                  onToggle={() => handlePurchaseToggle('approve_purchase_return')}
                  disabled={updatePermissionsMutation.isPending}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            disabled={updatePermissionsMutation.isPending}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending || !hasChanges}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {updatePermissionsMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable toggle component
interface PermissionToggleProps {
  label: string;
  description: string;
  isGranted: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function PermissionToggle({ label, description, isGranted, onToggle, disabled }: PermissionToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex-1">
        <label className="block text-sm font-semibold text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* Toggle Switch */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${
            isGranted
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          role="switch"
          aria-checked={isGranted}
          aria-label={`Toggle ${label} permission`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isGranted ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
