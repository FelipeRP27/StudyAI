import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PublicRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;
