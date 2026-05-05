import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api/products.api';
import { Product, ProductType } from '../../types/product';

interface ProductSelectorPurchaseProps {
  value?: string;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
  className?: string;
  businessId?: string; // Ajouter businessId en prop
}

export default function ProductSelectorPurchase({ 
  value, 
  onChange, 
  disabled, 
  className,
  businessId: propBusinessId // Recevoir businessId en prop
}: ProductSelectorPurchaseProps) {
  const { user } = useAuth();
  // Utiliser le businessId passé en prop, sinon fallback sur user.business_id
  const businessId = propBusinessId || (user as any)?.business_id;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(businessId!, { is_active: true });
      // Filter out services - only show physical and digital products for purchase orders
      const purchasableProducts = data.filter(p => p.type !== ProductType.SERVICE);
      setProducts(purchasableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (!productId) {
      onChange(null);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product) {
      onChange(product);
    } else {
      onChange(null);
    }
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || loading}
      className={className}
    >
      <option value="">Sélectionner un produit</option>
      {products.map((product) => (
        <option
          key={product.id}
          value={product.id}
        >
          {product.name} - {product.purchase_price_ht.toFixed(3)} DT
          {product.is_stockable && ` (Stock: ${product.current_stock})`}
        </option>
      ))}
    </select>
  );
}
