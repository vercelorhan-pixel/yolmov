import React from 'react';
import { 
  ChevronDown, Truck, Camera, Store, Info, Check, Calendar, 
  FileText, AlertCircle, Save, Loader2, Plus, Edit2, History, 
  Settings, User, X
} from 'lucide-react';
import { PartnerVehicle, CompletedJob } from '../../types';

// Props Interface
export interface PartnerFleetTabProps {
  fleet: PartnerVehicle[];
  partnerHistory: CompletedJob[];
  partnerName: string;
  
  // Vehicle Edit State
  showVehicleEditPage: boolean;
  setShowVehicleEditPage: (show: boolean) => void;
  selectedVehicleForSettings: PartnerVehicle | null;
  setSelectedVehicleForSettings: (vehicle: PartnerVehicle | null) => void;
  
  // Vehicle History Modal
  selectedVehicleForHistory: PartnerVehicle | null;
  setSelectedVehicleForHistory: (vehicle: PartnerVehicle | null) => void;
  
  // Vehicle Stats
  vehicleStats: {
    totalJobs: number;
    monthlyJobs: number;
    averageRating: number;
    totalEarnings: number;
  } | null;
  loadingVehicleStats: boolean;
  
  // Add Vehicle Modal
  setShowAddVehicleModal: (show: boolean) => void;
}

const PartnerFleetTab: React.FC<PartnerFleetTabProps> = ({
  fleet,
  partnerHistory,
  partnerName,
  showVehicleEditPage,
  setShowVehicleEditPage,
  selectedVehicleForSettings,
  setSelectedVehicleForSettings,
  selectedVehicleForHistory,
  setSelectedVehicleForHistory,
  vehicleStats,
  loadingVehicleStats,
  setShowAddVehicleModal,
}) => {
  // Araç Düzenleme Tam Sayfa Ekranı
  if (showVehicleEditPage && selectedVehicleForSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setShowVehicleEditPage(false);
                  setSelectedVehicleForSettings(null);
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-all"
              >
                <ChevronDown size={20} className="rotate-90" />
                <span>Filo Yönetimine Dön</span>
              </button>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${selectedVehicleForSettings.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {selectedVehicleForSettings.status === 'active' ? '🟢 Aktif' : '🟠 Bakımda'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                {selectedVehicleForSettings.front_photo_url ? (
                  <img src={selectedVehicleForSettings.front_photo_url} alt={selectedVehicleForSettings.plate} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Truck size={48} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedVehicleForSettings.plate}</h1>
                <p className="text-xl text-slate-600 mb-4">{selectedVehicleForSettings.brand} {selectedVehicleForSettings.model}</p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <span className="text-xs text-blue-600 font-bold uppercase">Araç Tipi</span>
                    <p className="text-sm font-bold text-blue-900">{selectedVehicleForSettings.type}</p>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-xl">
                    <span className="text-xs text-purple-600 font-bold uppercase">Model Yılı</span>
                    <p className="text-sm font-bold text-purple-900">{selectedVehicleForSettings.year}</p>
                  </div>
                  <div className="bg-amber-50 px-4 py-2 rounded-xl">
                    <span className="text-xs text-amber-600 font-bold uppercase">Sürücü</span>
                    <p className="text-sm font-bold text-amber-900">{selectedVehicleForSettings.driver}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Kolon - Araç Bilgileri */}
            <div className="lg:col-span-2 space-y-6">
              {/* Temel Bilgiler */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-white" />
                  </div>
                  Araç Bilgileri
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plaka</label>
                    <input
                      type="text"
                      defaultValue={selectedVehicleForSettings.plate}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Tipi</label>
                    <select
                      defaultValue={selectedVehicleForSettings.type}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="cekici">Çekici</option>
                      <option value="vinc">Vinç</option>
                      <option value="kurtarici">Kurtarıcı</option>
                      <option value="servis">Servis Aracı</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marka</label>
                    <input
                      type="text"
                      defaultValue={selectedVehicleForSettings.brand}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model</label>
                    <input
                      type="text"
                      defaultValue={selectedVehicleForSettings.model}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Yılı</label>
                    <input
                      type="number"
                      defaultValue={selectedVehicleForSettings.year}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sürücü</label>
                    <input
                      type="text"
                      defaultValue={selectedVehicleForSettings.driver}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Durumu</label>
                    <select
                      defaultValue={selectedVehicleForSettings.status}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="active">🟢 Aktif</option>
                      <option value="maintenance">🟠 Bakımda</option>
                      <option value="inactive">⚫ Pasif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Araç Görselleri */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Camera size={20} className="text-white" />
                  </div>
                  Araç Görselleri
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Ön Görünüm</label>
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                      {selectedVehicleForSettings.front_photo_url ? (
                        <>
                          <img src={selectedVehicleForSettings.front_photo_url} alt="Ön" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Camera size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Yan Görünüm</label>
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                      {selectedVehicleForSettings.side_photo_url ? (
                        <>
                          <img src={selectedVehicleForSettings.side_photo_url} alt="Yan" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Camera size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700">Arka Görünüm</label>
                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                      {selectedVehicleForSettings.back_photo_url ? (
                        <>
                          <img src={selectedVehicleForSettings.back_photo_url} alt="Arka" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Camera size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vitrin Bilgileri (Showcase) */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Store size={20} className="text-white" />
                  </div>
                  Vitrin Bilgileri (Müşterilere Gösterilir)
                </h2>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Bu bilgiler müşteri vitrininizde görünecektir</p>
                      <p className="text-xs text-amber-600 mt-1">Hizmet sağlayıcı profilinizde bu araç bilgileri müşterilere gösterilir.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kapasite</label>
                    <select
                      defaultValue={selectedVehicleForSettings.showcase_capacity || ''}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="3.5_ton">3.5 Ton'a kadar</option>
                      <option value="7.5_ton">7.5 Ton'a kadar</option>
                      <option value="15_ton">15 Ton'a kadar</option>
                      <option value="25_ton">25 Ton'a kadar</option>
                      <option value="40_ton">40 Ton ve üzeri</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sigorta Tipi</label>
                    <select
                      defaultValue={selectedVehicleForSettings.showcase_insurance_type || ''}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="tasima_kaskosu">Taşıma Kaskosu Var</option>
                      <option value="sorumluluk">Sorumluluk Sigortası</option>
                      <option value="tam_kapsamli">Tam Kapsamlı</option>
                      <option value="yok">Sigorta Yok</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ekipman</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'vinc', label: 'Vinç' },
                        { value: 'hidrolik_platform', label: 'Hidrolik Platform' },
                        { value: 'uzun_platform', label: 'Uzun Platform' },
                        { value: 'tekerleksiz_cekim', label: 'Tekerleksiz Çekim' },
                        { value: 'gps_takip', label: 'GPS Takip' },
                        { value: 'gece_aydinlatma', label: 'Gece Aydınlatma' },
                      ].map(equip => (
                        <span
                          key={equip.value}
                          className={`px-4 py-2 rounded-xl text-sm font-bold ${
                            (selectedVehicleForSettings.showcase_equipment || []).includes(equip.value)
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {equip.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Açıklaması (Vitrin)</label>
                    <textarea
                      defaultValue={selectedVehicleForSettings.showcase_description || ''}
                      placeholder="Örn: Aracımız son model olup, alçak şasi spor araçlar dahil tüm binek ve hafif ticari araçları hasarsız yükleme garantisi ile taşımaktadır."
                      rows={4}
                      className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500">Bu açıklama müşterilere gösterilecektir. Telefon, email veya sosyal medya bilgisi girmeyin.</p>
                  </div>

                  <div className="md:col-span-2">
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      selectedVehicleForSettings.is_showcase_vehicle 
                        ? 'bg-green-100 border-2 border-green-300' 
                        : 'bg-slate-100 border-2 border-slate-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedVehicleForSettings.is_showcase_vehicle 
                          ? 'bg-green-500 text-white' 
                          : 'bg-slate-300 text-slate-500'
                      }`}>
                        {selectedVehicleForSettings.is_showcase_vehicle ? <Check size={14} /> : null}
                      </div>
                      <span className={`font-bold ${
                        selectedVehicleForSettings.is_showcase_vehicle 
                          ? 'text-green-800' 
                          : 'text-slate-600'
                      }`}>
                        {selectedVehicleForSettings.is_showcase_vehicle 
                          ? '✓ Bu araç vitrin aracı olarak belirlendi' 
                          : 'Bu araç vitrin aracı olarak belirlenmedi'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Kolon - İstatistikler & Hızlı İşlemler */}
            <div className="space-y-6">
              {/* İstatistikler */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl p-6 text-white">
                <h3 className="text-xl font-black mb-6">Araç İstatistikleri</h3>
                {loadingVehicleStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-white" />
                  </div>
                ) : vehicleStats ? (
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-blue-100 mb-1">Toplam İş</div>
                      <div className="text-3xl font-black">{vehicleStats.totalJobs}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-blue-100 mb-1">Son 30 Gün</div>
                      <div className="text-3xl font-black">{vehicleStats.monthlyJobs}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-blue-100 mb-1">Ortalama Puan</div>
                      <div className="text-3xl font-black">
                        {vehicleStats.averageRating > 0 ? `${vehicleStats.averageRating} ⭐` : 'Henüz yok'}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-sm text-blue-100 mb-1">Toplam Kazanç</div>
                      <div className="text-2xl font-black">₺{vehicleStats.totalEarnings.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-blue-100 text-sm">
                    Veri yüklenemedi
                  </div>
                )}
              </div>

              {/* Hızlı İşlemler */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">Hızlı İşlemler</h3>
                <div className="space-y-3">
                  <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-3">
                    <Calendar size={20} />
                    İş Geçmişini Gör
                  </button>
                  <button className="w-full bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-3">
                    <FileText size={20} />
                    Belgeleri Görüntüle
                  </button>
                  <button className="w-full bg-red-500 text-white p-4 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-3">
                    <AlertCircle size={20} />
                    Aracı Devre Dışı Bırak
                  </button>
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <button
                  onClick={() => {
                    alert('✅ Araç bilgileri başarıyla güncellendi!');
                    setShowVehicleEditPage(false);
                    setSelectedVehicleForSettings(null);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-2xl font-black text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
                >
                  <Save size={24} />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ana filo sayfası
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Desktop'ta normal, mobilde gizli (header'da var) */}
      <div className="hidden lg:flex justify-between items-center p-4 lg:p-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Araç Filosu</h2>
          <p className="text-sm text-slate-500">Kayıtlı araçlarınızı yönetin ve durumlarını izleyin.</p>
        </div>
        <button
          onClick={() => setShowAddVehicleModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus size={16} /> Yeni Araç Ekle
        </button>
      </div>

      {/* Mobile: Özet Bilgi */}
      <div className="lg:hidden px-4 pt-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
          <div>
            <p className="text-xs text-slate-400">Toplam Araç</p>
            <p className="text-2xl font-black">{fleet.length}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-xs text-green-400">Aktif</p>
              <p className="text-lg font-bold">{fleet.filter(v => v.status === 'active').length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-orange-400">Bakım</p>
              <p className="text-lg font-bold">{fleet.filter(v => v.status !== 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Araç Kartları */}
      <div className="px-4 lg:px-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {fleet.length > 0 ? (
          <>
            {fleet.map(vehicle => (
              <div key={vehicle.id} className="bg-white rounded-2xl lg:rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Araç Görseli */}
                <div className="h-36 lg:h-40 bg-slate-100 relative">
                  {vehicle.front_photo_url ? (
                    <img src={vehicle.front_photo_url} alt={vehicle.plate} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Truck size={48} className="text-slate-300" />
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${vehicle.status === 'active' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {vehicle.status === 'active' ? 'Aktif' : 'Bakımda'}
                  </div>
                </div>
                
                {/* Araç Bilgileri */}
                <div className="p-4 lg:p-5">
                  {/* Plaka ve Marka */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-lg lg:text-xl tracking-wide">{vehicle.plate}</h3>
                      <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                    </div>
                    {/* Ayarlar - Daha büyük tıklanabilir alan */}
                    <button 
                      onClick={() => {
                        setSelectedVehicleForSettings(vehicle);
                        setShowVehicleEditPage(true);
                      }} 
                      className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors -mr-1"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                  
                  {/* Detay Bilgiler */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Araç Tipi</span>
                      <span className="font-semibold text-slate-800 capitalize">{vehicle.type}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Sürücü</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" /> 
                        {vehicle.driver || partnerName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Aksiyon Butonları - Mobilde iki buton yan yana */}
                  <div className="mt-4 pt-2 flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedVehicleForSettings(vehicle);
                        setShowVehicleEditPage(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 size={14} /> Düzenle
                    </button>
                    <button 
                      onClick={() => setSelectedVehicleForHistory(vehicle)} 
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <History size={14} /> Geçmiş
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Desktop: Add New Card Placeholder */}
            <button 
              onClick={() => setShowAddVehicleModal(true)}
              className="hidden lg:flex bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[300px] gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center"><Plus size={24} /></div>
              <span className="font-bold">Yeni Araç Tanımla</span>
            </button>
          </>
        ) : (
          <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Truck size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-bold text-lg mb-2">Henüz araç eklenmemiş</p>
            <p className="text-xs text-slate-400 mb-6">Filonuza ilk aracınızı ekleyin</p>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 inline-flex items-center gap-2"
            >
              <Plus size={16} /> Yeni Araç Ekle
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB - Floating Action Button */}
      <button
        onClick={() => setShowAddVehicleModal(true)}
        className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Vehicle History Modal */}
      {selectedVehicleForHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicleForHistory(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Araç Geçmişi</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedVehicleForHistory.plate} - Tamamlanan İşler</p>
              </div>
              <button onClick={() => setSelectedVehicleForHistory(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {partnerHistory.slice(0, 5).map((job, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">#{job.id}</h3>
                      <p className="text-sm text-gray-500">{new Date(job.completionTime).toLocaleString('tr-TR')}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      Tamamlandı
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Hizmet</p>
                      <p className="font-bold text-gray-900">{job.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Müşteri</p>
                      <p className="font-bold text-gray-900">{job.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Rota</p>
                      <p className="font-bold text-gray-900">{job.startLocation} {job.endLocation ? `→ ${job.endLocation}` : ''}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Kazanç</p>
                      <p className="font-bold text-green-600">₺{job.partnerEarning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Toplam {partnerHistory.length} iş</strong> bu araçla tamamlandı. Detaylı rapor için "Geçmiş İşler" sekmesini kullanabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerFleetTab;
