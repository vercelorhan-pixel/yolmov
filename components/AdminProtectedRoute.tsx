import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import supabaseApi from '../services/supabaseApi';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. LocalStorage kontrolü (Hızlı kontrol)
        const adminStr = localStorage.getItem('yolmov_admin');
        if (!adminStr) {
          console.log('🔒 AdminProtectedRoute: No local admin data found');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        // 2. Supabase Session kontrolü (Güvenli kontrol)
        const { data: { session } } = await supabaseApi.auth.getSession();
        if (!session) {
          console.log('🔒 AdminProtectedRoute: No active Supabase session');
          // Session yoksa local veriyi de temizle
          localStorage.removeItem('yolmov_admin');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        // Her şey yolunda
        setIsAuthenticated(true);
      } catch (error) {
        console.error('🔒 AdminProtectedRoute Error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-500 font-medium">Admin yetkisi kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/giris" state={{ returnUrl: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
