/**
 * Admin Review Detail Page
 * Değerlendirme görüntüleme, düzenleme ve gizleme sayfası
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsDown, AlertTriangle, Eye, CheckCircle, XCircle, User, Calendar, Edit2, EyeOff } from 'lucide-react';

interface Review {
  id: string;
  jobId: string;
  partnerId: string;
  partnerName: string;
  customerName: string;
  service: string;
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  tags: string[];
  hidden?: boolean;
  objection?: {
    reason: string;
    details: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    resolvedBy?: string;
    resolvedAt?: string;
  };
}

// MOCK DATA
const MOCK_REVIEWS: Review[] = [
  {
    id: 'REV-001',
    jobId: 'JOB-4923',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    customerName: 'Ahmet Yılmaz',
    service: 'Çekici Hizmeti',
    date: '2024-11-22 15:30',
    rating: 5,
    comment: 'Çok hızlı geldi, işini profesyonelce yaptı. Teşekkürler!',
    tags: ['Kibar Müşteri', 'Sorunsuz Ödeme', 'Bahşiş Bıraktı'],
  },
  {
    id: 'REV-002',
    jobId: 'JOB-4920',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    customerName: 'Mehmet K.',
    service: 'Akü Takviyesi',
    date: '2024-11-19 10:15',
    rating: 2,
    comment: 'Geç geldi, müşteri hizmetleri vasat.',
    tags: ['Geç Geldi', 'İletişim Zor'],
    objection: {
      reason: 'Haksız değerlendirme',
      details: 'Trafikte kaza oldu, bu yüzden geç kaldım. Müşteriye bilgi verdim ama yine de kötü puan verdi.',
      submittedAt: '2024-11-19 16:00',
      status: 'pending',
    },
  },
];

const AdminReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<Review | null>(
    MOCK_REVIEWS.find(r => r.id === id) || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(review?.comment || '');
  const [editedRating, setEditedRating] = useState(review?.rating || 5);

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Değerlendirme Bulunamadı</h2>
          <button onClick={() => navigate('/admin')} className="text-blue-600 font-bold hover:underline">
            Admin panele dön
          </button>
        </div>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating === 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleSaveEdit = () => {
    setReview({ ...review, comment: editedComment, rating: editedRating });
    setIsEditing(false);
  };

  const handleToggleHidden = () => {
    setReview({ ...review, hidden: !review.hidden });
  };

  const handleObjectionResolve = (status: 'approved' | 'rejected') => {
    if (!review.objection) return;
    setReview({
      ...review,
      objection: {
        ...review.objection,
        status,
        resolvedBy: 'Admin User',
        resolvedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-3 bg-white rounded-xl hover:bg-slate-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Değerlendirme Detayları</h1>
            <p className="text-slate-500">{review.id}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Düzenle
                </button>
                <button
                  onClick={handleToggleHidden}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
                    review.hidden
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {review.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  {review.hidden ? 'Göster' : 'Gizle'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Kaydet
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hidden Badge */}
        {review.hidden && (
          <div className="bg-orange-100 border border-orange-300 rounded-xl p-4 mb-6 flex items-center gap-3">
            <EyeOff size={20} className="text-orange-600" />
            <p className="text-orange-900 font-bold">Bu değerlendirme gizlenmiş durumda</p>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Temel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Partner</p>
                <p className="font-bold text-slate-900">{review.partnerName}</p>
                <p className="text-xs text-slate-500">{review.partnerId}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                <p className="font-bold text-slate-900">{review.customerName}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Hizmet</p>
                <p className="font-bold text-slate-900">{review.service}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Tarih & İş ID</p>
                <p className="font-bold text-slate-900">{review.date}</p>
                <p className="text-xs text-slate-500">{review.jobId}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Puan</h3>
            {isEditing ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setEditedRating(rating as 1 | 2 | 3 | 4 | 5)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      size={32}
                      className={rating <= editedRating ? getRatingColor(editedRating) : 'text-slate-300'}
                      fill={rating <= editedRating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-2xl font-bold text-slate-900">{editedRating}/5</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={32}
                    className={i < review.rating ? getRatingColor(review.rating) : 'text-slate-300'}
                    fill={i < review.rating ? 'currentColor' : 'none'}
                  />
                ))}
                <span className="ml-2 text-2xl font-bold text-slate-900">{review.rating}/5</span>
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Yorum</h3>
            {isEditing ? (
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
              />
            ) : (
              <p className="text-slate-900">{review.comment}</p>
            )}
          </div>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Etiketler</h3>
              <div className="flex flex-wrap gap-2">
                {review.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Objection */}
          {review.objection && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-orange-600" />
                <h3 className="text-xl font-bold text-slate-900">İtiraz</h3>
                <span
                  className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
                    review.objection.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : review.objection.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {review.objection.status === 'pending'
                    ? 'Beklemede'
                    : review.objection.status === 'approved'
                    ? 'Onaylandı'
                    : 'Reddedildi'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">İtiraz Sebebi</p>
                  <p className="font-bold text-slate-900">{review.objection.reason}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Detaylar</p>
                  <p className="text-slate-900">{review.objection.details}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Gönderilme Tarihi</p>
                  <p className="font-bold text-slate-900">{review.objection.submittedAt}</p>
                </div>

                {review.objection.status === 'pending' && (
                  <div className="flex gap-3 pt-3">
                    <button
                      onClick={() => handleObjectionResolve('approved')}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      İtirazı Onayla
                    </button>
                    <button
                      onClick={() => handleObjectionResolve('rejected')}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} />
                      İtirazı Reddet
                    </button>
                  </div>
                )}

                {review.objection.resolvedBy && (
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-xs text-blue-600 mb-1">Çözümleyen</p>
                    <p className="font-bold text-blue-900">{review.objection.resolvedBy}</p>
                    <p className="text-xs text-blue-600 mt-1">{review.objection.resolvedAt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewDetailPage;
