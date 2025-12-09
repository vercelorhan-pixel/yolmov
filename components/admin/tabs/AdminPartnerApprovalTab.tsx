/**
 * Admin Partner Approval Tab
 * Onay bekleyen partner başvurularını yönetir
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, AlertCircle, Shield, Mail, Phone, Building, FileText, Calendar } from 'lucide-react';
import supabaseApi from '../../../services/supabaseApi';
import EmptyState from '../ui/EmptyState';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import { useAdminFilter } from '../hooks/useAdminFilter';

interface PendingPartner {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tax_number?: string;
  trade_registry_number?: string;
  service_types: string[];
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  documents?: any[];
}

const AdminPartnerApprovalTab: React.FC = () => {
  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);

  const { filtered, searchTerm, setSearchTerm } = useAdminFilter<PendingPartner>(
    pendingPartners,
    { searchKeys: ['company_name', 'first_name', 'last_name', 'email', 'phone'] }
  );

  useEffect(() => {
    loadPendingPartners();
  }, []);

  const loadPendingPartners = async () => {
    try {
      setLoading(true);
      const partners = await supabaseApi.partners.getAll();
      console.log('📋 Tüm partnerler:', partners);
      const pending = partners.filter(p => p.status === 'pending');
      console.log('⏳ Pending partnerler:', pending);
      setPendingPartners(pending as PendingPartner[]);
    } catch (error) {
      console.error('Onay bekleyen partnerler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    if (!confirm('Bu partner başvurusunu onaylamak istediğinize emin misiniz?')) return;

    try {
      const updated = await supabaseApi.partners.update(partnerId, { status: 'active' });
      alert(`Partner başvurusu onaylandı! (${updated?.id || partnerId})`);
      loadPendingPartners();
    } catch (error) {
      console.error('Partner onaylama hatası:', error);
      alert('Onaylama işlemi başarısız oldu.');
    }
  };

  const handleReject = async (partnerId: string) => {
    if (!confirm('Bu partner başvurusunu reddetmek istediğinize emin misiniz?')) return;

    try {
      const updated = await supabaseApi.partners.update(partnerId, { status: 'suspended' });
      alert(`Partner başvurusu reddedildi. (${updated?.id || partnerId})`);
      loadPendingPartners();
    } catch (error) {
      console.error('Partner reddetme hatası:', error);
      alert('Reddetme işlemi başarısız oldu.');
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Partner Onay</h2>
          <p className="text-slate-500 mt-1">Onay bekleyen partner başvurularını değerlendirin</p>
        </div>
        <div className="px-4 py-2 bg-orange-100 rounded-xl">
          <p className="text-xs text-orange-700 font-bold">Bekleyen Başvuru</p>
          <p className="text-2xl font-black text-orange-900">{pendingPartners.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Başvuru ara (şirket adı, yetkili, e-posta, telefon)..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={searchTerm ? "Başvuru Bulunamadı" : "Onay Bekleyen Başvuru Yok"}
          description={searchTerm ? "Arama kriterine uygun başvuru bulunamadı." : "Şu anda onay bekleyen partner başvurusu bulunmuyor."}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Şirket Bilgileri</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">İletişim</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Hizmetler</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Başvuru Tarihi</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Building size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{partner.company_name}</p>
                        <p className="text-xs text-slate-500">{partner.first_name} {partner.last_name}</p>
                        {partner.tax_number && (
                          <p className="text-xs text-slate-400">VKN: {partner.tax_number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {partner.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {partner.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {partner.service_types?.slice(0, 2).map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                          {service}
                        </span>
                      ))}
                      {partner.service_types?.length > 2 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                          +{partner.service_types.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(partner.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPartner(partner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Detayları Görüntüle"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleApprove(partner.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Onayla"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleReject(partner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reddet"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Partner Başvuru Detayları</h3>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Şirket Bilgileri */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Building size={16} className="text-orange-600" />
                  Şirket Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Şirket Adı</p>
                    <p className="font-bold text-slate-900">{selectedPartner.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Yetkili Kişi</p>
                    <p className="font-bold text-slate-900">{selectedPartner.first_name} {selectedPartner.last_name}</p>
                  </div>
                  {selectedPartner.tax_number && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Vergi Kimlik No</p>
                      <p className="font-bold text-slate-900">{selectedPartner.tax_number}</p>
                    </div>
                  )}
                  {selectedPartner.trade_registry_number && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Ticaret Sicil No</p>
                      <p className="font-bold text-slate-900">{selectedPartner.trade_registry_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">İletişim Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-slate-900">{selectedPartner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-slate-900">{selectedPartner.phone}</span>
                  </div>
                </div>
              </div>

              {/* Hizmet Tipleri */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Hizmet Tipleri</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.service_types?.map((service, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    handleApprove(selectedPartner.id);
                    setSelectedPartner(null);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Onayla
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedPartner.id);
                    setSelectedPartner(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Reddet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnerApprovalTab;
