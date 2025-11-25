import { useContext } from 'react';
import { AuthContext } from '../contexts/KeycloakAuthProvider';

/**
 * Custom hook to access authentication context
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

