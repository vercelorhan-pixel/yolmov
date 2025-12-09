import React from 'react';
import { 
  ChevronDown, Star, ShieldAlert, Info, Send, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Rating Tags
const POSITIVE_RATING_TAGS = [
  'Kibar Müşteri', 'Sorunsuz Ödeme', 'Bahşiş Bıraktı', 'Konum Doğruydu', 'Anlayışlı', 'İletişim Kolaydı'
];

// Review type
interface Review {
  id: string;
  jobId: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  customerName: string;
  customerPhone: string;
  tags: string[];
}

// Props Interface
export interface PartnerReviewsTabProps {
  reviews: Review[];
  ratingFilter: number | null;
  setRatingFilter: (filter: number | null) => void;
  
  // Objection State
  showObjectionPage: boolean;
  setShowObjectionPage: (show: boolean) => void;
  selectedReviewForObjection: Review | null;
  setSelectedReviewForObjection: (review: Review | null) => void;
  objectionReason: string;
  setObjectionReason: (reason: string) => void;
  objectionDetails: string;
  setObjectionDetails: (details: string) => void;
  
  // Handlers
  handleSubmitObjection: () => void;
  handleOpenObjection: (review: Review) => void;
}

const PartnerReviewsTab: React.FC<PartnerReviewsTabProps> = ({
  reviews,
  ratingFilter,
  setRatingFilter,
  showObjectionPage,
  setShowObjectionPage,
  selectedReviewForObjection,
  setSelectedReviewForObjection,
  objectionReason,
  setObjectionReason,
  objectionDetails,
  setObjectionDetails,
  handleSubmitObjection,
  handleOpenObjection,
}) => {
  // İtiraz Et Tam Sayfa
  if (showObjectionPage && selectedReviewForObjection) {
    return (
      <div className="p-4 md:p-6 h-full">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <button
              onClick={() => {
                setShowObjectionPage(false);
                setSelectedReviewForObjection(null);
                setObjectionReason('');
                setObjectionDetails('');
              }}
              className="mb-4 text-sm flex items-center gap-2 hover:text-red-100 transition-colors"
            >
              <ChevronDown size={16} className="rotate-90" /> Geri Dön
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Değerlendirmeye İtiraz</h2>
                <p className="text-sm text-red-100">İş No: #{selectedReviewForObjection.jobId}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Review Info */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  ?
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                    <h3 className="font-bold text-slate-900 text-lg">Müşteri ***</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={18} 
                          fill={i < selectedReviewForObjection.rating ? "#ef4444" : "none"} 
                          className={i < selectedReviewForObjection.rating ? "text-red-500" : "text-slate-300"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3 leading-relaxed bg-white p-3 rounded-lg">
                    "{selectedReviewForObjection.comment}"
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-500">{selectedReviewForObjection.date}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">{selectedReviewForObjection.service}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Objection Reason */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">İtiraz Nedeni *</label>
              <select
                value={objectionReason}
                onChange={(e) => setObjectionReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              >
                <option value="">Seçiniz...</option>
                <option value="wrong_job">Yanlış İş Kaydı</option>
                <option value="false_claim">Haksız İddia</option>
                <option value="customer_mistake">Müşteri Hatası</option>
                <option value="technical_issue">Teknik Sorun</option>
                <option value="unfair_rating">Adaletsiz Puanlama</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {/* Objection Details */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Açıklama & Kanıtlar *</label>
              <textarea
                value={objectionDetails}
                onChange={(e) => setObjectionDetails(e.target.value)}
                placeholder="İtirazınızı detaylı olarak açıklayın. Varsa fotoğraf, mesaj ekran görüntüsü gibi kanıtlarınızı açıklayın."
                rows={10}
                maxLength={500}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">{objectionDetails.length}/500 karakter</p>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 flex items-start gap-3">
              <Info size={22} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900 mb-2">⚠️ Önemli Bilgilendirme</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  İtirazınız ekibimiz tarafından <strong>3 iş günü içinde</strong> incelenecektir. İtiraz haklı bulunursa değerlendirme ortalamanızdan çıkarılır. Ancak haksız itirazlar hesabınıza uyarı olarak işlenir.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowObjectionPage(false);
                  setSelectedReviewForObjection(null);
                  setObjectionReason('');
                  setObjectionDetails('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleSubmitObjection}
                disabled={!objectionReason || !objectionDetails.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> İtiraz Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ana değerlendirmeler sayfası
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  
  // Filtrelenmiş reviews
  const filteredReviews = ratingFilter 
    ? reviews.filter(r => {
        if (ratingFilter === 2) return r.rating <= 2;
        return r.rating === ratingFilter;
      })
    : reviews;
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Müşteri Değerlendirmeleri</h2>
          <p className="text-sm text-slate-500">Aldığınız puanlar ve yorumlar</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Star size={24} fill="currentColor" className="text-yellow-400" />
            <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
          </div>
          <p className="text-xs text-slate-300">{reviews.length} Değerlendirme</p>
        </div>
      </div>

      {/* Stats - Tıklanabilir Filtreler */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setRatingFilter(null)}
          className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
            ratingFilter === null ? 'border-slate-400 shadow-md' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#64748b" className="text-slate-500" />
            <span className="text-xs font-bold text-slate-500">Tümü</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
        </button>
        <button
          onClick={() => setRatingFilter(5)}
          className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
            ratingFilter === 5 ? 'border-green-400 shadow-md' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#22c55e" className="text-green-500" />
            <span className="text-xs font-bold text-slate-500">5 Yıldız</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 5).length}</p>
        </button>
        <button
          onClick={() => setRatingFilter(4)}
          className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
            ratingFilter === 4 ? 'border-blue-400 shadow-md' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#3b82f6" className="text-blue-500" />
            <span className="text-xs font-bold text-slate-500">4 Yıldız</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 4).length}</p>
        </button>
        <button
          onClick={() => setRatingFilter(3)}
          className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
            ratingFilter === 3 ? 'border-amber-400 shadow-md' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#f59e0b" className="text-amber-500" />
            <span className="text-xs font-bold text-slate-500">3 Yıldız</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 3).length}</p>
        </button>
        <button
          onClick={() => setRatingFilter(2)}
          className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
            ratingFilter === 2 ? 'border-red-400 shadow-md' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} fill="#ef4444" className="text-red-500" />
            <span className="text-xs font-bold text-slate-500">≤2 Yıldız</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating <= 2).length}</p>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => {
          const isLowRating = review.rating < 3;
          const displayName = isLowRating ? 'Müşteri ***' : review.customerName;
          const displayPhone = isLowRating ? '**********' : review.customerPhone;
          
          return (
            <motion.div 
              key={review.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl border-2 p-4 md:p-6 transition-all hover:shadow-md ${
                isLowRating ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              {/* Desktop Layout */}
              <div className="hidden md:flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                    isLowRating ? 'bg-red-500' : 'bg-slate-700'
                  }`}>
                    {isLowRating ? '?' : review.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{displayName}</h3>
                    <p className="text-xs text-slate-500">{review.date} • {review.service}</p>
                    {isLowRating ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <ShieldAlert size={12} />
                        Bilgiler gizlendi
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">{displayPhone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      fill={i < review.rating ? "#FFA500" : "none"} 
                      className={i < review.rating ? "text-orange-500" : "text-slate-300"}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile Layout - Avatar üstte */}
              <div className="md:hidden flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0 ${
                  isLowRating ? 'bg-red-500' : 'bg-slate-700'
                }`}>
                  {isLowRating ? '?' : review.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{review.date} • {review.service}</p>
                  {isLowRating && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <ShieldAlert size={12} />
                      Bilgiler gizlendi
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-700 mb-4 leading-relaxed">{review.comment}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {review.tags.map((tag: string, idx: number) => (
                  <span 
                    key={idx} 
                    className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      POSITIVE_RATING_TAGS.includes(tag)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Mobile - İsim, telefon ve yıldızlar alt kısımda */}
              <div className="md:hidden space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{displayName}</h3>
                    {!isLowRating && (
                      <p className="text-xs text-slate-400 mt-0.5">{displayPhone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? "#FFA500" : "none"} 
                        className={i < review.rating ? "text-orange-500" : "text-slate-300"}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* İş No ve İtiraz Et butonu */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 md:border-t-0 md:pt-0 mt-4 md:mt-0">
                <span className="text-xs text-slate-400 font-mono">İş No: #{review.jobId}</span>
                {isLowRating && (
                  <button 
                    onClick={() => handleOpenObjection(review)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <HelpCircle size={14} /> İtiraz Et
                  </button>
                )}
              </div>
            </motion.div>
          );
        })
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <Star size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-bold text-lg mb-2">Henüz değerlendirme yok</p>
            <p className="text-xs text-slate-400">Tamamladığınız işlerden sonra müşteri değerlendirmeleri burada görünecek</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-bold mb-2">📋 Düşük Puanlı Değerlendirmeler Hakkında</p>
            <p className="leading-relaxed">3 yıldız ve altı puan alan işlerde müşteri bilgileri (isim ve telefon) gizlenir. Bu puanlar ortalamanıza dahildir ancak iletişim bilgilerine erişiminiz kısıtlanır. Bu, her iki tarafın da güvenliği için alınan bir önlemdir.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerReviewsTab;
