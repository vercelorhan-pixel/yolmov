import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, List, Plus, MessageCircle, User } from 'lucide-react';

const CustomerBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/') 
              ? 'text-brand-orange' 
              : 'text-gray-500 hover:text-brand-orange'
          }`}
        >
          <Home size={24} />
          <span className="text-[10px] font-medium">Anasayfa</span>
        </button>
        
        <button 
          onClick={() => navigate('/musteri/taleplerim')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/musteri/taleplerim') 
              ? 'text-brand-orange' 
              : 'text-gray-500 hover:text-brand-orange'
          }`}
        >
          <List size={24} />
          <span className="text-[10px] font-medium">Taleplerim</span>
        </button>
        
        <div className="relative -top-5">
          <button 
            onClick={() => navigate('/teklif')}
            className="w-14 h-14 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 transition-colors active:scale-95"
          >
            <Plus size={30} />
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/musteri/mesajlar')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/musteri/mesajlar') 
              ? 'text-brand-orange' 
              : 'text-gray-500 hover:text-brand-orange'
          }`}
        >
          <MessageCircle size={24} />
          <span className="text-[10px] font-medium">Mesajlar</span>
        </button>
        
        <button 
          onClick={() => navigate('/musteri/profil')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/musteri/profil') 
              ? 'text-brand-orange' 
              : 'text-gray-500 hover:text-brand-orange'
          }`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
