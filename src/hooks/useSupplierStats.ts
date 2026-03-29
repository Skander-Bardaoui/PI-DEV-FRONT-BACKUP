// src/hooks/useSupplierStats.ts
// Stats calculées côté frontend pour un fournisseur donné

import { useMemo } from 'react';
import { useSupplierPOs }      from './useSupplierPOs';
import { usePurchaseInvoices } from './usePurchaseInvoices';
import { InvoiceStatus, POStatus } from '@/types';


export const useSupplierStats = (businessId: string, supplierId: string) => {
  const { data: posData }  = useSupplierPOs(businessId,    { supplier_id: supplierId, limit: 200 });
  const { data: invData }  = usePurchaseInvoices(businessId, { supplier_id: supplierId, limit: 200 });

  const stats = useMemo(() => {
    const pos      = posData?.data  ?? [];
    const invoices = invData?.data  ?? [];

    const totalAchats   = invoices.reduce((s, i) => s + Number(i.net_amount), 0);
    const totalPaye     = invoices.reduce((s, i) => s + Number(i.paid_amount), 0);
    const totalDu       = Math.round((totalAchats - totalPaye) * 1000) / 1000;
    const nbBCs         = pos.length;
    const nbFactures    = invoices.length;
    const nbPayees      = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const nbEnRetard    = invoices.filter(i => i.status === InvoiceStatus.OVERDUE).length;
    const nbLitige      = invoices.filter(i => i.status === InvoiceStatus.DISPUTED).length;
    const nbBCsRecus    = pos.filter(p => p.status === POStatus.FULLY_RECEIVED).length;
    const tauxReception = nbBCs > 0 ? Math.round((nbBCsRecus / nbBCs) * 100) : 0;

    // Délai moyen de paiement (factures payées)
    const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID && i.invoice_date);
    const avgPayDays = paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((s, i) => {
            const diff = new Date(i.due_date).getTime() - new Date(i.invoice_date).getTime();
            return s + diff / (1000 * 60 * 60 * 24);
          }, 0) / paidInvoices.length
        )
      : null;

    return {
      totalAchats, totalPaye, totalDu,
      nbBCs, nbFactures, nbPayees, nbEnRetard, nbLitige,
      tauxReception, avgPayDays,
    };
  }, [posData, invData]);

  return {
    stats,
    loading: !posData || !invData,
    pos:     posData?.data  ?? [],
    invoices: invData?.data ?? [],
  };
};

