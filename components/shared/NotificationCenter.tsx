import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supabaseApi from '../../services/supabaseApi';
import { Notification } from '../../types';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      // Session'dan customer ID'yi al
      const sessionStr = localStorage.getItem('yolmov-auth-session');
      if (!sessionStr) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const session = JSON.parse(sessionStr);
      const customerId = session?.user?.id;
      
      if (!customerId) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // API'den bildirimleri çek
      const [notifs, count] = await Promise.all([
        supabaseApi.notifications.getByCustomerId(customerId),
        supabaseApi.notifications.getUnreadCount(customerId)
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Her 30 saniyede bir yeni bildirimleri kontrol et
    const interval = setInterval(loadNotifications, 30000);

    // Auth değişikliklerini dinle
    const handleAuthChange = () => {
      loadNotifications();
    };

    window.addEventListener('yolmov-auth-change', handleAuthChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('yolmov-auth-change', handleAuthChange);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabaseApi.notifications.markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Bildirim okundu işaretlenemedi:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const sessionStr = localStorage.getItem('yolmov-auth-session');
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);
      const customerId = session?.user?.id;
      
      if (!customerId) return;

      await supabaseApi.notifications.markAllAsRead(customerId);
      await loadNotifications();
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenemedi:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Okundu işaretlemesini engellemek için
    try {
      await supabaseApi.notifications.delete(id);
      await loadNotifications();
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Tüm bildirimleri silmek istediğinizden emin misiniz?')) return;
    
    try {
      const sessionStr = localStorage.getItem('yolmov-auth-session');
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);
      const customerId = session?.user?.id;
      
      if (!customerId) return;

      // Tüm bildirimleri tek tek sil
      await Promise.all(notifications.map(n => supabaseApi.notifications.delete(n.id)));
      await loadNotifications();
    } catch (error) {
      console.error('Bildirimler silinemedi:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'offer_received':
        return '💰';
      case 'offer_accepted':
        return '✅';
      case 'offer_rejected':
        return '❌';
      case 'request_matched':
        return '🤝';
      case 'system':
        return '🔔';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
        aria-label="Bildirimler"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs text-slate-500">({unreadCount} okunmamış)</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Check size={14} />
                      Tümünü Okundu İşaretle
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <X size={14} />
                      Tümünü Sil
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Bell size={32} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">Yükleniyor...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={32} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">Henüz bildiriminiz yok</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-slate-50 transition-colors relative group ${
                          !notif.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 cursor-pointer" onClick={() => handleMarkAsRead(notif.id)}>
                          <span className="text-2xl shrink-0">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {notif.title}
                              </h4>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(notif.createdAt).toLocaleString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Sil"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
