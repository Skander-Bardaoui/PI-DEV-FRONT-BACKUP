import { useState, useEffect } from 'react';
import { useBusinessId } from '../../hooks/useBusinessId';
import { Package, AlertTriangle, Tag, TrendingUp, Wallet, RefreshCw, ShoppingCart, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from 'recharts';
import StockCard from '../../components/stock/StockCard';
import { stockDashboardApi, StockDashboardResponse } from '../../api/stock-dashboard.api';
import { productReservationsApi } from '../../api/product-reservations.api';
import { toast } from 'sonner';
import axios from 'axios';
import {
  StockCardSkeleton,
  LowStockProductSkeleton,
  RecentMovementSkeleton,
  ChartSkeleton,
} from '../../components/stock/StockSkeletonLoaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Supplier {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface BusinessMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  collaboration_permissions: any;
  stock_permissions: {
    create_product: boolean;
    update_product: boolean;
    delete_product: boolean;
    create_movement: boolean;
    delete_movement: boolean;
    create_category: boolean;
    update_category: boolean;
    delete_category: boolean;
    create_warehouse: boolean;
    update_warehouse: boolean;
    delete_warehouse: boolean;
    create_reservation: boolean;
    delete_reservation: boolean;
    create_service: boolean;
    update_service: boolean;
    delete_service: boolean;
    create_service_category: boolean;
    update_service_category: boolean;
    delete_service_category: boolean;
  };
  is_active: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

type ViewMode = 'products' | 'services';

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

async function fetchBusinessMembers(businessId: string): Promise<BusinessMember[]> {
  const res = await fetch(`${API_URL}/businesses/${businessId}/members`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch members');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.members || []);
}

export default function StockDashboard() {
  const { businessId } = useBusinessId();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [data, setData] = useState<StockDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingProductId, setReservingProductId] = useState<string | null>(null);
  const [reservationQuantities, setReservationQuantities] = useState<Record<string, number>>({});
  const [reservationSuppliers, setReservationSuppliers] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<BusinessMember | null>(null);

  // Load current user and member on mount
  useEffect(() => {
    async function loadUserData() {
      if (!businessId) return;
      
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
        
        const members = await fetchBusinessMembers(businessId);
        const member = members.find(m => m.user_id === user.id);
        setCurrentMember(member || null);
      } catch (err: any) {
        console.error('Failed to load user data:', err);
      }
    }
    loadUserData();
  }, [businessId]);

  // Permission checks
  const isOwner = currentUser?.role === 'BUSINESS_OWNER';
  const stock = currentMember?.stock_permissions;
  
  const canCreateProduct = isOwner || stock?.create_product === true;
  const canUpdateProduct = isOwner || stock?.update_product === true;
  const canDeleteProduct = isOwner || stock?.delete_product === true;
  const canCreateMovement = isOwner || stock?.create_movement === true;
  const canDeleteMovement = isOwner || stock?.delete_movement === true;
  const canCreateCategory = isOwner || stock?.create_category === true;
  const canUpdateCategory = isOwner || stock?.update_category === true;
  const canDeleteCategory = isOwner || stock?.delete_category === true;
  const canCreateWarehouse = isOwner || stock?.create_warehouse === true;
  const canUpdateWarehouse = isOwner || stock?.update_warehouse === true;
  const canDeleteWarehouse = isOwner || stock?.delete_warehouse === true;
  const canCreateReservation = isOwner || stock?.create_reservation === true;
  const canDeleteReservation = isOwner || stock?.delete_reservation === true;
  const canCreateService = isOwner || stock?.create_service === true;
  const canUpdateService = isOwner || stock?.update_service === true;
  const canDeleteService = isOwner || stock?.delete_service === true;
  const canCreateServiceCategory = isOwner || stock?.create_service_category === true;
  const canUpdateServiceCategory = isOwner || stock?.update_service_category === true;
  const canDeleteServiceCategory = isOwner || stock?.delete_service_category === true;


  const fetchDashboard = async (mode?: ViewMode) => {
    if (!businessId) return;
    
    const currentMode = mode || viewMode;
    
    try {
      setLoading(true);
      setError(null);
      
      const dashboardPromise = currentMode === 'products' 
        ? stockDashboardApi.getProductsDashboard(businessId)
        : stockDashboardApi.getServicesDashboard(businessId);
      
      const [dashboardData, suppliersData] = await Promise.all([
        dashboardPromise,
        currentMode === 'products' 
          ? axios.get(`${API_URL}/businesses/${businessId}/suppliers?is_active=true&limit=100`, { withCredentials: true })
          : Promise.resolve({ data: { data: [] } }),
      ]);
      
      setData(dashboardData);
      setSuppliers(suppliersData.data.data || []);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [businessId, viewMode]);

  // Show skeleton for minimum 2 seconds
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleViewModeChange = async (mode: ViewMode) => {
    if (mode === viewMode) return;
    setViewMode(mode);
    fetchDashboard(mode);
  };

  const handleReserve = async (productId: string) => {
    if (!businessId) return;
    
    const quantity = reservationQuantities[productId];
    const supplierId = reservationSuppliers[productId];
    
    if (!quantity || quantity <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }

    if (!supplierId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }

    try {
      setReservingProductId(productId);
      await productReservationsApi.create(businessId, {
        product_id: productId,
        quantity,
        supplier_id: supplierId,
      });
      toast.success('Réservation créée avec succès');
      setReservationQuantities((prev) => ({ ...prev, [productId]: 0 }));
      setReservationSuppliers((prev) => ({ ...prev, [productId]: '' }));
      fetchDashboard();
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setReservingProductId(null);
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ENTREE_ACHAT': 'Entrée',
      'SORTIE_VENTE': 'Sortie',
      'AJUSTEMENT_POSITIF': 'Ajustement +',
      'AJUSTEMENT_NEGATIF': 'Ajustement -',
      'IN': 'Entrée',
      'OUT': 'Sortie',
      'ADJUSTMENT': 'Ajustement',
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ENTREE_ACHAT': 'bg-green-100 text-green-700',
      'IN': 'bg-green-100 text-green-700',
      'SORTIE_VENTE': 'bg-red-100 text-red-700',
      'OUT': 'bg-red-100 text-red-700',
      'AJUSTEMENT_POSITIF': 'bg-blue-100 text-blue-700',
      'AJUSTEMENT_NEGATIF': 'bg-orange-100 text-orange-700',
      'ADJUSTMENT': 'bg-yellow-100 text-yellow-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStockBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 60) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const isDisplayLoading = loading || showSkeleton;

  if (isDisplayLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <StockCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <LowStockProductSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 rounded w-52"></div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <RecentMovementSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-gray-900 font-medium">Erreur de chargement</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de Stock</h1>
          <p className="text-gray-500">Vue d'ensemble de votre inventaire</p>
        </div>
        
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => handleViewModeChange('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'products'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Package className="h-4 w-4" />
            Produits
          </button>
          <button
            onClick={() => handleViewModeChange('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'services'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Services
          </button>
        </div>
      </div>

      <div key={viewMode} className="animate-fadeIn">
        {viewMode === 'products' ? (
          <ProductsView
            data={data}
            suppliers={suppliers}
            reservingProductId={reservingProductId}
            reservationQuantities={reservationQuantities}
            reservationSuppliers={reservationSuppliers}
            setReservationQuantities={setReservationQuantities}
            setReservationSuppliers={setReservationSuppliers}
            handleReserve={handleReserve}
            getMovementTypeLabel={getMovementTypeLabel}
            getMovementTypeColor={getMovementTypeColor}
            getStockBarColor={getStockBarColor}
            formatCurrency={formatCurrency}
            navigate={navigate}
            canCreateReservation={canCreateReservation}
          />
        ) : (
          <ServicesView
            data={data}
            formatCurrency={formatCurrency}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

interface ProductsViewProps {
  data: StockDashboardResponse;
  suppliers: Supplier[];
  reservingProductId: string | null;
  reservationQuantities: Record<string, number>;
  reservationSuppliers: Record<string, string>;
  setReservationQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setReservationSuppliers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleReserve: (productId: string) => void;
  getMovementTypeLabel: (type: string) => string;
  getMovementTypeColor: (type: string) => string;
  getStockBarColor: (percentage: number) => string;
  formatCurrency: (value: number) => string;
  navigate: any;
  canCreateReservation: boolean;
}

function ProductsView({
  data,
  suppliers,
  reservingProductId,
  reservationQuantities,
  reservationSuppliers,
  setReservationQuantities,
  setReservationSuppliers,
  handleReserve,
  getMovementTypeLabel,
  getMovementTypeColor,
  getStockBarColor,
  formatCurrency,
  navigate,
  canCreateReservation,
}: ProductsViewProps) {
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StockCard title="Total Produits" value={data.summary.total_products} icon={Package} color="indigo" subtitle="actifs" />
        <StockCard title="Stock Faible" value={data.summary.low_stock_count} icon={AlertTriangle} color="red" subtitle="produits" />
        <StockCard title="Catégories" value={data.summary.total_categories} icon={Tag} color="green" subtitle="actives" />
        <StockCard title="Mouvements" value={data.summary.total_movements} icon={TrendingUp} color="yellow" subtitle="total" />
        <StockCard title="Valeur du stock" value={formatCurrency(data.summary.total_stock_value)} icon={Wallet} color="emerald" subtitle="inventaire" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stock Faible</h2>
                <p className="text-sm text-gray-500">Produits nécessitant un réapprovisionnement</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {data.low_stock_products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun produit en stock faible</div>
            ) : (
              data.low_stock_products.map((product) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{product.quantity} / {product.min_quantity}</p>
                      <p className="text-xs text-gray-500">En stock / Min</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className={`h-2 rounded-full ${getStockBarColor(product.stock_percentage)}`} style={{ width: `${Math.min(product.stock_percentage, 100)}%` }}></div>
                  </div>
                  {canCreateReservation && (
                    <div className="space-y-2">
                      <select value={reservationSuppliers[product.id] || ''} onChange={(e) => setReservationSuppliers((prev) => ({ ...prev, [product.id]: e.target.value }))} className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Sélectionner fournisseur</option>
                        {suppliers.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" placeholder="Qté" value={reservationQuantities[product.id] || ''} onChange={(e) => setReservationQuantities((prev) => ({ ...prev, [product.id]: parseFloat(e.target.value) || 0 }))} className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={() => handleReserve(product.id)} disabled={reservingProductId === product.id} className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                          <ShoppingCart className="h-3 w-3" />Réserver
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button onClick={() => navigate('/app/stock/products?low_stock=true')} className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">Voir tous les produits</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mouvements Récents</h2>
                <p className="text-sm text-gray-500">Dernières opérations de stock</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recent_movements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun mouvement récent</div>
            ) : (
              data.recent_movements.map((movement) => (
                <div key={movement.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{movement.product_name}</p>
                    <p className="text-sm text-gray-500">{format(new Date(movement.created_at), 'dd MMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getMovementTypeColor(movement.type)}`}>{getMovementTypeLabel(movement.type)}</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{movement.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button onClick={() => navigate('/app/stock/movements')} className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">Voir tous les mouvements</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité du stock — 30 derniers jours</h2>
        {data.movements_chart.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Aucun mouvement ces 30 derniers jours</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.movements_chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd/MM')} />
              <YAxis />
              <Tooltip labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: fr })} formatter={(value: number) => [value, '']} />
              <Legend />
              <Bar dataKey="entrees" fill="#10b981" name="Entrées" />
              <Bar dataKey="sorties" fill="#ef4444" name="Sorties" />
              <Bar dataKey="ajustements" fill="#f59e0b" name="Ajustements" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Prévision de rupture de stock</h2>
          <p className="text-sm text-gray-500">Basé sur la consommation moyenne des 30 derniers jours</p>
        </div>
        {data.stock_forecast.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Aucun produit en risque de rupture détecté</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(400, data.stock_forecast.length * 60)}>
              <BarChart data={data.stock_forecast} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: 'Jours restants estimés', position: 'insideBottom', offset: -5 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const itemData = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900 mb-1">{itemData.name}</p>
                        <p className="text-sm text-gray-600">Stock actuel: {itemData.current_quantity} {itemData.unit}</p>
                        <p className="text-sm text-gray-600">Consommation moyenne: {itemData.avg_daily_consumption.toFixed(2)} {itemData.unit}/jour</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">Jours restants: {itemData.days_remaining !== null ? itemData.days_remaining : 'N/A'}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="days_remaining" fill="#8884d8" radius={[0, 4, 4, 0]} shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  let fill = '#10b981';
                  if (payload.risk_level === 'CRITICAL') fill = '#ef4444';
                  else if (payload.risk_level === 'WARNING') fill = '#f59e0b';
                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
                }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-gray-600">Critique (≤ 7 jours)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-gray-600">Attention (≤ 30 jours)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-gray-600">OK (&gt; 30 jours)</span></div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

interface ServicesViewProps {
  data: StockDashboardResponse;
  formatCurrency: (value: number) => string;
  navigate: any;
}

function ServicesView({ data, formatCurrency, navigate }: ServicesViewProps) {
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StockCard title="Total Services" value={data.summary.total_services} icon={Briefcase} color="indigo" subtitle="actifs" />
        <StockCard title="Catégories" value={data.summary.total_categories} icon={Tag} color="green" subtitle="services" />
        <StockCard title="Activités" value={data.summary.total_movements} icon={TrendingUp} color="yellow" subtitle="total" />
        <StockCard title="Valeur Services" value={formatCurrency(data.summary.total_stock_value)} icon={Wallet} color="emerald" subtitle="catalogue" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Activités Récentes</h2>
              <p className="text-sm text-gray-500">Dernières opérations sur les services</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recent_movements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune activité récente</div>
          ) : (
            data.recent_movements.slice(0, 8).map((movement) => (
              <div key={movement.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{movement.product_name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(movement.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">Service</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button onClick={() => navigate('/app/stock/services')} className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium">Voir tous les services</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance des Services — 30 derniers jours</h2>
        {data.movements_chart.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Aucune activité ces 30 derniers jours</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.movements_chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd/MM')} />
              <YAxis />
              <Tooltip labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: fr })} formatter={(value: number) => [value, 'Services']} />
              <Legend />
              <Bar dataKey="entrees" fill="#6366f1" name="Nouveaux" />
              <Bar dataKey="sorties" fill="#8b5cf6" name="Complétés" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}