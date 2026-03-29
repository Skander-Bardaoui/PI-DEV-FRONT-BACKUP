import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { productsApi } from '../../api/products.api';
import { Product } from '../../types/product';

interface ProductSelectorProps {
  value?: string;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
  className?: string;
  onStockInfo?: (stock: number, isStockable: boolean) => void;
}

export default function ProductSelector({ value, onChange, disabled, className, onStockInfo }: ProductSelectorProps) {
  const { user } = useAuth();
  const businessId = (user as any)?.business_id;
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
      setProducts(data);
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
      if (onStockInfo) onStockInfo(0, false);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product) {
      onChange(product);
      if (onStockInfo) {
        onStockInfo(product.current_stock || 0, product.is_stockable);
      }
    } else {
      onChange(null);
      if (onStockInfo) onStockInfo(0, false);
    }
  };

  const isProductDisabled = (product: Product) => {
    // Disable if product is stockable and out of stock
    return product.is_stockable && product.current_stock <= 0;
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
          disabled={isProductDisabled(product)}
        >
          {product.name} - {product.sale_price_ht.toFixed(3)} DT
          {product.is_stockable && ` (Stock: ${product.current_stock})`}
          {isProductDisabled(product) && ' - RUPTURE DE STOCK'}
        </option>
      ))}
    </select>
  );
}
