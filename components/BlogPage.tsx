import React, { useState } from 'react';
import { Search, Calendar, User, Tag, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  tags: string[];
}

const BlogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const categories = ['Tümü', 'Yol Yardım', 'Araç Bakımı', 'Sürüş İpuçları', 'Teknoloji', 'Haberler'];

  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'Kış Lastiği Ne Zaman Takılmalı?',
      excerpt: 'Kış aylarında güvenli sürüş için kış lastiği kullanımının önemi ve doğru zamanlama rehberi.',
      content: 'Kış lastiği kullanımı, soğuk havalarda araç güvenliğini artıran en önemli faktörlerden biridir. Kış lastiği, 7°C altındaki sıcaklıklarda yaz lastiklerinden çok daha iyi performans gösterir. Türkiye\'de kış lastiği kullanımı 1 Aralık - 1 Nisan tarihleri arasında zorunludur. Ancak hava sıcaklığının düzenli olarak 7°C\'nin altına düşmeye başladığı dönemlerde erken geçiş yapmak daha güvenlidir.',
      author: 'Ahmet Kaya',
      date: '2024-01-15',
      category: 'Araç Bakımı',
      readTime: '5 dk',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      tags: ['Kış Lastiği', 'Güvenlik', 'Bakım']
    },
    {
      id: '2',
      title: 'Yolda Kalmanın En Yaygın 7 Nedeni',
      excerpt: 'Araç sahiplerinin en çok karşılaştığı arıza türleri ve bu durumlardan nasıl kaçınılacağı.',
      content: 'Yolda kalma durumları genellikle önceden görülebilir ve önlenebilir sorunlardan kaynaklanır. En yaygın nedenler: 1) Boş akü, 2) Lastik patlaması, 3) Motor ısınması, 4) Yakıt bitmesi, 5) Fren arızaları, 6) Elektrik sistemleri, 7) Transmisyon sorunları. Düzenli bakım ve kontroller ile bu sorunların çoğu önlenebilir.',
      author: 'Mehmet Yılmaz',
      date: '2024-01-10',
      category: 'Yol Yardım',
      readTime: '7 dk',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
      tags: ['Arıza', 'Bakım', 'Güvenlik']
    },
    {
      id: '3',
      title: 'Akıllı Telefonunuz ile Araç Bakımı',
      excerpt: 'Modern teknoloji sayesinde araç bakımınızı kolaylaştıracak en iyi mobil uygulamalar.',
      content: 'Günümüzde akıllı telefonlar, araç bakımını takip etmek için mükemmel araçlardır. Bakım hatırlatıcıları, yakıt tüketimi takibi, lastik basıncı uyarıları gibi özellikler sunan uygulamalar, araç sahiplerinin işini oldukça kolaylaştırıyor. Yolmov uygulaması da bu özelliklerle birlikte acil yol yardım talebini tek tuşla oluşturmanızı sağlıyor.',
      author: 'Ayşe Demir',
      date: '2024-01-05',
      category: 'Teknoloji',
      readTime: '4 dk',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      tags: ['Teknoloji', 'Uygulama', 'Bakım']
    },
    {
      id: '4',
      title: 'Ekonomik Sürüş Teknikleri',
      excerpt: 'Yakıt tasarrufu sağlayan sürüş teknikleri ve alışkanlıkları hakkında bilmeniz gerekenler.',
      content: 'Ekonomik sürüş, hem çevreye duyarlı hem de cebinize dost bir yaklaşımdır. Yumuşak hızlanma ve fren yapma, sabit hız koruma, gereksiz yük taşımama, düzenli bakım gibi basit önlemlerle %30\'a kadar yakıt tasarrufu sağlanabilir. Ayrıca lastik basıncını doğru tutmak ve klima kullanımını optimize etmek de önemlidir.',
      author: 'Can Öztürk',
      date: '2023-12-28',
      category: 'Sürüş İpuçları',
      readTime: '6 dk',
      image: 'https://images.unsplash.com/photo-1449130015084-2d48d6f270b6?w=800',
      tags: ['Ekonomi', 'Sürüş', 'Yakıt']
    },
    {
      id: '5',
      title: 'Yolmov Partner Ağı Büyüyor',
      excerpt: 'Türkiye genelinde 500+ partnerle yol yardım hizmetinde yeni dönem başlıyor.',
      content: 'Yolmov olarak partner ağımızı genişletmeye devam ediyoruz. 81 ilde 500\'den fazla anlaşmalı çekici ve yol yardım firması ile 7/24 kesintisiz hizmet sunuyoruz. Yeni teknolojimiz sayesinde size en yakın partner 15 dakika içinde ulaşabiliyor. Sektörde bir ilk olan fiyat şeffaflığımız ve müşteri memnuniyeti odaklı yaklaşımımızla fark yaratıyoruz.',
      author: 'Yolmov Ekibi',
      date: '2023-12-20',
      category: 'Haberler',
      readTime: '3 dk',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      tags: ['Yolmov', 'Partner', 'Haber']
    },
    {
      id: '6',
      title: 'Uzun Yol Öncesi Araç Kontrolü',
      excerpt: 'Tatil yolculuğuna çıkmadan önce mutlaka kontrol edilmesi gereken 10 madde.',
      content: 'Uzun yol yolculuklarına çıkmadan önce aracınızı kontrol etmek, yolda kalma riskini minimize eder. Kontrol listesi: 1) Motor yağı seviyesi, 2) Soğutma suyu, 3) Fren hidroliği, 4) Lastik basınçları ve desen derinliği, 5) Fren diskleri, 6) Akü durumu, 7) Işıklar ve farlar, 8) Silecek lastikleri, 9) Klima gazı, 10) Yedek lastik ve takım. Bu basit kontroller hayat kurtarabilir.',
      author: 'Zeynep Arslan',
      date: '2023-12-15',
      category: 'Sürüş İpuçları',
      readTime: '8 dk',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
      tags: ['Kontrol', 'Bakım', 'Yolculuk']
    }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'Tümü' ? 'all' : category);
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
              Blog
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Yolmov<br />
              <span className="text-brand-orange">Blog</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Araç bakımı, sürüş ipuçları ve yol yardım dünyasından haberler
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Blog yazılarında ara..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  (category === 'Tümü' && selectedCategory === 'all') || category === selectedCategory
                    ? 'bg-brand-orange text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6 text-gray-600">
            {filteredPosts.length} yazı bulundu
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedPost(post)}
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-lg">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{new Date(post.date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-brand-orange transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sonuç bulunamadı</h3>
              <p className="text-gray-600">Farklı bir arama terimi veya kategori deneyin</p>
            </div>
          )}
        </div>
      </div>

      {/* Blog Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-64 md:h-96 bg-gray-200">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="px-4 py-2 bg-brand-orange text-white text-sm font-bold rounded-xl">
                    {selectedPost.category}
                  </span>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{new Date(selectedPost.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{selectedPost.author}</span>
                  </div>
                  <span>• {selectedPost.readTime}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{selectedPost.title}</h1>

                <div className="prose prose-lg max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedPost.content}</p>
                </div>

                <div className="flex items-center gap-2 mb-8">
                  <Tag size={16} className="text-gray-400" />
                  {selectedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedPost.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{selectedPost.author}</div>
                        <div className="text-sm text-gray-500">Yazar</div>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl font-medium hover:bg-orange-600 transition-colors">
                      Diğer Yazıları
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-br from-brand-orange to-orange-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Yeni Yazılardan Haberdar Olun</h2>
          <p className="text-orange-100 mb-8 text-lg">
            Blog yazılarımızı ve güncellemelerimizi e-posta ile alın
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 outline-none"
            />
            <button className="px-6 py-3 bg-white text-brand-orange rounded-xl font-bold hover:scale-105 transition-transform whitespace-nowrap">
              Abone Ol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
