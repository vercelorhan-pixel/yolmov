/**
 * Partner Documents Management Component
 * Partnerin belgelerini yükleme ve onay durumu takibi
 */

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, CheckCircle, XCircle, Clock, Eye, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { compressImage, isImageFile } from '../utils/imageCompression';
import supabaseApi from '../services/supabaseApi';

interface PartnerDocument {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'license' | 'insurance' | 'registration' | 'tax' | 'identity';
  name: string;
  fileUrl?: string;
  fileSize: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const DOCUMENT_TYPES = [
  { value: 'license', label: 'Sürücü Belgesi', required: true },
  { value: 'insurance', label: 'Kasko/Sigorta Poliçesi', required: true },
  { value: 'registration', label: 'Araç Ruhsatı', required: true },
  { value: 'tax', label: 'Vergi Levhası', required: true },
  { value: 'identity', label: 'Kimlik Belgesi', required: true },
];

export const PartnerDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<PartnerDocument | null>(null);
  
  // Partner ID'yi yolmov_partner JSON objesinden al
  const partnerData = localStorage.getItem('yolmov_partner');
  const currentPartnerId = partnerData ? JSON.parse(partnerData).id : '';
  const currentPartnerName = localStorage.getItem('yolmov_partner_name') || 'Partner';

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await supabaseApi.partnerDocuments.getByPartnerId(currentPartnerId);
      // API zaten camelCase döndürüyor
      const mapped = docs.map((d: any) => ({
        id: d.id,
        partnerId: d.partnerId,
        partnerName: d.partnerName || currentPartnerName,
        type: d.type,
        name: d.fileName,
        fileUrl: d.fileUrl,
        fileSize: d.fileSize,
        uploadDate: d.uploadDate ? new Date(d.uploadDate).toLocaleDateString('tr-TR') : '',
        expiryDate: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('tr-TR') : undefined,
        status: d.status,
        rejectionReason: d.rejectionReason
      }));
      setDocuments(mapped);
    } catch (error) {
      console.error('❌ Belgeler yüklenemedi:', error);
    }
  };


  const getStatusBadge = (status: PartnerDocument['status']) => {
    const config = {
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Onaylandı' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'İnceleniyor' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Reddedildi' },
    };
    const { bg, text, border, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedType) {
      setErrorMsg('Lütfen önce belge türünü seçin.');
      return;
    }
    if (!e.target.files || !e.target.files.length) {
      return;
    }
    
    const file = e.target.files[0];

    setUploading(true);
    
    try {
      let finalFile = file;
      
      // Eğer görsel dosyası ise sıkıştır
      if (isImageFile(file)) {
        const result = await compressImage(file);
        finalFile = result.compressedFile;
        console.log(`📄 Belge sıkıştırıldı: ${result.compressionRatio.toFixed(1)}% küçültüldü`);
      }
      
      // TODO: Storage API eklenecek - şimdilik mock URL
      const uploadUrl = `https://placeholder-url/${finalFile.name}`;

      // Veritabanına kaydet
      const created = await supabaseApi.partnerDocuments.create({
        partnerId: currentPartnerId,
        partnerName: currentPartnerName,
        type: selectedType as any,
        fileName: finalFile.name,
        fileSize: `${(finalFile.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'pending'
      });

      const newDoc: PartnerDocument = {
        id: created.id,
        partnerId: currentPartnerId,
        partnerName: currentPartnerName,
        type: selectedType as any,
        name: finalFile.name,
        fileSize: `${(finalFile.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toLocaleDateString('tr-TR'),
        status: 'pending'
      };

      setDocuments(prev => [...prev, newDoc]);
      console.log('📄 [PartnerDocuments] Document uploaded:', uploadUrl);
      
      setUploading(false);
      setSelectedType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setErrorMsg(null);
    } catch (error) {
      console.error('❌ Belge yükleme hatası:', error);
      setErrorMsg('Belge yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      setUploading(false);
    }
  };

  const stats = {
    total: DOCUMENT_TYPES.length,
    approved: documents.filter((d: PartnerDocument) => d.status === 'approved').length,
    pending: documents.filter((d: PartnerDocument) => d.status === 'pending').length,
    rejected: documents.filter((d: PartnerDocument) => d.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Belge</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Onaylı</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">İnceleniyor</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reddedilen</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Yeni Belge Yükle</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Belge Türü Seçin</option>
            {DOCUMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} {type.required && '*'}
              </option>
            ))}
          </select>

          <label
            onClick={() => {
              if (!selectedType) {
                setErrorMsg('Önce belge türünü seçmelisiniz.');
              }
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${selectedType ? 'bg-orange-600 text-white cursor-pointer hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading ? 'Yükleniyor...' : 'Belge Seç ve Yükle'}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={!selectedType || uploading}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-3">* PDF, JPG, PNG formatında, maksimum 5 MB</p>
        {errorMsg && (
          <p className="text-xs mt-2 text-red-600">{errorMsg}</p>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map(doc => {
          const docType = DOCUMENT_TYPES.find(t => t.value === doc.type);
          return (
            <div key={doc.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{docType?.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{doc.name} • {doc.fileSize}</p>
                    <p className="text-xs text-gray-400 mt-1">Yüklenme: {doc.uploadDate}</p>
                    {doc.expiryDate && (
                      <p className="text-xs text-gray-400">Son Geçerlilik: {doc.expiryDate}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(doc.status)}
                  <div className="flex gap-2">
                    <button onClick={() => setViewingDocument(doc)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                      <Eye size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => alert(`'${doc.name}' indiriliyor.`)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                      <Download size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>

              {doc.status === 'rejected' && doc.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700 mb-1">Red Nedeni:</p>
                    <p className="text-xs text-red-600">{doc.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Belge Onay Süreci</h4>
            <p className="text-sm text-blue-700">
              Yüklediğiniz belgeler admin ekibi tarafından 24 saat içinde incelenir. Onaylanan belgeler ile iş kabulüne başlayabilirsiniz. 
              Eksik veya hatalı belgeler için bildirim alacaksınız.
            </p>
          </div>
        </div>
      </div>

      {/* Document Viewing Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingDocument(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Belge Detayları</h2>
                <p className="text-sm text-gray-500 mt-1">{DOCUMENT_TYPES.find(t => t.value === viewingDocument.type)?.label}</p>
              </div>
              <button onClick={() => setViewingDocument(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <XCircle size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Belge Bilgileri */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Belge Türü</p>
                  <p className="font-bold text-gray-900">{DOCUMENT_TYPES.find(t => t.value === viewingDocument.type)?.label}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Dosya Adı</p>
                  <p className="font-mono text-sm text-gray-900">{viewingDocument.name}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Dosya Boyutu</p>
                  <p className="font-bold text-gray-900">{viewingDocument.fileSize}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Yüklenme Tarihi</p>
                  <p className="font-bold text-gray-900">{viewingDocument.uploadDate}</p>
                </div>

                {viewingDocument.expiryDate && (
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-xs font-bold text-orange-600 uppercase mb-2">Son Geçerlilik</p>
                    <p className="font-bold text-orange-900">{viewingDocument.expiryDate}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Durum</p>
                  {getStatusBadge(viewingDocument.status)}
                </div>

                {viewingDocument.status === 'rejected' && viewingDocument.rejectionReason && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-600 uppercase mb-2">Red Nedeni</p>
                    <p className="text-sm text-red-800">{viewingDocument.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Belge Görseli / Önizleme */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-2xl p-4 h-96 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                  {viewingDocument.name.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center">
                      <FileText size={64} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">PDF Belgesi</p>
                      <p className="text-xs text-gray-400 mt-2">Tam görünüm için indirin</p>
                    </div>
                  ) : viewingDocument.fileUrl ? (
                    <img 
                      src={viewingDocument.fileUrl} 
                      alt={viewingDocument.name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="text-center"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mx-auto mb-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><p class="text-gray-600 font-medium">Görsel yüklenemedi</p></div>';
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Eye size={64} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Görsel Önizleme</p>
                      <p className="text-xs text-gray-400 mt-2">{viewingDocument.name}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <a 
                    href={viewingDocument.fileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={viewingDocument.name}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${viewingDocument.fileUrl ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    onClick={(e) => !viewingDocument.fileUrl && e.preventDefault()}
                  >
                    <Download size={18} />
                    İndir
                  </a>
                  <button 
                    onClick={() => setViewingDocument(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Kapat
                  </button>
                </div>

                {viewingDocument.status === 'rejected' && (
                  <button 
                    onClick={() => {
                      setViewingDocument(null);
                      setSelectedType(viewingDocument.type);
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    Yeniden Yükle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDocuments;
