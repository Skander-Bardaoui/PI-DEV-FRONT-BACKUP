// src/hooks/useForecast.ts
import { useState, useCallback } from 'react';
import { getCashFlowForecast, CashFlowForecastResponse } from '@/api/forecast.api';

export function useForecast() {
  const [data, setData] = useState<CashFlowForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCashFlowForecast();
      setData(result);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(
        typeof msg === 'string' ? msg :
        Array.isArray(msg) ? msg.join(', ') :
        'Failed to load forecast'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchForecast };
}
