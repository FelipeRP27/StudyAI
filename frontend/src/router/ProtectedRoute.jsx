import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../shared/TopBar';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-content">{children}</div>
    </div>
  );
}

export default ProtectedRoute;
