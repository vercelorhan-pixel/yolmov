import React, { useState } from 'react';
import { 
  ChevronDown, FileText, Info, Send, Headphones, X, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallSupportButton } from '../voice';

// Ticket Type
interface Ticket {
  id: string;
  subject: string;
  date: string;
  status: 'open' | 'closed';
  category?: string;
  description?: string;
}

// Props Interface
export interface PartnerSupportTabProps {
  tickets: Ticket[];
  partnerId: string;
  partnerName: string;
  
  // New Ticket Page State
  showNewTicketPage: boolean;
  setShowNewTicketPage: (show: boolean) => void;
  ticketSubject: string;
  setTicketSubject: (subject: string) => void;
  ticketCategory: string;
  setTicketCategory: (category: string) => void;
  ticketDescription: string;
  setTicketDescription: (description: string) => void;
}

const PartnerSupportTab: React.FC<PartnerSupportTabProps> = ({
  tickets,
  partnerId,
  partnerName,
  showNewTicketPage,
  setShowNewTicketPage,
  ticketSubject,
  setTicketSubject,
  ticketCategory,
  setTicketCategory,
  ticketDescription,
  setTicketDescription,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Yeni talep oluşturma sayfası
  if (showNewTicketPage) {
    return (
      <div className="p-4 md:p-6 h-full">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <button
              onClick={() => {
                setShowNewTicketPage(false);
                setTicketSubject('');
                setTicketCategory('');
                setTicketDescription('');
              }}
              className="mb-4 text-sm flex items-center gap-2 hover:text-blue-100 transition-colors"
            >
              <ChevronDown size={16} className="rotate-90" /> Geri Dön
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Yeni Destek Talebi</h2>
                <p className="text-sm text-blue-100">Sorununuzu detaylı olarak açıklayın</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori *</label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Seçiniz...</option>
                <option value="technical">Teknik Sorun</option>
                <option value="customer_complaint">Müşteri Şikayeti</option>
                <option value="account">Hesap İşlemleri</option>
                <option value="document">Belge & Onay</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Konu *</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Örn: Uygulamada teknik bir sorun yaşıyorum"
                maxLength={100}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">{ticketSubject.length}/100 karakter</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Açıklama *</label>
              <textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Sorununuzu detaylı olarak açıklayın. Gerekirse iş numarası, tarih gibi bilgileri ekleyin."
                rows={8}
                maxLength={1000}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">{ticketDescription.length}/1000 karakter</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">Destek Süresi</p>
                <p className="text-xs text-blue-700">
                  Talepler genellikle 2-4 iş saati içinde yanıtlanır.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowNewTicketPage(false);
                  setTicketSubject('');
                  setTicketCategory('');
                  setTicketDescription('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (!ticketCategory || !ticketSubject.trim() || !ticketDescription.trim()) {
                    alert('Lütfen tüm zorunlu alanları doldurun.');
                    return;
                  }
                  // Destek talebi console'a logla (API bağlantısı sonrası eklenecek)
                  console.log('Destek Talebi:', {
                    partnerId: partnerId,
                    partnerName: partnerName,
                    category: ticketCategory,
                    subject: ticketSubject,
                    description: ticketDescription
                  });
                  setShowNewTicketPage(false);
                  setTicketSubject('');
                  setTicketCategory('');
                  setTicketDescription('');
                  alert('Destek talebiniz başarıyla oluşturuldu.');
                }}
                disabled={!ticketCategory || !ticketSubject.trim() || !ticketDescription.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> Talep Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTicketDetailModal = () => {
    if (!selectedTicket) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Destek Talebi Detayı</h2>
                <p className="text-sm text-white/80">Talep No: #{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p><span className="font-bold">Konu:</span> {selectedTicket.subject}</p>
            <p><span className="font-bold">Tarih:</span> {selectedTicket.date}</p>
            <p><span className="font-bold">Durum:</span> {selectedTicket.status}</p>
            <p className="mt-4 pt-4 border-t border-slate-200"><span className="font-bold">Detaylar:</span></p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
          </div>
        </motion.div>
      </div>
    );
  };

  // Ana destek sayfası
  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Phone size={24} /></div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Sesli Destek</h3>
          <p className="text-slate-500 text-sm mb-6">Operasyonel sorunlar için 7/24 temsilcilerimizle görüşün.</p>
          <CallSupportButton 
            variant="primary"
            size="md"
            queueSlug="partner-calls"
            sourceType="partner-direct"
            sourcePage="/partner/support"
            label="Destek Hattını Ara"
            className="w-full"
          />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Talep Oluştur</h3>
          <p className="text-slate-500 text-sm mb-6">Finansal konular veya şikayetler için bilet oluşturun.</p>
          <button
            onClick={() => setShowNewTicketPage(true)}
            className="w-full py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            Yeni Bilet Aç
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">Geçmiş Taleplerim</h3>
        <div className="space-y-2">
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{ticket.subject} <span className="text-slate-400 font-normal">#{ticket.id}</span></p>
                    <p className="text-xs text-slate-500">{ticket.date}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {ticket.status === 'open' ? 'Açık' : 'Çözüldü'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Headphones size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Henüz destek talebi yok</p>
              <p className="text-xs text-slate-400 mt-2">Sorularınız veya sorunlarınız için yukarıdan talep oluşturabilirsiniz</p>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {selectedTicket && renderTicketDetailModal()}
      </AnimatePresence>
    </div>
  );
};

export default PartnerSupportTab;
