// src/utils/business-info.utils.ts
// Utility to get business information for PDF generation

import { getMyBusinesses } from '@/api/business.api';

export interface BusinessInfo {
  businessName: string;
  businessMF?: string;
  businessAddress?: string;
}

let cachedBusinessInfo: BusinessInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get business information from the API with caching
 * Falls back to 'Entreprise' if no business data is available
 */
export async function getBusinessInfo(user: any): Promise<BusinessInfo> {
  // Check cache first
  const now = Date.now();
  if (cachedBusinessInfo && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedBusinessInfo;
  }

  try {
    const businesses = await getMyBusinesses();
    const businessId = user?.business_id;
    
    if (businesses && businesses.length > 0) {
      // Find the user's business or use the first one
      const currentBusiness = businessId 
        ? businesses.find((b: any) => b.id === businessId)
        : businesses[0];
      
      const business = currentBusiness || businesses[0];
      
      const businessName = business.name || business.business_name || 'Entreprise';
      const businessMF = business.tax_id || business.matricule_fiscal;
      
      let businessAddress: string | undefined;
      if (business.address) {
        const addr = business.address;
        const parts = [
          addr.street,
          [addr.postal_code || addr.postalCode, addr.city].filter(Boolean).join(' '),
          addr.country
        ].filter(Boolean);
        businessAddress = parts.join(', ');
      }
      
      const info = { businessName, businessMF, businessAddress };
      
      // Cache the result
      cachedBusinessInfo = info;
      cacheTimestamp = now;
      
      return info;
    }
  } catch (error) {
    console.error('Error fetching business info:', error);
  }
  
  // Fallback
  const fallback = {
    businessName: 'Entreprise',
    businessMF: undefined,
    businessAddress: undefined
  };
  
  cachedBusinessInfo = fallback;
  cacheTimestamp = now;
  
  return fallback;
}

/**
 * Clear the cached business info (useful after business updates)
 */
export function clearBusinessInfoCache() {
  cachedBusinessInfo = null;
  cacheTimestamp = 0;
}
