/**
 * Admin Documents Management Tab
 * Tüm partnerlerin belge onay/red yönetimi
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Download, Calendar, FileText, AlertTriangle, Filter, User, RefreshCw } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import supabaseApi from '../../../services/supabaseApi';
import { PartnerDocument } from '../../../types';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  license: 'Sürücü Belgesi',
  insurance: 'Sigorta Poliçesi',
  registration: 'Araç Ruhsatı',
  tax: 'Vergi Levhası',
  identity: 'Kimlik Belgesi',
};

// Demo data for seeding if empty
const INITIAL_DOCUMENTS: Omit<PartnerDocument, 'id' | 'uploadDate' | 'status'>[] = [
  { partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'license', fileName: 'surucu_belgesi_2024.pdf', fileSize: '1.2 MB', expiryDate: '2028-05-15' },
  { partnerId: 'PTR-001', partnerName: 'Yılmaz Oto Kurtarma', type: 'insurance', fileName: 'kasko_policesi.pdf', fileSize: '800 KB', expiryDate: '2025-12-31' },
  { partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'registration', fileName: 'arac_ruhsati.jpg', fileSize: '650 KB' },
  { partnerId: 'PTR-003', partnerName: 'Mega Çekici', type: 'tax', fileName: 'vergi_levhasi.pdf', fileSize: '400 KB' },
  { partnerId: 'PTR-002', partnerName: 'Hızlı Yol Yardım', type: 'identity', fileName: 'kimlik_fotokopisi.jpg', fileSize: '550 KB' },
  { partnerId: 'PTR-003', partnerName: 'Mega Çekici', type: 'insurance', fileName: 'sorumluluk_sigortasi.pdf', fileSize: '1.5 MB', expiryDate: '2025-11-30' },
];

const AdminDocumentsTab: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<PartnerDocument | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');

  // Load documents from Supabase on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await supabaseApi.partnerDocuments.getAll();
      setDocuments(docs);
    } catch (error) {
      console.error('❌ Belgeler yüklenemedi:', error);
    }
  };

  // Unique partner listesi
  const uniquePartners = Array.from(new Set(documents.map(d => d.partnerName))).sort();

  // Filtrele
  let filteredDocs = documents;
  
  // Partner filtresi
  if (selectedPartner !== 'all') {
    filteredDocs = filteredDocs.filter(d => d.partnerName === selectedPartner);
  }

  // Belge tipi filtresi
  if (documentTypeFilter !== 'all') {
    filteredDocs = filteredDocs.filter(d => d.type === documentTypeFilter);
  }

  // Tarih filtresi
  if (dateFilter !== 'all') {
    const now = new Date();
    filteredDocs = filteredDocs.filter(d => {
      const uploadDate = new Date(d.uploadDate);
      switch (dateFilter) {
        case 'today':
          return uploadDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return uploadDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return uploadDate >= monthAgo;
        default:
          return true;
      }
    });
  }

  const { filtered, searchTerm, setSearchTerm, filterType, setFilterType } = useAdminFilter<PartnerDocument>(
    filteredDocs,
    { searchKeys: ['partnerName', 'fileName'], statusKey: 'status' }
  );

  const handleApprove = async (doc: PartnerDocument) => {
    try {
      await supabaseApi.partnerDocuments.update(doc.id, {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      });
      
      await loadDocuments();
      setSelectedDoc(null);
    } catch (error) {
      console.error('❌ Belge onaylanamadı:', error);
      alert('Belge onaylanırken hata oluştu.');
    }
  };

  const openRejectModal = (doc: PartnerDocument) => {
    setSelectedDoc(doc);
    setShowRejectModal(true);
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  const submitRejection = async () => {
    if (!selectedDoc || !rejectionReason.trim()) return;
    
    try {
      // Supabase'de belge durumunu güncelle
      await supabaseApi.partnerDocuments.update(selectedDoc.id, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        reviewedAt: new Date().toISOString()
      });
      
      await loadDocuments();
      
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDoc(null);
    } catch (error) {
      console.error('❌ Belge reddedilemedi:', error);
      alert('Belge reddedilirken hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText size={20} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Toplam</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <span className="text-xs font-bold text-yellow-600">Bekliyor</span>
          </div>
          <p className="text-2xl font-black text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-xs font-bold text-green-600">Onaylı</span>
          </div>
          <p className="text-2xl font-black text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle size={20} className="text-red-600" />
            <span className="text-xs font-bold text-red-600">Reddedilen</span>
          </div>
          <p className="text-2xl font-black text-red-700">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Partner veya dosya adı ile ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Partner Dropdown Filtresi */}
        <select
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={selectedPartner}
          onChange={(e) => setSelectedPartner(e.target.value)}
        >
          <option value="all">Tüm Acenteler</option>
          {uniquePartners.map(partner => (
            <option key={partner} value={partner}>{partner}</option>
          ))}
        </select>

        {/* Belge Tipi Filtresi */}
        <select
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={documentTypeFilter}
          onChange={(e) => setDocumentTypeFilter(e.target.value)}
        >
          <option value="all">Tüm Belge Tipleri</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Tarih Filtresi */}
        <select
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">Tüm Zamanlar</option>
          <option value="today">Bugün</option>
          <option value="week">Son 7 Gün</option>
          <option value="month">Son 30 Gün</option>
        </select>
      </div>

      {/* Durum Filtresi (Ayrı Satır) */}
      <div className="flex gap-4">
        <select
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Onay Bekliyor</option>
          <option value="approved">Onaylı</option>
          <option value="rejected">Reddedilen</option>
        </select>
        
        {/* Aktif Filtre Sayacı */}
        {(selectedPartner !== 'all' || dateFilter !== 'all' || documentTypeFilter !== 'all' || filterType !== 'all') && (
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
            <Filter size={18} className="text-orange-600" />
            <span className="text-sm font-bold text-orange-700">
              {[selectedPartner !== 'all', dateFilter !== 'all', documentTypeFilter !== 'all', filterType !== 'all'].filter(Boolean).length} Filtre Aktif
            </span>
            <button
              onClick={() => {
                setSelectedPartner('all');
                setDateFilter('all');
                setDocumentTypeFilter('all');
                setFilterType('all');
              }}
              className="ml-2 text-xs text-orange-600 hover:text-orange-700 font-bold underline"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="Belge Bulunamadı" description="Arama kriterinize uygun belge yok." />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Belge Tipi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Dosya</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Yüklenme</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Son Geçerlilik</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{doc.partnerName}</p>
                        <p className="text-xs text-slate-500">{doc.partnerId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="cursor-pointer hover:text-orange-600 transition-colors"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <p className="text-sm font-mono text-slate-900 underline">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">{doc.fileSize}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{doc.uploadDate}</td>
                  <td className="px-6 py-4">
                    {doc.expiryDate ? (
                      <span className="text-sm text-slate-700">{doc.expiryDate}</span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge type="document" status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Görüntüle"
                      >
                        <Eye size={18} />
                      </button>
                      {doc.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc)}
                            className="p-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            title="Onayla"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowRejectModal(true);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Reddet"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Belge Detayları</h2>
              <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Partner</p>
                  <p className="font-bold text-slate-900">{selectedDoc.partnerName}</p>
                  <p className="text-xs text-slate-500">{selectedDoc.partnerId}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Belge Tipi</p>
                  <p className="font-bold text-slate-900">{DOCUMENT_TYPE_LABELS[selectedDoc.type]}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Dosya Bilgisi</p>
                <p className="font-mono text-sm text-slate-900">{selectedDoc.fileName}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedDoc.fileSize}</p>
              </div>

              {/* Belge Önizleme */}
              {selectedDoc.fileUrl && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Belge Önizleme</p>
                  <div className="bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center min-h-[200px]">
                    {selectedDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                      <div className="text-center">
                        <FileText size={48} className="text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">PDF Belgesi</p>
                        <a 
                          href={selectedDoc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Yeni sekmede aç
                        </a>
                      </div>
                    ) : (
                      <img 
                        src={selectedDoc.fileUrl} 
                        alt={selectedDoc.fileName}
                        className="max-w-full max-h-[300px] object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <a 
                    href={selectedDoc.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={selectedDoc.fileName}
                    className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download size={12} /> Dosyayı İndir
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Yüklenme Tarihi</p>
                  <p className="font-bold text-slate-900">{selectedDoc.uploadDate}</p>
                </div>
                {selectedDoc.expiryDate && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs text-orange-600 mb-1">Son Geçerlilik</p>
                    <p className="font-bold text-orange-900">{selectedDoc.expiryDate}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">Durum</p>
                <StatusBadge type="document" status={selectedDoc.status} />
              </div>

              {selectedDoc.status === 'rejected' && selectedDoc.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-600 mb-1">Red Nedeni:</p>
                  <p className="text-sm text-red-800">{selectedDoc.rejectionReason}</p>
                  {selectedDoc.reviewedBy && (
                    <p className="text-xs text-red-600 mt-2">
                      {selectedDoc.reviewedBy} • {selectedDoc.reviewedAt}
                    </p>
                  )}
                </div>
              )}

              {selectedDoc.status === 'approved' && selectedDoc.reviewedBy && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-green-600 mb-1">Onaylayan:</p>
                  <p className="text-sm text-green-800">{selectedDoc.reviewedBy}</p>
                  <p className="text-xs text-green-600 mt-1">{selectedDoc.reviewedAt}</p>
                </div>
              )}

              {selectedDoc.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reddet
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoc)}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Onayla
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Belge Reddetme</h2>
            <p className="text-sm text-slate-600 mb-4">
              <strong>{selectedDoc.partnerName}</strong> firmasının <strong>{DOCUMENT_TYPE_LABELS[selectedDoc.type]}</strong> belgesini neden reddediyorsunuz?
            </p>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
              rows={4}
              placeholder="Red nedenini açıklayın (zorunlu)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                İptal
              </button>
              <button
                onClick={submitRejection}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentsTab;
