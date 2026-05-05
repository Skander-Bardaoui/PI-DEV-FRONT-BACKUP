import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // Don't scroll to top on navigation
    // This prevents the automatic scroll behavior
  }, [location.pathname]);

  return null;
}
