import React, { useState } from 'react';
import { Briefcase, MapPin, Clock, Users, TrendingUp, Heart, Award, Coffee, Globe, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
}

const CareerPage: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    cv: null as File | null
  });
  const [submitted, setSubmitted] = useState(false);

  const jobs: Job[] = [
    {
      id: '1',
      title: 'Senior React Developer',
      department: 'Yazılım Geliştirme',
      location: 'İstanbul (Hybrid)',
      type: 'Tam Zamanlı',
      experience: '3-5 yıl',
      description: 'React, TypeScript ve modern web teknolojileri konusunda deneyimli, kullanıcı deneyimine önem veren, ekip çalışmasına yatkın bir geliştirici arıyoruz.'
    },
    {
      id: '2',
      title: 'Müşteri Hizmetleri Uzmanı',
      department: 'Müşteri Hizmetleri',
      location: 'İstanbul (Ofis)',
      type: 'Tam Zamanlı',
      experience: '1-3 yıl',
      description: 'Müşteri memnuniyetine odaklı, problem çözme becerisi yüksek, 7/24 vardiya sisteminde çalışabilecek dinamik bir ekip üyesi arıyoruz.'
    },
    {
      id: '3',
      title: 'Partner İlişkileri Yöneticisi',
      department: 'İş Geliştirme',
      location: 'İstanbul',
      type: 'Tam Zamanlı',
      experience: '2-4 yıl',
      description: 'Oto sektörü deneyimi olan, partner ağımızı genişletecek, müzakere ve iletişim becerileri güçlü bir yönetici arıyoruz.'
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      department: 'Altyapı',
      location: 'Remote',
      type: 'Tam Zamanlı',
      experience: '3-6 yıl',
      description: 'AWS, Docker, Kubernetes deneyimi olan, CI/CD süreçlerini optimize edebilecek, güvenlik odaklı bir mühendis arıyoruz.'
    },
    {
      id: '5',
      title: 'UI/UX Designer',
      department: 'Tasarım',
      location: 'İstanbul (Hybrid)',
      type: 'Tam Zamanlı',
      experience: '2-4 yıl',
      description: 'Figma ve kullanıcı araştırması konusunda deneyimli, yaratıcı, kullanıcı odaklı çözümler üretebilen bir tasarımcı arıyoruz.'
    },
    {
      id: '6',
      title: 'Operasyon Koordinatörü',
      department: 'Operasyon',
      location: 'İstanbul',
      type: 'Tam Zamanlı',
      experience: '1-2 yıl',
      description: 'Lojistik süreçleri yönetebilen, detay odaklı, çoklu görevleri organize edebilecek bir koordinatör arıyoruz.'
    }
  ];

  const benefits = [
    { icon: TrendingUp, title: 'Kariyer Gelişimi', desc: 'Sürekli eğitim ve yükselme fırsatları' },
    { icon: Heart, title: 'Özel Sağlık Sigortası', desc: 'Ailen için kapsamlı sağlık paketi' },
    { icon: Award, title: 'Performans Bonusu', desc: 'Başarının ödüllendirildiği sistem' },
    { icon: Coffee, title: 'Esnek Çalışma', desc: 'Hibrit ve remote çalışma imkanı' },
    { icon: Users, title: 'Genç ve Dinamik Ekip', desc: 'İşbirliğine dayalı çalışma ortamı' },
    { icon: Globe, title: 'Global Projeler', desc: 'Uluslararası deneyim kazanma fırsatı' }
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', position: '', cv: null });
      setSelectedJob(null);
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-bold uppercase tracking-wider mb-6">
              Kariyer
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Ekibimize<br />
              <span className="text-brand-orange">Katılın</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Türkiye'nin en hızlı büyüyen yol yardım platformunda kariyer yapın. Birlikte daha güçlüyüz!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Culture Section */}
      <div className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Neden Yolmov?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Yenilikçi teknolojiler, müşteri odaklı yaklaşım ve sürekli gelişim kültürümüzle fark yaratıyoruz.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="text-brand-orange" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Açık Pozisyonlar</h2>
            <p className="text-gray-600">{jobs.length} açık pozisyon seni bekliyor!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:border-brand-orange cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase size={16} />
                      <span>{job.department}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                    {job.type}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{job.experience}</span>
                  </div>
                </div>

                <button className="mt-4 w-full py-2 bg-brand-orange text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                  Başvur
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Form */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedJob.title}</h2>
                <p className="text-sm text-gray-600">{selectedJob.department} • {selectedJob.location}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900 mb-2">Pozisyon Detayları</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedJob.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 bg-white rounded-lg font-medium">📍 {selectedJob.location}</span>
                <span className="px-3 py-1 bg-white rounded-lg font-medium">⏱️ {selectedJob.experience}</span>
              </div>
            </div>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                <p className="text-sm text-green-700 font-medium">Başvurunuz alındı! En kısa sürede size döneceğiz.</p>
              </motion.div>
            )}

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">E-Posta</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  placeholder="ahmet@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  placeholder="0532 XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">CV Yükle (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, cv: e.target.files?.[0] || null })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Başvuruyu Gönder
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-br from-brand-orange to-orange-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Uygun Pozisyon Bulamadınız mı?</h2>
          <p className="text-orange-100 mb-8 text-lg">
            Özgeçmişinizi bize gönderin, uygun bir fırsat çıktığında sizi bilgilendirelim!
          </p>
          <button className="px-8 py-4 bg-white text-brand-orange rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
            Özgeçmiş Gönder
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerPage;
