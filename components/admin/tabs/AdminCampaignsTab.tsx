import React, { useEffect, useState } from 'react';
import { TableSkeleton, Badge } from '../../shared/UIComponents';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, 
  Tag, Calendar, Percent, Gift, X, Save, Image as ImageIcon 
} from 'lucide-react';
import { campaignsApi, CampaignDB, CampaignInput } from '../../../services/supabaseApi';

interface EditingCampaign {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  badge_text: string;
  valid_until: string;
  discount: string;
  code: string;
  is_active: boolean;
  sort_order: string;
  start_date: string;
  end_date: string;
}

const emptyForm: EditingCampaign = {
  title: '',
  description: '',
  image_url: '',
  badge_text: '',
  valid_until: '',
  discount: '',
  code: '',
  is_active: true,
  sort_order: '0',
  start_date: '',
  end_date: ''
};

const AdminCampaignsTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EditingCampaign>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await campaignsApi.getAll();
      setCampaigns(data);
    } catch (e: any) {
      console.error('Campaigns load error:', e);
      setError(e?.message || 'Kampanyalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(emptyForm);
    setShowModal(true);
  };

  const openEdit = (campaign: CampaignDB) => {
    setEditing({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      image_url: campaign.image_url,
      badge_text: campaign.badge_text || '',
      valid_until: campaign.valid_until || '',
      discount: campaign.discount?.toString() || '',
      code: campaign.code || '',
      is_active: campaign.is_active,
      sort_order: campaign.sort_order.toString(),
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing.title || !editing.description || !editing.image_url) {
      setError('Başlık, açıklama ve görsel URL zorunludur');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const input: CampaignInput = {
        title: editing.title,
        description: editing.description,
        image_url: editing.image_url,
        badge_text: editing.badge_text || undefined,
        valid_until: editing.valid_until || undefined,
        discount: editing.discount ? parseInt(editing.discount) : undefined,
        code: editing.code || undefined,
        is_active: editing.is_active,
        sort_order: parseInt(editing.sort_order) || 0,
        start_date: editing.start_date || undefined,
        end_date: editing.end_date || undefined
      };

      if (editing.id) {
        await campaignsApi.update(editing.id, input);
      } else {
        await campaignsApi.create(input);
      }

      setShowModal(false);
      setEditing(emptyForm);
      await load();
    } catch (e: any) {
      console.error('Campaign save error:', e);
      setError(e?.message || 'Kampanya kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;

    setDeleting(id);
    try {
      await campaignsApi.delete(id);
      await load();
    } catch (e: any) {
      console.error('Campaign delete error:', e);
      setError(e?.message || 'Kampanya silinemedi');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await campaignsApi.toggleActive(id, !currentActive);
      await load();
    } catch (e: any) {
      console.error('Toggle active error:', e);
      setError(e?.message || 'Durum değiştirilemedi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Kampanya Yönetimi</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} />
          Yeni Kampanya
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Kapat</button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : campaigns.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center">
          <Gift size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Henüz kampanya eklenmemiş</p>
          <button
            onClick={openNew}
            className="mt-4 px-4 py-2 bg-brand-orange text-white rounded-lg font-bold text-sm"
          >
            İlk Kampanyayı Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className={`bg-white rounded-2xl border overflow-hidden ${
                campaign.is_active ? 'border-slate-200' : 'border-slate-300 opacity-60'
              }`}
            >
              <div className="flex">
                {/* Görsel */}
                <div className="w-40 h-32 flex-shrink-0">
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x128?text=Görsel+Yok';
                    }}
                  />
                </div>
                
                {/* İçerik */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{campaign.title}</h3>
                        <Badge variant={campaign.is_active ? 'success' : 'neutral'}>
                          {campaign.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{campaign.description}</p>
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(campaign.id, campaign.is_active)}
                        className={`p-2 rounded-lg ${
                          campaign.is_active 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={campaign.is_active ? 'Pasife Al' : 'Aktif Et'}
                      >
                        {campaign.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => openEdit(campaign)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deleting === campaign.id}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Meta bilgiler */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    {campaign.badge_text && (
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {campaign.badge_text}
                      </span>
                    )}
                    {campaign.discount && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Percent size={14} />
                        %{campaign.discount} İndirim
                      </span>
                    )}
                    {campaign.valid_until && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {campaign.valid_until}
                      </span>
                    )}
                    {campaign.code && (
                      <span className="flex items-center gap-1 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {campaign.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editing.id ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Kampanya başlığı"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Açıklama *
                </label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Kampanya açıklaması"
                />
              </div>

              {/* Görsel URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Görsel URL *
                </label>
                <input
                  type="text"
                  value={editing.image_url}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="https://..."
                />
                {editing.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden w-32 h-24 bg-slate-100">
                    <img 
                      src={editing.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Etiket (Badge)
                </label>
                <input
                  type="text"
                  value={editing.badge_text}
                  onChange={(e) => setEditing({ ...editing, badge_text: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  placeholder="Örn: %30 İndirim, Yeni Üyelere Özel"
                />
              </div>

              {/* İndirim ve Kod */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    İndirim (%)
                  </label>
                  <input
                    type="number"
                    value={editing.discount}
                    onChange={(e) => setEditing({ ...editing, discount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="30"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kupon Kodu
                  </label>
                  <input
                    type="text"
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="KAMPANYA30"
                  />
                </div>
              </div>

              {/* Geçerlilik ve Sıralama */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Geçerlilik Tarihi (Metin)
                  </label>
                  <input
                    type="text"
                    value={editing.valid_until}
                    onChange={(e) => setEditing({ ...editing, valid_until: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="31 Aralık 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Başlangıç ve Bitiş Tarihleri */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bitiş Tarihi (Geri Sayım)
                  </label>
                  <input
                    type="datetime-local"
                    value={editing.end_date}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  />
                </div>
              </div>

              {/* Aktif mi? */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700">
                  Kampanya aktif olarak yayınlansın
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignsTab;
