import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

export default function AdminRoute({ children }) {
  const { user, isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isUserAdmin = Boolean(
    isAdmin ||
    user?.role === 'admin' ||
    (user?.email && (user.email.toLowerCase().includes('admin') || user.email.toLowerCase() === 'zabbrotechnologies@gmail.com'))
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isUserAdmin) return <Navigate to="/" replace />;

  return children;
}
