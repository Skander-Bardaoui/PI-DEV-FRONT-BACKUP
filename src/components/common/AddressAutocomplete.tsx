import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

interface PhotonFeature {
  type: string;
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  properties: {
    osm_id: number;
    osm_type: string;
    extent?: [number, number, number, number];
    country?: string;
    osm_key?: string;
    city?: string;
    countrycode?: string;
    osm_value?: string;
    postcode?: string;
    name?: string;
    state?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
  type: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: AddressAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [touched, setTouched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search using Photon API
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    setTouched(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Photon API - 100% FREE geocoding service by Komoot
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data: PhotonResponse = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce
  };

  // Format address from Photon feature
  const formatAddress = (feature: PhotonFeature): string => {
    const props = feature.properties;
    const parts: string[] = [];

    if (props.housenumber) parts.push(props.housenumber);
    if (props.street) parts.push(props.street);
    if (props.name && !props.street) parts.push(props.name);
    if (props.city) parts.push(props.city);
    if (props.postcode) parts.push(props.postcode);
    if (props.country) parts.push(props.country);

    return parts.join(', ');
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (feature: PhotonFeature) => {
    const props = feature.properties;

    // Build street address
    const streetParts: string[] = [];
    if (props.housenumber) streetParts.push(props.housenumber);
    if (props.street) streetParts.push(props.street);
    if (streetParts.length === 0 && props.name) streetParts.push(props.name);

    const newAddress: AddressData = {
      street: streetParts.join(' ') || '',
      city: props.city || props.district || props.state || '',
      postalCode: props.postcode || '',
      country: props.country || '',
    };

    onChange(newAddress);
    setSearchQuery('');
    setShowSuggestions(false);
    setTouched(true);
  };

  // Validate address completeness
  const isAddressComplete = value.street && value.city && value.postalCode && value.country;
  const showValidation = touched && !disabled;

  return (
    <div ref={wrapperRef} className="space-y-4">
      {/* Search Bar */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rechercher une adresse {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            disabled={disabled}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
            placeholder="Tapez votre adresse complète..."
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          💡 Commencez à taper pour voir les suggestions (ex: "123 Avenue Habib Bourguiba, Sousse")
        </p>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-indigo-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
            {suggestions.map((feature, index) => (
              <button
                key={`${feature.properties.osm_id}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(feature)}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatAddress(feature)}
                    </p>
                    {feature.properties.postcode && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Code postal: {feature.properties.postcode}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && !isSearching && searchQuery.length >= 3 && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Aucune adresse trouvée. Essayez une autre recherche.</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Address Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Adresse détaillée {required && <span className="text-red-500">*</span>}
          </h3>
          {showValidation && isAddressComplete && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Adresse complète</span>
            </div>
          )}
        </div>

        {/* Street */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rue et numéro {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.street}
            onChange={(e) => {
              onChange({ ...value, street: e.target.value });
              setTouched(true);
            }}
            disabled={disabled}
            required={required}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
            placeholder="Ex: 123 Avenue Habib Bourguiba"
          />
        </div>

        {/* City and Postal Code */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => {
                onChange({ ...value, city: e.target.value });
                setTouched(true);
              }}
              disabled={disabled}
              required={required}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
              placeholder="Ex: Sousse"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code postal {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value.postalCode}
              onChange={(e) => {
                onChange({ ...value, postalCode: e.target.value });
                setTouched(true);
              }}
              disabled={disabled}
              required={required}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
              placeholder="Ex: 4000"
              maxLength={10}
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.country}
            onChange={(e) => {
              onChange({ ...value, country: e.target.value });
              setTouched(true);
            }}
            disabled={disabled}
            required={required}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-100"
            placeholder="Ex: Tunisia"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="text-xs text-gray-500">
          Vous pouvez utiliser la recherche automatique ou remplir les champs manuellement
        </p>
      )}
    </div>
  );
}
