import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Bookmark, 
  Bell, 
  Plus, 
  User, 
  FileText, 
  Download, 
  Star, 
  Eye, 
  Lock,
  ChevronRight,
  X,
  Mail,
  LockKeyhole,
  LogOut,
  Loader2,
  ArrowRight,
  AlertCircle,
  Home,
  Settings,
  Share2,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDbqXTdXvW65FKN80iFfq0PYnoY3bLwgm4",
  authDomain: "scribo-2043d.firebaseapp.com",
  projectId: "scribo-2043d",
  storageBucket: "scribo-2043d.firebasestorage.app",
  messagingSenderId: "523286692927",
  appId: "1:523286692927:web:6c8f2eadbf138d3f5ea48a"
};

let app, auth, db;
let isConfigValid = !!firebaseConfig.apiKey;

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
}

const CATEGORIES = ["Semua", "Matematika", "Informatika", "Ekonomi", "Psikologi", "Desain"];
const INITIAL_MATERIALS = [
  { id: '1', title: 'Struktur Data & Algoritma', author: 'Budi Santoso', category: 'Informatika', rating: 4.8, views: '1.2k', pages: 45, thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&q=80', description: 'Pelajari konsep dasar linked list, stack, queue, dan tree dengan implementasi praktis.', size: '2.4 MB' },
  { id: '2', title: 'Teori Ekonomi Makro', author: 'Siti Aminah', category: 'Ekonomi', rating: 4.5, views: '850', pages: 32, thumbnail: 'https://images.unsplash.com/photo-1611974714158-f89905202869?w=500&q=80', description: 'Analisis kebijakan moneter dan fiskal dalam konteks ekonomi global saat ini.', size: '1.8 MB' },
  { id: '3', title: 'Psikologi Perkembangan', author: 'Dr. Andi', category: 'Psikologi', rating: 4.9, views: '2.1k', pages: 120, thumbnail: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=500&q=80', description: 'Tahapan perkembangan manusia dari masa kanak-kanak hingga dewasa akhir.', size: '5.2 MB' },
  { id: '4', title: 'UI/UX Design Foundation', author: 'Maya Putri', category: 'Desain', rating: 4.7, views: '3.4k', pages: 58, thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=500&q=80', description: 'Prinsip desain visual, tipografi, dan user flow untuk aplikasi mobile modern.', size: '3.1 MB' },
];

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError("Email atau password tidak sesuai. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><Lock size={28} /></div>
          <h2 className="text-2xl font-black text-slate-900">{isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Gunakan akun kampus atau umum</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="email" placeholder="Email" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-indigo-500 font-medium" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" placeholder="Password" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-indigo-500 font-medium" onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}
          <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isLogin ? 'Masuk Sekarang' : 'Daftar Gratis')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm font-bold text-slate-400 hover:text-indigo-600">
          {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </motion.div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Upload Materi Baru</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-slate-700">Pilih File PDF</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Maksimal 20MB</p>
              </div>

              <div className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <p className="text-sm font-bold text-slate-700">Pilih Thumbnail</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">PNG, JPG (16:9)</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Judul Materi</label>
                <input type="text" placeholder="Contoh: Kalkulus Lanjut" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 border-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Kategori</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 border-none appearance-none">
                  {CATEGORIES.filter(c => c !== "Semua").map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Deskripsi Singkat</label>
                <textarea rows="3" placeholder="Apa yang dipelajari?" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 border-none resize-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 flex items-center gap-4">
          <button onClick={onClose} className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600">Batal</button>
          <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            Publish Materi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const isGuest = useMemo(() => !user || user?.isAnonymous, [user]);

  useEffect(() => {
    if (!isConfigValid) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        try { await signInAnonymously(auth); } catch (e) { console.error(e); }
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, []);

  const guardAction = (e, callback) => {
    if (e) e.stopPropagation();
    if (isGuest) {
      setShowAuthModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const filteredMaterials = useMemo(() => {
    return INITIAL_MATERIALS.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Semua" || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const MaterialDetail = () => (
    <AnimatePresence>
      {selectedMaterial && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setSelectedMaterial(null)} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: window.innerWidth < 768 ? 0 : 0, scale: window.innerWidth < 768 ? 1 : 1 }} 
            exit={{ y: '100%' }}
            className="relative w-full md:w-[80%] md:max-w-[1000px] h-[90vh] md:h-auto md:max-h-[85vh] bg-white shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col"
          >
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-10">
               <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                 {selectedMaterial.category}
               </div>
               <button onClick={() => setSelectedMaterial(null)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
               <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">{selectedMaterial.title}</h3>
               
               <div className="relative pl-6 py-2 mb-10 border-l-4 border-indigo-600">
                 <p className="text-lg text-slate-500 font-medium italic leading-relaxed">
                   "{selectedMaterial.description}"
                 </p>
               </div>

               {/* Dark Rating Section from Screenshot (159).jpg */}
               <div className="bg-[#1a1c2e] rounded-[2rem] p-8 md:p-10 mb-10 text-white">
                 <h5 className="text-lg font-bold mb-6">Bagaimana menurutmu materi ini?</h5>
                 <div className="flex gap-2 mb-8">
                   {[1,2,3,4,5].map(star => (
                     <Star key={star} size={32} className={star <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                   ))}
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-slate-400 font-medium text-sm">
                     Tulis ulasan singkat...
                   </div>
                   <button className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all">Kirim</button>
                 </div>
               </div>

               <div className="flex items-center justify-between mb-8">
                 <h5 className="text-lg font-black text-slate-900">Ulasan Mahasiswa</h5>
                 <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">1 Komentar</span>
               </div>
               
               <div className="flex gap-4 mb-20">
                 <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
                 <div className="space-y-1">
                   <p className="text-sm font-bold text-slate-900">Rizky Ramadhan <span className="text-xs font-medium text-slate-400 ml-2">2 jam yang lalu</span></p>
                   <p className="text-sm text-slate-500">Materinya sangat membantu buat persiapan UTS besok.</p>
                 </div>
               </div>
            </div>

            {/* Bottom Actions from Screenshot (159).jpg */}
            <div className="p-6 md:p-8 border-t border-slate-50 flex items-center gap-4 bg-white sticky bottom-0">
              <button 
                onClick={(e) => guardAction(e)}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <Download size={20}/>
                Unduh File PDF ({selectedMaterial.size || '2.4 MB'})
              </button>
              <button onClick={(e) => guardAction(e)} className="w-16 h-16 border-2 border-slate-50 rounded-3xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:border-rose-50 transition-all group">
                <Bookmark size={24} className="group-hover:fill-current" />
              </button>
            </div>

            {/* Guest Blur Overlay */}
            {isGuest && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-30 flex flex-col items-center justify-center p-10 text-center">
                 <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-indigo-100"><Lock size={28}/></div>
                 <h4 className="text-2xl font-black text-slate-900 mb-2">Akses Terbatas</h4>
                 <p className="text-slate-500 font-medium mb-8 text-sm max-w-xs">Login untuk membuka seluruh materi, berdiskusi, dan download file secara gratis.</p>
                 <button 
                   onClick={() => setShowAuthModal(true)} 
                   className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-600 transition-all"
                 >
                   Masuk ke SCRIBO
                 </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderSearch = () => (
    <div className="px-6 py-10 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10 max-w-3xl">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Pencarian</h2>
        <p className="text-slate-500 font-medium mb-8">Temukan catatan, ringkasan, dan bank soal.</p>
        
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" autoFocus placeholder="Ketik subjek, dosen, atau judul materi..."
            className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] outline-none ring-2 ring-transparent focus:ring-indigo-600/20 focus:bg-white transition-all text-lg font-bold shadow-sm"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-10 pb-2">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-8">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{filteredMaterials.length} Hasil Ditemukan</span>
        <button className="flex items-center gap-2 text-sm font-bold text-slate-600 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">
          <Filter size={16} /> Filter
        </button>
      </div>

      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-32">
          {filteredMaterials.map((m) => renderCard(m))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200">
            <Search size={32} />
          </div>
          <p className="font-bold text-slate-400">Tidak ada hasil untuk "{searchQuery}"</p>
        </div>
      )}
    </div>
  );

  const renderHome = () => (
    <>
      <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Materi Kuliah dalam <br /> <span className="text-indigo-600">Genggaman Anda</span>
          </h2>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium px-4">
            Cari, simpan, dan pelajari ribuan materi kuliah dari berbagai kampus di Indonesia.
          </p>
          <div className="max-w-2xl mx-auto relative px-4">
            <div 
              onClick={() => setActivePage('search')}
              className="flex items-center bg-slate-100 p-1 rounded-[2rem] border border-slate-200 cursor-pointer hover:bg-slate-200/50 transition-all"
            >
              <div className="pl-4 pr-2 text-slate-400"><Search size={22} /></div>
              <div className="flex-1 py-4 text-left text-slate-400 font-medium text-lg">Cari judul materi...</div>
              <div className="hidden md:block px-6 py-3 bg-white rounded-[1.5rem] text-sm font-black text-indigo-600 shadow-sm">Jelajahi</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-6 mb-8 max-w-7xl mx-auto pb-32">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-slate-900">Materi Terpopuler</h3>
           <button onClick={() => setActivePage('search')} className="text-sm font-bold text-indigo-600 flex items-center gap-1">Lihat Semua <ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {INITIAL_MATERIALS.slice(0, 4).map((m) => renderCard(m))}
        </div>
      </section>
    </>
  );

  const renderCard = (m) => (
    <div key={m.id} onClick={() => setSelectedMaterial(m)} className="group bg-white rounded-[2.5rem] p-4 border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all cursor-pointer">
      <div className="relative aspect-[4/3] rounded-[2.2rem] overflow-hidden mb-5">
        <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <button 
          onClick={(e) => guardAction(e, () => {})}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"
        >
          {isGuest ? <Lock size={18} className="opacity-40" /> : <Bookmark size={18} />}
        </button>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-wider shadow-sm">
          {m.category}
        </div>
      </div>
      <div className="px-1">
        <div className="flex items-center gap-1 text-amber-500 font-black text-xs mb-2">
          <Star size={14} fill="currentColor"/> {m.rating} <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400">{m.views} views</span>
        </div>
        <h4 className="font-bold text-slate-900 mb-4 line-clamp-2 min-h-[3rem] group-hover:text-indigo-600 transition-colors leading-tight">{m.title}</h4>
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center text-[11px] font-black text-indigo-600 uppercase">{m.author[0]}</div>
            <span className="text-xs font-bold text-slate-400">{m.author}</span>
          </div>
          <div className="flex items-center gap-1 font-black text-xs text-indigo-600">
            Detail <ChevronRight size={14}/>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activePage) {
      case 'home': return renderHome();
      case 'search': return renderSearch();
      case 'saved': return (
        <div className="px-6 py-20 max-w-7xl mx-auto text-center min-h-[70vh] flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6"><Bookmark size={40} /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Materi Tersimpan</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">Login untuk melihat materi yang sudah Anda simpan.</p>
          {isGuest && <button onClick={() => setShowAuthModal(true)} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100">Masuk Akun</button>}
        </div>
      );
      case 'settings': return (
        <div className="px-6 py-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Profil</h2>
          <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                {isGuest ? 'G' : user?.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{isGuest ? 'Guest User' : user?.email}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{isGuest ? 'Penjelajah' : 'Mahasiswa Verified'}</p>
              </div>
            </div>
            {!isGuest && <button onClick={() => signOut(auth)} className="text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">Keluar</button>}
          </div>
          {isGuest && <button onClick={() => setShowAuthModal(true)} className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Hubungkan Akun</button>}
        </div>
      );
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-24 md:pb-0 selection:bg-indigo-100 selection:text-indigo-600">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 onClick={() => setActivePage('home')} className="text-2xl font-black text-indigo-600 tracking-tighter cursor-pointer">SCRIBO</h1>
            <div className="hidden lg:flex items-center gap-8">
              {['Home', 'Search', 'Saved'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => setActivePage(item.toLowerCase())}
                  className={`text-sm font-bold transition-all ${activePage === item.toLowerCase() ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all relative">
              <Bell size={20}/>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
            </button>
            {isGuest ? (
              <button onClick={() => setShowAuthModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">Masuk</button>
            ) : (
              <div onClick={() => setActivePage('settings')} className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black cursor-pointer ring-2 ring-indigo-50">
                {user?.email[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      {renderContent()}

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex items-center justify-between">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'search', icon: Search, label: 'Cari' },
          { id: 'saved', icon: Bookmark, label: 'Simpan' },
          { id: 'settings', icon: Settings, label: 'Profil' }
        ].map((item) => (
          <button 
            key={item.id} onClick={() => setActivePage(item.id)}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${activePage === item.id ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            <item.icon size={22} className={activePage === item.id ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[80]">
        <button 
          onClick={(e) => guardAction(e, () => setShowUploadModal(true))}
          className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl hover:bg-indigo-600 hover:-translate-y-2 transition-all active:scale-95"
        >
          {isGuest ? <Lock size={20} className="text-slate-400" /> : <Plus size={20} />}
          <span>Upload Materi</span>
        </button>
      </div>

      <MaterialDetail />
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input, select, textarea { -webkit-appearance: none; }
      `}</style>

    </div>
  );
}