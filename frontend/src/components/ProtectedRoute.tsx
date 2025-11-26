import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // Optional: require specific roles
  requireAll?: boolean; // If true, user must have ALL roles; if false, ANY role
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Optionally checks for required roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  requireAll = false,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole, login } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    login();
    return null;
  }

  // Check role requirements if specified
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAll
      ? roles.every((role) => hasRole(role))
      : hasAnyRole(roles);

    if (!hasRequiredRoles) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>403 - Forbidden</h1>
          <p>You don't have permission to access this page.</p>
          <p>Required roles: {roles.join(', ')}</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

