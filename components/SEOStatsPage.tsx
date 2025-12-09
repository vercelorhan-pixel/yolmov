/**
 * SEO Test & Stats Page
 * Oluşturulan SEO sayfalarının istatistiklerini gösterir
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Globe, ExternalLink } from 'lucide-react';
import { getSEOStats, getAllCities, generateAllSEOPages } from '../lib/seoData';

const SEOStatsPage: React.FC = () => {
  const [stats, setStats] = useState<ReturnType<typeof getSEOStats> | null>(null);
  const [samplePages, setSamplePages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // İstatistikleri al
    const statsData = getSEOStats();
    setStats(statsData);

    // Örnek sayfalar - rastgele 50 tane
    const allPages = generateAllSEOPages();
    const randomPages = [];
    for (let i = 0; i < Math.min(50, allPages.length); i++) {
      const randomIndex = Math.floor(Math.random() * allPages.length);
      randomPages.push(allPages[randomIndex]);
    }
    setSamplePages(randomPages);
    setLoading(false);

    // SEO
    document.title = 'SEO İstatistikleri | Yolmov';
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
            🚀 Programmatic SEO İstatistikleri
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Yolmov, Türkiye'nin tüm il ve ilçeleri için otomatik SEO sayfaları oluşturur. 
            Bu sayede her bölgeye özel optimizasyon sağlanır.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Toplam İl</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Toplam İlçe</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalDistricts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Hizmet Türü</p>
                <p className="text-2xl font-bold text-slate-900">{stats.servicesPerDistrict}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ExternalLink className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Toplam Sayfa</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalPages.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <div className="bg-gradient-to-br from-brand-orange to-brand-lightOrange text-white rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">📊 Bu Ne Demek?</h2>
          <div className="space-y-3">
            <p className="text-orange-50">
              ✅ <strong>{stats.totalPages.toLocaleString('tr-TR')} farklı URL</strong> Google'da indekslenecek
            </p>
            <p className="text-orange-50">
              ✅ Her ilçe için <strong>5 farklı hizmet</strong> (Çekici, Akü, Lastik, Yakıt, Anahtar)
            </p>
            <p className="text-orange-50">
              ✅ Her sayfa <strong>özel başlık, açıklama ve meta etiketleri</strong> ile optimize
            </p>
            <p className="text-orange-50">
              ✅ Tahmini indeksleme süresi: <strong>{stats.estimatedIndexingTime}</strong>
            </p>
          </div>
        </div>

        {/* Örnek Sayfalar */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            🔗 Rastgele Örnek Sayfalar (50 adet)
          </h2>
          <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {samplePages.map((page, index) => (
              <Link
                key={index}
                to={page.url}
                className="flex items-center justify-between p-3 hover:bg-orange-50 rounded-lg border border-slate-100 hover:border-brand-orange transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-orange">
                    {page.title.split('|')[0].trim()}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {page.url}
                  </p>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-brand-orange ml-2" />
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-block px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-lightOrange transition-all shadow-lg"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SEOStatsPage;
