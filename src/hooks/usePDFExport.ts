
import { useState, useCallback } from 'react';
import { useAuth }           from './useAuth';
import { GoodsReceipt, PurchaseInvoice, Supplier, SupplierPO } from '@/types';
import { getBusinessInfo } from '@/utils/business-info.utils';


export const usePDFExport = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const withLoading = useCallback(async (fn: () => Promise<void> | void) => {
    setLoading(true);
    try { await fn(); }
    catch (err) { console.error('[PDF]', err); alert('Erreur lors de la génération du PDF'); }
    finally { setLoading(false); }
  }, []);

  const exportBC = useCallback((po: SupplierPO) =>
    withLoading(async () => {
      const { businessName, businessMF } = await getBusinessInfo(user);
      const { printSupplierPO } = await import('../utils/supplier-po-print');
      printSupplierPO(po, businessName, businessMF);
    }), [user, withLoading]);

  const exportBR = useCallback((gr: GoodsReceipt) =>
    withLoading(async () => {
      const { businessName, businessMF } = await getBusinessInfo(user);
      const { printGoodsReceipt } = await import('../utils/goods-receipt-print');
      printGoodsReceipt(gr, businessName, businessMF);
    }), [user, withLoading]);

  const exportFacture = useCallback((invoice: PurchaseInvoice) =>
    withLoading(async () => {
      const { businessName, businessMF, businessAddress } = await getBusinessInfo(user);
      const { printPurchaseInvoice } = await import('../utils/purchase-invoice-print');
      printPurchaseInvoice(invoice, businessName, businessMF, businessAddress);
    }), [user, withLoading]);

  const exportReleve = useCallback((
    supplier: Supplier,
    pos:      SupplierPO[],
    invoices: PurchaseInvoice[],
  ) => withLoading(async () => {
    const { businessName, businessMF } = await getBusinessInfo(user);
    const { printSupplierStatement } = await import('../utils/supplier-statement-print');
    printSupplierStatement(supplier, pos, invoices, businessName, businessMF);
  }), [user, withLoading]);

  return { exportBC, exportBR, exportFacture, exportReleve, loading };
};
