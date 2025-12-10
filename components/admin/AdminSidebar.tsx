import React from 'react';
import { LogOut } from 'lucide-react';
import { adminTabs } from './adminTabs';
import { AdminRole } from '../../types';

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
  onLogout: () => void;
  role: AdminRole;
  mobile?: boolean;
  onCloseMobile?: () => void;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onSelectTab, onLogout, role, mobile, onCloseMobile, user }) => {
  const categories = [
    { id: 'dashboard', label: 'Kokpit', color: 'text-slate-500' },
    { id: 'call-center', label: 'Çağrı Merkezi', color: 'text-green-500', badge: 'CANLI' },
    { id: 'management', label: 'Yönetim', color: 'text-slate-500' },
    { id: 'operations', label: 'Operasyon', color: 'text-slate-500' },
    { id: 'finance', label: 'Finans & Büyüme', color: 'text-slate-500' },
    { id: 'system', label: 'Sistem', color: 'text-slate-500' },
  ];

  const getHoverColor = (categoryId: string) => {
    switch (categoryId) {
      case 'call-center': return 'group-hover:text-green-500';
      case 'finance': return 'group-hover:text-green-500';
      case 'operations': return 'group-hover:text-blue-500';
      case 'management': return 'group-hover:text-purple-500';
      default: return 'group-hover:text-orange-500';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-white w-64 ${mobile ? 'shadow-2xl' : ''}`}>      
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <div className="cursor-pointer" onClick={() => onSelectTab('overview')}>
          <span className="yolmov-logo text-3xl font-bold text-white block text-center mb-2">yolmov</span>
          <p className="text-xs text-slate-400 text-center">Admin Panel</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-hide">
        {categories.map((category) => {
          const tabsInCategory = adminTabs.filter(
            (t) => t.category === category.id && (!t.allowedRoles || t.allowedRoles.includes(role))
          );

          if (tabsInCategory.length === 0) return null;

          return (
            <div key={category.id}>
              <div className="flex items-center justify-between px-3 mb-2">
                <p className={`text-[10px] font-black ${category.color} uppercase tracking-wider opacity-80`}>
                  {category.label}
                </p>
                {category.badge && (
                  <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                    {category.badge}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {tabsInCategory.map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-controls={`panel-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      mobile && onCloseMobile && onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                      activeTab === item.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon 
                      size={18} 
                      className={activeTab === item.id ? '' : `transition-colors ${getHoverColor(category.id)}`}
                    />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-slate-300">
                {user?.name?.charAt(0).toUpperCase() || 'Y'}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.name || 'Yönetici'}</p>
            <p className="text-xs text-slate-400 truncate" title={user?.email}>{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
