import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Building2, Package, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  id: string;
  type: 'client' | 'supplier' | 'product' | 'invoice';
  title: string;
  subtitle?: string;
  url: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const businessId = (user as any)?.business_id ?? '';

  // Debounce search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, businessId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Navigate results with arrow keys
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
        } else if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const performSearch = async (searchQuery: string) => {
    if (!businessId) {
      console.log('❌ No businessId');
      return;
    }

    console.log('🔍 Searching for:', searchQuery, 'businessId:', businessId);
    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search clients
      try {
        const clientsRes = await axiosInstance.get(`/businesses/${businessId}/sales/clients`, {
          params: { search: searchQuery, limit: 3 }
        });
        const clients = clientsRes.data?.data || clientsRes.data || [];
        clients.forEach((client: any) => {
          allResults.push({
            id: client.id,
            type: 'client',
            title: client.name || client.companyName || 'Client sans nom',
            subtitle: client.email || client.phone,
            url: `/app/sales/clients`
          });
        });
      } catch (err) {
        console.warn('Clients search failed:', err);
      }

      // Search suppliers
      try {
        const suppliersRes = await axiosInstance.get(`/businesses/${businessId}/suppliers`, {
          params: { search: searchQuery, limit: 3 }
        });
        const suppliers = suppliersRes.data?.data || suppliersRes.data || [];
        suppliers.forEach((supplier: any) => {
          allResults.push({
            id: supplier.id,
            type: 'supplier',
            title: supplier.name || 'Fournisseur sans nom',
            subtitle: supplier.email || supplier.phone,
            url: `/app/purchases/suppliers`
          });
        });
      } catch (err) {
        console.warn('Suppliers search failed:', err);
      }

      // Search products
      try {
        const productsRes = await axiosInstance.get(`/businesses/${businessId}/products`, {
          params: { search: searchQuery, limit: 3 }
        });
        const products = productsRes.data || [];
        products.forEach((product: any) => {
          allResults.push({
            id: product.id,
            type: 'product',
            title: product.name || 'Produit sans nom',
            subtitle: product.reference || product.sku || product.category,
            url: `/app/stock/products`
          });
        });
      } catch (err) {
        console.warn('Products search failed:', err);
      }

      // Search invoices
      try {
        const invoicesRes = await axiosInstance.get(`/businesses/${businessId}/invoices`, {
          params: { search: searchQuery, limit: 3 }
        });
        const invoices = invoicesRes.data?.data || invoicesRes.data || [];
        invoices.forEach((invoice: any) => {
          allResults.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.invoiceNumber || 'Facture sans numéro',
            subtitle: invoice.clientName || `${invoice.totalAmount}€`,
            url: `/app/sales/invoices`
          });
        });
      } catch (err) {
        console.warn('Invoices search failed:', err);
      }

      setResults(allResults);
      setIsOpen(allResults.length > 0);
      setSelectedIndex(0);
      console.log('✅ Search complete. Found', allResults.length, 'results:', allResults);
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return Users;
      case 'supplier': return Building2;
      case 'product': return Package;
      case 'invoice': return FileText;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'Client';
      case 'supplier': return 'Fournisseur';
      case 'product': return 'Produit';
      case 'invoice': return 'Facture';
    }
  };

  const getTypeBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-700';
      case 'supplier': return 'bg-green-100 text-green-700';
      case 'product': return 'bg-purple-100 text-purple-700';
      case 'invoice': return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        placeholder="Rechercher..."
        className="search-input w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        aria-label="Rechercher dans l'application"
        aria-describedby="search-shortcut"
        aria-expanded={isOpen}
        aria-controls="search-results"
        aria-autocomplete="list"
      />
      
      {isLoading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
        </div>
      )}

      <kbd
        id="search-shortcut"
        className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-semibold text-gray-600"
        aria-label="Raccourci clavier: Contrôle K"
      >
        <span>Ctrl</span>
        <span>K</span>
      </kbd>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
          role="listbox"
          aria-label="Résultats de recherche"
        >
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            const isSelected = index === selectedIndex;

            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-indigo-50' : ''
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div className={`p-2 rounded-lg ${getTypeBadgeColor(result.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeColor(result.type)}`}>
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50"
          role="status"
        >
          <p className="text-sm text-gray-500 text-center">Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  );
}