import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Truck, Calendar, Clock, Navigation, Map, Route, 
  X, ChevronDown, Check, Plus, ArrowRight, Zap, PenTool, 
  Trash2, Save 
} from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  image: string;
}

interface ActiveRoute {
  id: string;
  origin: string;
  destinations: string[];
  date: string;
  time: string;
  vehicle: string;
  matches: number;
}

interface PartnerServiceRoutesTabProps {
  cityList: string[];
  fleet: Vehicle[];
  activeRoutes: ActiveRoute[];
  originSearch: string;
  setOriginSearch: (search: string) => void;
  destSearch: string;
  setDestSearch: (search: string) => void;
  isOriginOpen: boolean;
  setIsOriginOpen: (open: boolean) => void;
  isDestOpen: boolean;
  setIsDestOpen: (open: boolean) => void;
  isVehicleOpen: boolean;
  setIsVehicleOpen: (open: boolean) => void;
  routeOrigin: string;
  setRouteOrigin: (origin: string) => void;
  routeVehicle: string;
  setRouteVehicle: (vehicle: string) => void;
  routeDate: string;
  setRouteDate: (date: string) => void;
  routeTime: string;
  setRouteTime: (time: string) => void;
  routeDestinations: string[];
  editingRouteId: string | null;
  originRef: React.RefObject<HTMLDivElement>;
  destRef: React.RefObject<HTMLDivElement>;
  vehicleRef: React.RefObject<HTMLDivElement>;
  addDestination: (city: string) => void;
  removeDestination: (city: string) => void;
  handleAddRoute: () => void;
  handleEditRoute: (route: ActiveRoute) => void;
  handleRemoveRoute: (routeId: string) => void;
  cancelEdit: () => void;
}

const PartnerServiceRoutesTab: React.FC<PartnerServiceRoutesTabProps> = ({
  cityList,
  fleet,
  activeRoutes,
  originSearch,
  setOriginSearch,
  destSearch,
  setDestSearch,
  isOriginOpen,
  setIsOriginOpen,
  isDestOpen,
  setIsDestOpen,
  isVehicleOpen,
  setIsVehicleOpen,
  routeOrigin,
  setRouteOrigin,
  routeVehicle,
  setRouteVehicle,
  routeDate,
  setRouteDate,
  routeTime,
  setRouteTime,
  routeDestinations,
  editingRouteId,
  originRef,
  destRef,
  vehicleRef,
  addDestination,
  removeDestination,
  handleAddRoute,
  handleEditRoute,
  handleRemoveRoute,
  cancelEdit,
}) => {
  const filteredOriginCities = cityList.filter(c => c.toLowerCase().includes(originSearch.toLowerCase()));
  const filteredDestCities = cityList.filter(c => c.toLowerCase().includes(destSearch.toLowerCase()));
  const selectedVehicleData = fleet.find(v => v.plate === routeVehicle);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-slate-900/20">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">{editingRouteId ? 'Rotayı Düzenle' : 'Boş Dönüş & Hizmet Rotaları'}</h2>
          <p className="text-slate-100 max-w-xl text-sm mb-6">
            {editingRouteId 
              ? 'Mevcut rotadaki bilgileri güncelleyin.' 
              : 'Dönüş yolunda veya belirli tarihlerde gideceğiniz güzergahları ekleyin, o rotadaki iş fırsatlarını size öncelikli olarak ve indirimli sunalım.'}
          </p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Origin Autocomplete */}
            <div className="space-y-1 relative" ref={originRef as React.RefObject<HTMLDivElement>}>
              <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                <MapPin size={10} /> Kalkış (Nereden)
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm transition-all placeholder-slate-400 font-medium"
                  placeholder="Şehir Ara..."
                  value={originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    if (!isOriginOpen) setIsOriginOpen(true);
                  }}
                  onFocus={() => setIsOriginOpen(true)}
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                {originSearch && (
                  <button onClick={() => { setOriginSearch(''); setRouteOrigin(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 bg-white/50 rounded-full transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <AnimatePresence>
                {isOriginOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                  >
                    {filteredOriginCities.length > 0 ? filteredOriginCities.map(city => (
                      <button 
                        key={city}
                        onClick={() => {
                          setRouteOrigin(city);
                          setOriginSearch(city);
                          setIsOriginOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2"
                      >
                        <MapPin size={14} className="text-slate-300" />
                        {city}
                      </button>
                    )) : (
                      <div className="p-4 text-center text-xs text-slate-400">Şehir bulunamadı.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vehicle Selector (Custom) */}
            <div className="space-y-1 relative" ref={vehicleRef as React.RefObject<HTMLDivElement>}>
              <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                <Truck size={10} /> Araç Seçimi
              </label>
              <button 
                onClick={() => setIsVehicleOpen(!isVehicleOpen)}
                className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-400 outline-none flex items-center justify-between shadow-sm transition-all h-[46px]"
              >
                {selectedVehicleData ? (
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={selectedVehicleData.image} alt="v" className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200" />
                    <div className="flex flex-col items-start leading-none">
                      <span className="truncate font-bold text-xs">{selectedVehicleData.plate}</span>
                      <span className="text-[10px] text-slate-500">{selectedVehicleData.model}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">Araç Seçiniz</span>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isVehicleOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isVehicleOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    {fleet.map(v => (
                      <button 
                        key={v.id}
                        onClick={() => {
                          setRouteVehicle(v.plate);
                          setIsVehicleOpen(false);
                        }}
                        className={`w-full text-left p-2.5 flex items-center gap-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors ${routeVehicle === v.plate ? 'bg-blue-50' : ''}`}
                      >
                        <img src={v.image} alt={v.plate} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-100" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{v.plate}</p>
                          <p className="text-xs text-slate-500">{v.model}</p>
                        </div>
                        {routeVehicle === v.plate && <Check size={16} className="ml-auto text-blue-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date & Time */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                <Calendar size={10} /> Tarih & Saat
              </label>
              <input 
                type="datetime-local" 
                className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm transition-all font-medium h-[46px]"
                value={routeDate && routeTime ? `${routeDate}T${routeTime}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if(val) {
                    setRouteDate(val.split('T')[0]);
                    setRouteTime(val.split('T')[1]);
                  }
                }}
              />
            </div>

            {/* Destinations Autocomplete */}
            <div className="space-y-1 md:col-span-4 relative" ref={destRef as React.RefObject<HTMLDivElement>}>
              <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                <Navigation size={10} /> Güzergah / Varışlar (Nereye)
              </label>
              <div className="flex gap-2 relative group">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Şehir ekle..." 
                    className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-400 outline-none placeholder-slate-400 shadow-sm transition-all font-medium"
                    value={destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      if (!isDestOpen) setIsDestOpen(true);
                    }}
                    onFocus={() => setIsDestOpen(true)}
                  />
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                  <AnimatePresence>
                    {isDestOpen && destSearch && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                      >
                        {filteredDestCities.length > 0 ? filteredDestCities.map(city => (
                          <button 
                            key={city}
                            onClick={() => addDestination(city)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                          >
                            <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-300" /> {city}</span>
                            <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />
                          </button>
                        )) : (
                          <div className="p-4 text-center text-xs text-slate-400">Şehir bulunamadı.</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {routeDestinations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {routeDestinations.map(d => (
                    <span key={d} className="bg-blue-800/50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 border border-blue-400/30 shadow-sm backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                      {d} <button onClick={() => removeDestination(d)} className="hover:text-red-300 transition-colors bg-black/10 rounded-full p-0.5"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="md:col-span-4 flex justify-end pt-4 gap-3 border-t border-white/10 mt-2">
              {editingRouteId && (
                <button onClick={cancelEdit} className="bg-white/10 border border-white/30 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
                  İptal
                </button>
              )}
              <button onClick={handleAddRoute} className="bg-white text-blue-700 px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 shadow-lg transition-all transform active:scale-95 flex items-center gap-2">
                <Save size={18} /> {editingRouteId ? 'Değişiklikleri Kaydet' : 'Rotayı Kaydet'}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Map size={300} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg ml-1 flex items-center gap-2">
          <Route size={20} className="text-blue-600" /> Aktif Rotalarım
        </h3>
        {activeRoutes.length > 0 ? (
          activeRoutes.map(route => (
            <div key={route.id} className={`bg-white rounded-2xl border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-all group hover:shadow-md ${editingRouteId === route.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Route size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 text-lg">{route.origin}</h4>
                    <ArrowRight size={16} className="text-slate-300" />
                    <div className="flex flex-wrap gap-1">
                      {route.destinations.map((d: string, i: number) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-sm font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Calendar size={12} className="text-slate-400" /> {route.date}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Clock size={12} className="text-slate-400" /> {route.time}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Truck size={12} className="text-slate-400" /> {route.vehicle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-50 pt-3 md:pt-0 mt-1 md:mt-0">
                {route.matches > 0 && (
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <Zap size={14} fill="currentColor" /> {route.matches} İş Eşleşti
                  </div>
                )}
                <div className="flex ml-auto md:ml-0 gap-2">
                  <button onClick={() => handleEditRoute(route)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                    <PenTool size={18} />
                  </button>
                  <button onClick={() => handleRemoveRoute(route.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route size={32} className="opacity-50" />
            </div>
            <p className="font-medium text-slate-500">Henüz kayıtlı rota bulunmuyor.</p>
            <p className="text-xs mt-1 text-slate-400">Yeni rota ekleyerek iş fırsatlarını yakalayın.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerServiceRoutesTab;
