import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: string;
  notificationsCount?: number;
  onOpenMobileSidebar?: () => void;
}

const tabTitles: Record<string, string> = {
  overview: 'Genel Bakış',
  users: 'Kullanıcı Yönetimi',
  partners: 'Partner Yönetimi',
  requests: 'Talep Yönetimi',
  offers: 'Teklif Yönetimi',
  reports: 'Raporlar'
};

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, notificationsCount = 0, onOpenMobileSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Menüyü Aç"
          onClick={onOpenMobileSidebar}
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800" id="page-title">
          {tabTitles[activeTab] || 'Panel'}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500" aria-label="Bildirimler">
          <Bell size={22} />
          {notificationsCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
