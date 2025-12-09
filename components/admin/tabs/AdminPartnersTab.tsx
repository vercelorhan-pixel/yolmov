/**
 * Admin Partners Tab
 * Partner listesi ve detay görünümü
 */

import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '../../shared/UIComponents';
import { Badge } from '../../shared/UIComponents';
import { 
  CheckCircle2, PauseCircle, XCircle, Eye, ArrowLeft, Mail, Phone, 
  MapPin, Star, FileText, Building, Calendar, DollarSign, Image,
  ExternalLink, X, Loader2, Shield, Search
} from 'lucide-react';
import { partnersApi, partnerCreditsApi } from '../../../services/supabaseApi';

interface Partner {
  id: string;
  name?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  city?: string;
  district?: string;
  status: string;
  rating?: number;
  completed_jobs?: number;
  credits?: number;
  created_at: string;
  tax_number?: string;
  trade_registry_number?: string;
  service_types?: string[];
  commercial_registry_url?: string;
  vehicle_license_url?: string;
  profile_photo_url?: string;
  logo_url?: string;
}

interface DocumentPreview {
  url: string;
  title: string;
}

const statusLabel = (s?: string) => {
  switch (s) {
    case 'active': return { text: 'Aktif', variant: 'success' as const };
    case 'pending': return { text: 'Beklemede', variant: 'warning' as const };
    case 'suspended': return { text: 'Askıda', variant: 'error' as const };
    default: return { text: 'Bilinmiyor', variant: 'neutral' as const };
  }
};

const AdminPartnersTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detail view states
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentPreview | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await partnersApi.getAll();
      setPartners(data);
    } catch (e: any) {
      console.error('Partner load error:', e);
      setError(e?.message || 'Partnerler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadPartnerDetails = async (partnerId: string) => {
    setDetailLoading(true);
    try {
      const allPartners = await partnersApi.getAll();
      const partner = allPartners.find((p: Partner) => p.id === partnerId);
      
      if (partner) {
        // Kredi bilgisini al
        try {
          const creditInfo = await partnerCreditsApi.getByPartnerId(partner.id);
          if (creditInfo) {
            partner.credits = creditInfo.balance;
          }
        } catch (e) {
          console.log('Credit info not found for partner');
        }
        setSelectedPartner(partner);
      }
    } catch (e: any) {
      console.error('Partner detail load error:', e);
      setError(e?.message || 'Partner detayları yüklenemedi');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id: string, next: 'active' | 'suspended' | 'pending') => {
    setStatusUpdating(true);
    try {
      await partnersApi.update(id, { status: next });
      // Update local state
      if (selectedPartner && selectedPartner.id === id) {
        setSelectedPartner({ ...selectedPartner, status: next });
      }
      await load();
    } catch (e: any) {
      console.error('Status update error:', e);
      setError(e?.message || 'Durum güncellenemedi');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Filter partners
  const filteredPartners = partners.filter(p => {
    // Status filter
    if (statusFilter && p.status !== statusFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const name = (p.company_name || p.name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(search) || email.includes(search) || phone.includes(search);
    }
    return true;
  });

  // If viewing partner detail
  if (selectedPartner) {
    const partner = selectedPartner;
    const displayName = partner.company_name || partner.name || 'Partner';
    const sl = statusLabel(partner.status);

    return (
      <div className="space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedPartner(null)} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600"
          >
            <ArrowLeft size={20} />
            Geri
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Partner Detayı</h2>
        </div>

        {/* Partner Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                <Shield size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{displayName}</h3>
                <p className="text-sm text-slate-600">{partner.first_name} {partner.last_name}</p>
                <p className="text-xs text-slate-500">{partner.id}</p>
              </div>
            </div>
            <Badge variant={sl.variant} className="px-4 py-2 text-sm font-bold">
              {sl.text}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Mail size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-900 text-sm">{partner.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Phone size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Telefon</p>
                <p className="font-medium text-slate-900 text-sm">{partner.phone}</p>
              </div>
            </div>
            {partner.city && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <MapPin size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Konum</p>
                  <p className="font-medium text-slate-900 text-sm">{partner.district}, {partner.city}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Kayıt Tarihi</p>
                <p className="font-medium text-slate-900 text-sm">
                  {new Date(partner.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <Star size={20} className="text-yellow-500 fill-yellow-500" />
              <div>
                <p className="text-xs text-yellow-700">Puan</p>
                <p className="font-bold text-slate-900">{partner.rating?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 size={20} className="text-green-500" />
              <div>
                <p className="text-xs text-green-700">Tamamlanan İşler</p>
                <p className="font-bold text-slate-900">{partner.completed_jobs || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <DollarSign size={20} className="text-orange-600" />
              <div>
                <p className="text-xs text-orange-700">Kredi Bakiyesi</p>
                <p className="font-bold text-slate-900">{partner.credits || 0}</p>
              </div>
            </div>
          </div>

          {/* Tax Info */}
          {(partner.tax_number || partner.trade_registry_number) && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building size={16} className="text-slate-600" />
                Şirket Bilgileri
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {partner.tax_number && (
                  <div>
                    <p className="text-xs text-slate-500">Vergi Numarası</p>
                    <p className="font-medium text-slate-900">{partner.tax_number}</p>
                  </div>
                )}
                {partner.trade_registry_number && (
                  <div>
                    <p className="text-xs text-slate-500">Ticaret Sicil No</p>
                    <p className="font-medium text-slate-900">{partner.trade_registry_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Types */}
          {partner.service_types && partner.service_types.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-2">Hizmet Tipleri</h4>
              <div className="flex flex-wrap gap-2">
                {partner.service_types.map((service, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {(partner.commercial_registry_url || partner.vehicle_license_url) && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Yüklenen Belgeler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {partner.commercial_registry_url && (
                  <button
                    onClick={() => setPreviewDocument({
                      url: partner.commercial_registry_url!,
                      title: 'Ticari Sicil Belgesi'
                    })}
                    className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Image size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">Ticari Sicil Belgesi</p>
                      <p className="text-xs text-slate-500">Tıklayarak önizleyin</p>
                    </div>
                    <Eye size={20} className="text-blue-600" />
                  </button>
                )}
                {partner.vehicle_license_url && (
                  <button
                    onClick={() => setPreviewDocument({
                      url: partner.vehicle_license_url!,
                      title: 'Araç Ruhsatı'
                    })}
                    className="flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl hover:bg-green-50 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Image size={24} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">Araç Ruhsatı</p>
                      <p className="text-xs text-slate-500">Tıklayarak önizleyin</p>
                    </div>
                    <Eye size={20} className="text-green-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {partner.status !== 'active' && (
              <button
                onClick={() => updateStatus(partner.id, 'active')}
                disabled={statusUpdating}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {statusUpdating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Onayla
              </button>
            )}
            {partner.status !== 'pending' && (
              <button
                onClick={() => updateStatus(partner.id, 'pending')}
                disabled={statusUpdating}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {statusUpdating ? <Loader2 size={18} className="animate-spin" /> : <PauseCircle size={18} />}
                Beklemeye Al
              </button>
            )}
            {partner.status !== 'suspended' && (
              <button
                onClick={() => updateStatus(partner.id, 'suspended')}
                disabled={statusUpdating}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {statusUpdating ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                Askıya Al
              </button>
            )}
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDocument && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDocument(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">{previewDocument.title}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Yeni Sekmede Aç
                  </a>
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-100 flex items-center justify-center" style={{ minHeight: '500px' }}>
                <img 
                  src={previewDocument.url} 
                  alt={previewDocument.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center p-8">
                          <p class="text-slate-600 mb-4">Önizleme yapılamıyor. Belgeyi yeni sekmede açın.</p>
                          <a href="${previewDocument.url}" target="_blank" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 inline-block">
                            Belgeyi Aç
                          </a>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Partner list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-900">Partnerler</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Partner ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askıda</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Building size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">Partner Bulunamadı</h3>
          <p className="text-slate-500">Arama kriterlerinize uygun partner yok.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 text-sm font-bold">
            Toplam: {filteredPartners.length} partner
          </div>
          <div className="divide-y divide-slate-100">
            {filteredPartners.map((p) => {
              const sl = statusLabel(p.status);
              const displayName = p.company_name || p.name || 'Partner';
              const profileImage = p.profile_photo_url || p.logo_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=64`;
              return (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <img 
                    src={profileImage} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{displayName}</div>
                    <div className="text-xs text-slate-500 truncate">{p.email} • {p.phone}</div>
                    <div className="text-xs text-slate-500">{p.city || '-'} / {p.district || '-'}</div>
                  </div>
                  <Badge variant={sl.variant}>{sl.text}</Badge>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadPartnerDetails(p.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Detayları Gör"
                    >
                      {detailLoading ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                    </button>
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'active')}
                      title="Onayla"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-bold hover:bg-yellow-600 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'pending')}
                      title="Beklemeye Al"
                    >
                      <PauseCircle size={16} />
                    </button>
                    <button
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'suspended')}
                      title="Askıya Al"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnersTab;
