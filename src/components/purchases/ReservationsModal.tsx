// ==================== Alaa change for product reservations ====================
import { useState, useEffect } from 'react';
import { X, Check, Loader2, Package } from 'lucide-react';
import { productReservationsApi, ProductReservation } from '../../api/product-reservations.api';
import { createSupplierPO } from '../../api/supplier-pos';
import { toast } from 'sonner';

interface Props {
  businessId: string;
  onClose: () => void;
}

export default function ReservationsModal({ businessId, onClose }: Props) {
  const [reservations, setReservations] = useState<ProductReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [businessId]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await productReservationsApi.getAll(businessId);
      setReservations(data);
    } catch (err: any) {
      console.error('Error fetching reservations:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Erreur lors du chargement des réservations';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reservation: ProductReservation) => {
    const supplierId = reservation.reserved_supplier_id || reservation.default_supplier_id;
    
    if (!supplierId) {
      toast.error('Ce produit n\'a pas de fournisseur assigné');
      return;
    }

    try {
      setAccepting(reservation.id);

      const poData = {
        supplier_id: supplierId,
        notes: `Commande automatique pour réservation - ${reservation.name} (SKU: ${reservation.sku})`,
        items: [
          {
            product_id: reservation.id, // Product ID from the reservation
            description: reservation.name,
            quantity_ordered: Number(reservation.reserved_quantity),
            unit_price_ht: Number(reservation.cost || reservation.price),
            tax_rate_value: 19,
            sort_order: 0,
          },
        ],
      };

      console.log('Creating PO with data:', poData);

      // Create purchase order with the reservation
      await createSupplierPO(businessId, poData);

      // Clear the reservation
      await productReservationsApi.clear(businessId, reservation.id);

      toast.success('Bon de commande créé avec succès');
      
      // Refresh reservations
      await fetchReservations();
    } catch (err: any) {
      console.error('Error accepting reservation:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error details:', JSON.stringify(err.response?.data, null, 2));
      const errorMsg = err.response?.data?.message || 
                      (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : '') ||
                      err.response?.data?.error ||
                      'Erreur lors de la création du bon de commande';
      toast.error(errorMsg);
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Réservations de Produits</h2>
            <p className="text-sm text-gray-500 mt-1">
              {reservations.length} produit(s) réservé(s)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune réservation en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{reservation.name}</h3>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {reservation.sku}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Quantité réservée:</span>
                          <span className="ml-2 font-semibold text-amber-600">
                            {reservation.reserved_quantity} {reservation.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock actuel:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {reservation.current_quantity} {reservation.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock minimum:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {reservation.min_quantity} {reservation.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Prix unitaire:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {(reservation.cost || reservation.price).toFixed(3)} DT
                          </span>
                        </div>
                      </div>

                      {reservation.reserved_supplier_name && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="text-gray-500">Fournisseur sélectionné:</span>
                          <span className="ml-2 font-medium text-indigo-600">{reservation.reserved_supplier_name}</span>
                        </div>
                      )}

                      {!reservation.reserved_supplier_name && reservation.supplier_name && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="text-gray-500">Fournisseur par défaut:</span>
                          <span className="ml-2 font-medium">{reservation.supplier_name}</span>
                        </div>
                      )}

                      <div className="text-sm font-semibold text-indigo-600">
                        Total: {((reservation.cost || reservation.price) * reservation.reserved_quantity).toFixed(3)} DT
                      </div>
                    </div>

                    <button
                      onClick={() => handleAccept(reservation)}
                      disabled={accepting === reservation.id || (!reservation.reserved_supplier_id && !reservation.default_supplier_id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {accepting === reservation.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Accepter
                        </>
                      )}
                    </button>
                  </div>

                  {!reservation.reserved_supplier_id && !reservation.default_supplier_id && (
                    <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
                      ⚠️ Aucun fournisseur assigné pour ce produit
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
// ====================================================================
