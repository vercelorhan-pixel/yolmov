/**
 * ============================================
 * Admin Pricing Config Tab
 * ============================================
 * 
 * Dinamik fiyatlandırma ayarları yönetimi
 * - Baz ücret, KM fiyatları
 * - Çarpanlar (gece, araç tipi, durum)
 * - Cache temizleme
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { PricingConfig } from '../../../types';
import { getPricingConfig, clearPricingCache } from '../../../services/priceCalculator';

export function AdminPricingTab() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getPricingConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load pricing config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Supabase'e kaydet (snake_case mapping)
      const { error } = await (window as any).supabase
        .from('pricing_config')
        .update({
          base_fee: config.baseFee,
          short_distance_limit: config.shortDistanceLimit,
          medium_distance_limit: config.mediumDistanceLimit,
          short_distance_rate: config.shortDistanceRate,
          medium_distance_rate: config.mediumDistanceRate,
          long_distance_rate: config.longDistanceRate,
          night_multiplier: config.nightMultiplier,
          weekend_multiplier: config.weekendMultiplier,
          sedan_multiplier: config.sedanMultiplier,
          suv_multiplier: config.suvMultiplier,
          minibus_multiplier: config.minibusMultiplier,
          luxury_multiplier: config.luxuryMultiplier,
          broken_vehicle_multiplier: config.brokenVehicleMultiplier,
          ditch_multiplier: config.ditchMultiplier,
          accident_multiplier: config.accidentMultiplier,
          has_load_multiplier: config.hasLoadMultiplier,
          urgent_multiplier: config.urgentMultiplier,
          price_flexibility_percent: config.priceFlexibilityPercent,
          updated_by: 'admin', // TODO: Gerçek admin ID
          notes: `Güncelleme: ${new Date().toLocaleString('tr-TR')}`
        })
        .eq('id', config.id);

      if (error) throw error;

      // Cache'i temizle
      clearPricingCache();

      setSaveMessage({ type: 'success', text: '✅ Fiyatlandırma ayarları güncellendi ve cache temizlendi!' });
      setTimeout(() => setSaveMessage(null), 5000);

    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: '❌ Kaydetme hatası. Lütfen tekrar deneyin.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    clearPricingCache();
    setSaveMessage({ type: 'success', text: '🔄 Fiyatlandırma cache temizlendi!' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Fiyatlandırma konfigürasyonu yüklenemedi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Fiyatlandırma Yönetimi
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Dinamik fiyat hesaplama motorunun parametrelerini yönetin
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Cache Temizle
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* Baz Ücretler */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Baz Ücretler ve Mesafe Limitleri
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Açılış Ücreti (₺)
            </label>
            <input
              type="number"
              value={config.baseFee}
              onChange={(e) => setConfig({ ...config, baseFee: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Esneklik Marjı (%)
            </label>
            <input
              type="number"
              value={config.priceFlexibilityPercent}
              onChange={(e) => setConfig({ ...config, priceFlexibilityPercent: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Kısa Mesafe Limiti (KM)
            </label>
            <input
              type="number"
              value={config.shortDistanceLimit}
              onChange={(e) => setConfig({ ...config, shortDistanceLimit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Orta Mesafe Limiti (KM)
            </label>
            <input
              type="number"
              value={config.mediumDistanceLimit}
              onChange={(e) => setConfig({ ...config, mediumDistanceLimit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* KM Başı Ücretler */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">
          📏 KM Başı Ücretler
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Kısa Mesafe (₺/KM)
            </label>
            <input
              type="number"
              value={config.shortDistanceRate}
              onChange={(e) => setConfig({ ...config, shortDistanceRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">0-{config.shortDistanceLimit} KM</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Orta Mesafe (₺/KM)
            </label>
            <input
              type="number"
              value={config.mediumDistanceRate}
              onChange={(e) => setConfig({ ...config, mediumDistanceRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {config.shortDistanceLimit}-{config.mediumDistanceLimit} KM
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Uzun Mesafe (₺/KM)
            </label>
            <input
              type="number"
              value={config.longDistanceRate}
              onChange={(e) => setConfig({ ...config, longDistanceRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">{config.mediumDistanceLimit}+ KM</p>
          </div>
        </div>
      </div>

      {/* Zaman Çarpanları */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">
          ⏰ Zaman Çarpanları
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Gece Hizmeti (22:00-06:00)
            </label>
            <input
              type="number"
              value={config.nightMultiplier}
              onChange={(e) => setConfig({ ...config, nightMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">Mevcut: {((config.nightMultiplier - 1) * 100).toFixed(0)}% zam</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Hafta Sonu (Cumartesi/Pazar)
            </label>
            <input
              type="number"
              value={config.weekendMultiplier}
              onChange={(e) => setConfig({ ...config, weekendMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">Mevcut: {((config.weekendMultiplier - 1) * 100).toFixed(0)}% zam</p>
          </div>
        </div>
      </div>

      {/* Araç Tipi Çarpanları */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">
          🚗 Araç Tipi Çarpanları
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sedan
            </label>
            <input
              type="number"
              value={config.sedanMultiplier}
              onChange={(e) => setConfig({ ...config, sedanMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              SUV/4x4
            </label>
            <input
              type="number"
              value={config.suvMultiplier}
              onChange={(e) => setConfig({ ...config, suvMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.suvMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Minibüs
            </label>
            <input
              type="number"
              value={config.minibusMultiplier}
              onChange={(e) => setConfig({ ...config, minibusMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.minibusMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Lüks Araç
            </label>
            <input
              type="number"
              value={config.luxuryMultiplier}
              onChange={(e) => setConfig({ ...config, luxuryMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.luxuryMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Durum Çarpanları */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">
          ⚠️ Araç Durumu Çarpanları
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Arızalı Araç
            </label>
            <input
              type="number"
              value={config.brokenVehicleMultiplier}
              onChange={(e) => setConfig({ ...config, brokenVehicleMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.brokenVehicleMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Kaza Durumu
            </label>
            <input
              type="number"
              value={config.accidentMultiplier}
              onChange={(e) => setConfig({ ...config, accidentMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.accidentMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Şarampole Düşme
            </label>
            <input
              type="number"
              value={config.ditchMultiplier}
              onChange={(e) => setConfig({ ...config, ditchMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.ditchMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Ek Hizmet Çarpanları */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg text-slate-900 mb-4">
          🔧 Ek Hizmet Çarpanları
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Yük Taşıma
            </label>
            <input
              type="number"
              value={config.hasLoadMultiplier}
              onChange={(e) => setConfig({ ...config, hasLoadMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.hasLoadMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Acil Hizmet (Hemen)
            </label>
            <input
              type="number"
              value={config.urgentMultiplier}
              onChange={(e) => setConfig({ ...config, urgentMultiplier: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              step="0.05"
            />
            <p className="text-xs text-gray-500 mt-1">+{((config.urgentMultiplier - 1) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Bilgi:</strong> Yapılan değişiklikler tüm yeni fiyat hesaplamalarında anında etkili olur.
          Cache temizleme, mevcut önbelleklenmiş fiyatları sıfırlar.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Son Güncelleme: {new Date(config.updatedAt).toLocaleString('tr-TR')}
        </p>
      </div>
    </div>
  );
}

export default AdminPricingTab;
