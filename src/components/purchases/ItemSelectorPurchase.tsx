import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api/products.api';
import { Product, ProductType } from '../../types/product';

export type ItemType = 'PRODUCT' | 'SERVICE';

export interface SelectedItem {
  id: string;
  name: string;
  type: ItemType;
  price_ht: number;
  description?: string;
  duration_note?: string;
}

interface ItemSelectorPurchaseProps {
  itemType: ItemType;
  value?: string;
  onChange: (item: SelectedItem | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function ItemSelectorPurchase({ 
  itemType,
  value, 
  onChange, 
  disabled, 
  className 
}: ItemSelectorPurchaseProps) {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id;
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadItems();
    }
  }, [businessId, itemType]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const type = itemType === 'PRODUCT' ? ProductType.PHYSICAL : ProductType.SERVICE;
      const data = await productsApi.getAll(businessId!, { 
        is_active: true,
        type: type
      });
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    if (!itemId) {
      onChange(null);
      return;
    }
    const item = items.find(p => p.id === itemId);
    if (item) {
      onChange({
        id: item.id,
        name: item.name,
        type: itemType,
        price_ht: item.purchase_price_ht || item.sale_price_ht,
        description: item.description || undefined,
        duration_note: undefined, // Services may have this in description
      });
    } else {
      onChange(null);
    }
  };

  const placeholder = itemType === 'PRODUCT' 
    ? 'Sélectionner un produit' 
    : 'Sélectionner un service';

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || loading}
      className={className}
    >
      <option value="">{placeholder}</option>
      {items.map((item) => (
        <option
          key={item.id}
          value={item.id}
        >
          {item.name} - {(item.purchase_price_ht || item.sale_price_ht).toFixed(3)} DT
          {itemType === 'PRODUCT' && item.is_stockable && ` (Stock: ${item.current_stock})`}
        </option>
      ))}
    </select>
  );
}
