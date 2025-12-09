import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Auth kontrolü
    const customerStr = localStorage.getItem('yolmov_customer');
    console.log('🔒 ProtectedRoute Auth Check:', {
      hasCustomer: !!customerStr,
      path: location.pathname
    });
    setIsAuthenticated(!!customerStr);
    setIsChecking(false);
  }, [location.pathname]);

  // Kontrol yapılıyorsa loading göster
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Auth yoksa AuthRequiredPage'e yönlendir
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/giris-gerekli"
        state={{
          message: 'Bu sayfaya erişmek için üye girişi yapmanız gerekiyor.',
          returnUrl: location.pathname + location.search
        }}
        replace
      />
    );
  }

  // Auth varsa children'ı render et
  return <>{children}</>;
};

export default ProtectedRoute;
