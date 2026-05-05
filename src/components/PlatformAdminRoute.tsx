// src/components/PlatformAdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { usePlatformAdmin } from '../hooks/usePlatformAdmin';

interface PlatformAdminRouteProps {
  children: React.ReactNode;
}

export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const { isAuthenticated, isLoading } = usePlatformAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/console/login" replace />;
  }

  return <>{children}</>;
}
