// src/components/PermissionGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCurrentBusinessMember } from '../hooks/useCurrentBusinessMember';
import { PermissionType } from '../types/permissions.types';
import { PermissionUtils } from '../utils/permissions';
import { Role } from '../types/auth.types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: PermissionType[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user must have ANY permission.
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Permission Guard Component
 * 
 * Protects routes based on granular permission strings (cudakp format)
 * Works in conjunction with role-based access control
 * 
 * Usage:
 * <PermissionGuard requiredPermissions={[PermissionType.UPDATE]}>
 *   <CollaborationPage />
 * </PermissionGuard>
 */
export default function PermissionGuard({
  children,
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/app',
  fallback,
}: PermissionGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { businessMember, isLoading: memberLoading } = useCurrentBusinessMember();

  // Show loading spinner while checking auth and permissions
  if (authLoading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Platform admin has all permissions
  if (user.role === Role.PLATFORM_ADMIN) {
    return <>{children}</>;
  }

  // If no specific permissions required, allow access
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check if user has business membership with permissions
  if (!businessMember) {
    // No business context - show fallback or redirect
    return fallback ? <>{fallback}</> : <Navigate to={redirectTo} replace />;
  }

  // Check permissions
  const userPermissions = businessMember.permissions;
  
  let hasRequiredPermissions = false;

  if (requireAll) {
    // User must have ALL required permissions
    hasRequiredPermissions = requiredPermissions.every((permission) =>
      PermissionUtils.hasPermission(userPermissions, permission)
    );
  } else {
    // User must have ANY of the required permissions
    hasRequiredPermissions = requiredPermissions.some((permission) =>
      PermissionUtils.hasPermission(userPermissions, permission)
    );
  }

  if (!hasRequiredPermissions) {
    // User doesn't have required permissions
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // All checks passed → render children
  return <>{children}</>;
}
