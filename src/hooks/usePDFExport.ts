
import { useState, useCallback } from 'react';
import { useAuth }           from './useAuth';
import { GoodsReceipt, PurchaseInvoice, Supplier, SupplierPO } from '@/types';


export const usePDFExport = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const businessName = (user as any)?.business_name ?? (user as any)?.name ?? 'Mon Entreprise';
  const businessMF   = (user as any)?.matricule_fiscal ?? undefined;

  const withLoading = useCallback(async (fn: () => Promise<void> | void) => {
    setLoading(true);
    try { await fn(); }
    catch (err) { console.error('[PDF]', err); alert('Erreur lors de la génération du PDF'); }
    finally { setLoading(false); }
  }, []);

  const exportBC = useCallback((po: SupplierPO) =>
    withLoading(async () => {
      const { printSupplierPO } = await import('../utils/supplier-po-print');
      printSupplierPO(po, businessName, businessMF);
    }), [businessName, businessMF, withLoading]);

  const exportBR = useCallback((gr: GoodsReceipt) =>
    withLoading(async () => {
      const { printGoodsReceipt } = await import('../utils/goods-receipt-print');
      printGoodsReceipt(gr, businessName, businessMF);
    }), [businessName, businessMF, withLoading]);

  const exportFacture = useCallback((invoice: PurchaseInvoice) =>
    withLoading(async () => {
      const { printPurchaseInvoice } = await import('../utils/purchase-invoice-print');
      printPurchaseInvoice(invoice, businessName, businessMF);
    }), [businessName, businessMF, withLoading]);

  const exportReleve = useCallback((
    supplier: Supplier,
    pos:      SupplierPO[],
    invoices: PurchaseInvoice[],
  ) => withLoading(async () => {
    const { printSupplierStatement } = await import('../utils/supplier-statement-print');
    printSupplierStatement(supplier, pos, invoices, businessName, businessMF);
  }), [businessName, businessMF, withLoading]);

  return { exportBC, exportBR, exportFacture, exportReleve, loading };
};