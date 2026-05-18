import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, BookOpen, Bookmark, Settings, Bell, Upload, User, 
  Star, Eye, FileText, ChevronRight, X, Sparkles, LogOut, 
  Home, Sun, Moon, Mail, Lock, AlertCircle, Loader2, Info,
  Download, MessageCircle, Share2, Heart, Clock, TrendingUp,
  Shield, CreditCard, BellRing, HelpCircle, Filter,
  ZoomIn, ZoomOut, Maximize2,
  ImageIcon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

// --- Konfigurasi Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDbqXTdXvW65FKN80iFfq0PYnoY3bLwgm4",
  authDomain: "scribo-2043d.firebaseapp.com",
  projectId: "scribo-2043d",
  storageBucket: "scribo-2043d.firebasestorage.app",
  messagingSenderId: "523286692927",
  appId: "1:523286692927:web:6c8f2eadbf138d3f5ea48a",
  measurementId: "G-CMQ5Q2F9YD"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'scribo-v1-startup';

// --- Daftar Kategori Komprehensif Universitas Indonesia (Dapat Dicari / Searchable) ---
const CATEGORIES = [
  'IT & Software',
  'Teknik Informatika',
  'Sistem Informasi',
  'Data Science',
  'Cyber Security',
  'Artificial Intelligence',
  'Kedokteran',
  'Keperawatan',
  'Farmasi',
  'Psikologi',
  'Hukum',
  'Akuntansi',
  'Manajemen',
  'Ekonomi',
  'Bisnis',
  'Perpajakan',
  'Matematika',
  'Statistika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Teknik Sipil',
  'Teknik Elektro',
  'Teknik Industri',
  'Teknik Mesin',
  'Arsitektur',
  'Desain Grafis',
  'UI/UX',
  'Ilmu Komunikasi',
  'Pendidikan',
  'Bahasa Inggris',
  'Sastra',
  'Filsafat',
  'Hubungan Internasional',
  'Administrasi Negara',
  'Agribisnis',
  'Pariwisata'
];

const AUTHORS = ['Dr. Aris Munandar', 'Prof. Sarah Jane', 'Budi Raharjo, M.T.', 'Anisa Fitri, Ph.D', 'Kevin Sanjaya', 'Lestari Putri'];

const GENERATED_MATERIALS = Array.from({ length: 50 }).map((_, i) => {
  const categorySelected = CATEGORIES[i % CATEGORIES.length];
  
  let defaultPages = 12;
  if (categorySelected.includes('Sains') || categorySelected.includes('Matematika')) defaultPages = 45;
  if (categorySelected.includes('Hukum')) defaultPages = 32;
  if (categorySelected.includes('Kedokteran')) defaultPages = 120;

  return {
    id: `mat-${i}`,
    pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    title: [
      'Algoritma Pemrograman Lanjut', 'Anatomi Tubuh Manusia Dasar', 'Strategi Pemasaran Digital', 
      'Psikologi Kognitif', 'Hukum Dagang Internasional', 'Kalkulus Lanjut - Turunan Parsial', 
      'Desain Sistem Terintegrasi', 'Manajemen Sumber Daya Manusia', 'Fisika Kuantum untuk Pemula',
      'Arsitektur Mikroservis', 'Metode Penelitian Kualitatif', 'Ekonomi Makro Terapan'
    ][i % 12] + (i > 12 ? ` Vol. ${Math.floor(i/12) + 1}` : ''),
    description: 'Catatan lengkap mengenai materi perkuliahan disertai dengan visualisasi, rumus-rumus penunjang, dan pembahasan latihan soal untuk persiapan ujian.',
    author: AUTHORS[i % AUTHORS.length],
    category: categorySelected,
    rating: parseFloat((4 + Math.random()).toFixed(1)),
    views: Math.floor(Math.random() * 5000) + 100,
    downloads: Math.floor(Math.random() * 1000) + 50,
    fileSize: (Math.random() * 15 + 1).toFixed(1) + ' MB',
    pages: defaultPages,
    commentsCount: 2,
    tags: ['Kuliah', 'Ujian', 'Referensi', 'E-Book'],
    uploadDate: `2024-05-14`,
    comments: [
      { user: 'Andi Pratama', text: 'Sangat membantu untuk persiapan kuis besok pagi!', rating: 5, date: '2 jam yang lalu' },
      { user: 'Siti Rahma', text: 'Penjelasannya sangat runut dan mudah dipahami oleh pemula.', rating: 4, date: '1 hari yang lalu' }
    ]
  };
});

export default function App() {
  // --- State Global ---
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('home'); 
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // UI States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // App Logic States
  const [materials, setMaterials] = useState(GENERATED_MATERIALS);
  const [savedIds, setSavedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('Latest');

  // Comment & Rating Input
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0); 
  const [hoveredRating, setHoveredRating] = useState(0);

  // Previewer States
  const [zoom, setZoom] = useState(100);
  const [activePage, setActivePage] = useState(1);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // --- Theme Toggle ---
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('scribo-theme', newTheme ? 'dark' : 'light');
    if (newTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('scribo-theme');
    const initialTheme = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(initialTheme);
    if (initialTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      return;
    }
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'saved_materials'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedIds(snapshot.docs.map(doc => doc.data().materialId));
    });
    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---
  const handleAuth = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setIsAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleBookmark = async (e, materialId) => {
    if (e) e.stopPropagation();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const isSaved = savedIds.includes(materialId);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'saved_materials', materialId);
    
    if (isSaved) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, { materialId, timestamp: serverTimestamp() });
    }
  };

  const handleSelectMaterial = (item) => {
    setSelectedMaterial(item);
    setUserRating(0); 
    setHoveredRating(0); 
    setNewComment('');
    setZoom(100);
    setActivePage(1);
    setIsFullscreenPreview(false);
  };

  const postComment = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!newComment.trim() && userRating === 0) return;
    
    const comment = {
      user: user.email.split('@')[0],
      text: newComment.trim() || 'Memberikan rating tanpa komentar.',
      rating: userRating || 5, 
      date: 'Baru saja'
    };

    const updated = materials.map(m => {
      if (m.id === selectedMaterial.id) {
        return { 
          ...m, 
          comments: [comment, ...(m.comments || [])], 
          commentsCount: (m.commentsCount || 0) + 1 
        };
      }
      return m;
    });

    setMaterials(updated);
    setSelectedMaterial(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: [comment, ...(prev.comments || [])],
        commentsCount: (prev.commentsCount || 0) + 1
      };
    });
    
    setNewComment('');
    setUserRating(0); 
  };

  // Callback after uploading from Modal
  const handleUploadedMaterial = (newMat) => {
    setMaterials([newMat, ...materials]);
    setIsUploadModalOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage('home');
  };

  // --- Sorting & Filtering Logic ---
  const filteredMaterials = useMemo(() => {
    let result = materials.filter(m => {
      const query = searchQuery.toLowerCase();
      return m.title.toLowerCase().includes(query) || 
             m.category.toLowerCase().includes(query) ||
             m.author.toLowerCase().includes(query) ||
             m.tags?.some(t => t.toLowerCase().includes(query));
    });

    switch (activeSort) {
      case 'Highest Rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'Highest Views':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'Most Saved':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'Latest':
      default:
        result.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        break;
    }

    return result;
  }, [materials, searchQuery, activeSort]);

  const savedMaterials = materials.filter(m => savedIds.includes(m.id));

  // --- Components ---

  const MaterialCard = ({ item }) => (
    <div 
      onClick={() => handleSelectMaterial(item)} 
      className="group bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-2"
    >
      <div className="aspect-[1.2/1] rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 mb-5 overflow-hidden relative">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-[1.5rem]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-200 dark:text-slate-700">
            <FileText size={60} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {item.category}
        </div>
        <button 
          onClick={(e) => toggleBookmark(e, item.id)} 
          className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl backdrop-blur-md transition-all shadow-sm ${savedIds.includes(item.id) ? 'bg-indigo-600 text-white' : 'bg-white/90 dark:bg-slate-900/90 text-slate-300 hover:text-indigo-600'}`}
        >
          <Bookmark size={18} fill={savedIds.includes(item.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h3>
      <p className="text-sm font-medium text-slate-400 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span> {item.author}
      </p>
      <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500"><Star size={14} fill="currentColor" /> {item.rating}</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Eye size={14} /> {item.views}</div>
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{item.fileSize}</div>
      </div>
    </div>
  );

  // --- Views ---

  const HomeView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto text-center mb-16 pt-10">
        <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight dark:text-white leading-[1.1]">
          Materi Kuliah dalam <span className="text-indigo-600 underline decoration-indigo-200 dark:decoration-indigo-900 underline-offset-8">Genggaman</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-medium">Cari, simpan, dan pelajari materi kuliah favoritmu dengan cepat.</p>
        <div className="mt-10 relative group max-w-2xl mx-auto cursor-pointer" onClick={() => setCurrentPage('search')}>
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-2 pl-6">
            <Search className="text-slate-300" size={24} />
            <div className="w-full text-left px-4 py-4 text-lg font-medium text-slate-400">Cari mata kuliah, author, atau kategori...</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {materials.slice(0, 12).map((item) => (
          <MaterialCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  const SearchView = () => {
    const filters = ['Latest', 'Highest Rating', 'Highest Views', 'Most Saved', 'Trending'];
    
    return (
      <div className="animate-in fade-in duration-500 py-4 max-w-5xl mx-auto">
        <div className="sticky top-20 z-30 bg-[#F8FAFC]/80 dark:bg-[#020617]/80 backdrop-blur-md pt-4 pb-6">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-2 pl-6 mb-6">
            <Search className="text-indigo-600" size={20} />
            <input 
              autoFocus
              type="text" placeholder="Cari materi kuliah..."
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium placeholder:text-slate-400 dark:text-white"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-2 mr-2 text-slate-400 hover:text-indigo-600">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Filter size={18} />
            </div>
            {filters.map(f => (
              <button 
                key={f} 
                onClick={() => setActiveSort(f)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${activeSort === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {!searchQuery ? (
          <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-400 dark:text-slate-600">Mulai mengetik untuk mencari materi</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Cari berdasarkan judul, kategori, atau nama dosen pengampu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
            {filteredMaterials.map((item) => (
              <MaterialCard key={item.id} item={item} />
            ))}
            {filteredMaterials.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-500 font-bold">Materi tidak ditemukan...</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SavedView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-black dark:text-white tracking-tight">Materi Tersimpan</h2>
        <p className="text-slate-400 font-bold">{savedMaterials.length} Item</p>
      </div>

      {savedMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {savedMaterials.map(m => <MaterialCard key={m.id} item={m} />)}
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-12">
           <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Bookmark size={40} /></div>
           <h3 className="text-2xl font-black mb-2 dark:text-white">Kosong?</h3>
           <p className="text-slate-400 font-medium mb-8">Kamu belum menyimpan materi apapun. Cari materi menarik dan simpan di sini!</p>
           <button onClick={() => setCurrentPage('search')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">Cari Materi</button>
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div className="max-w-4xl mx-auto py-10 pb-20 space-y-8 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-black shadow-xl ring-8 ring-slate-50 dark:ring-slate-800 shrink-0">
          {user ? user.email[0].toUpperCase() : 'S'}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-3xl font-black dark:text-white mb-1">{user ? user.email.split('@')[0] : 'Scribo User'}</h2>
          <p className="text-slate-400 font-medium mb-4">{user ? user.email : 'Silakan masuk untuk akses penuh'}</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
             <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Premium Member</span>
             <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Active 2024</span>
          </div>
        </div>
        {!user ? (
          <button onClick={() => setIsAuthModalOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">Masuk Akun</button>
        ) : (
          <button onClick={handleLogout} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 transition-all">Keluar</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 h-full">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"><Eye size={20}/></div>
             <h3 className="text-xl font-black dark:text-white">Tampilan</h3>
          </div>
          <button onClick={toggleTheme} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between group transition-all hover:ring-2 hover:ring-indigo-500">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                   {isDarkMode ? <Moon size={22}/> : <Sun size={22}/>}
                </div>
                <div className="text-left">
                   <p className="font-bold dark:text-white">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                   <p className="text-xs text-slate-400">Sesuaikan tema aplikasi</p>
                </div>
             </div>
             <div className={`w-12 h-6 rounded-full relative transition-all ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
             </div>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 h-full">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-purple-600"><BellRing size={20}/></div>
             <h3 className="text-xl font-black dark:text-white">Notifikasi</h3>
          </div>
          <div className="space-y-6">
             {[
               { label: 'Update Materi', desc: 'Info materi terbaru di kategori Anda' },
               { label: 'Info Kampus', desc: 'Berita akademik & pengumuman' }
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer"><div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white"></div></div>
               </div>
             ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
             <h3 className="text-3xl font-black mb-4">Tentang SCRIBO</h3>
             <p className="text-indigo-100 font-medium max-w-xl mb-8 leading-relaxed">Platform berbagi materi kuliah terbaik untuk mahasiswa Indonesia. Bangun komunitas belajar yang lebih baik bersama kami.</p>
             <div className="flex gap-4">
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-sm">Update V2.4</button>
                <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-black text-sm backdrop-blur-md">Pusat Bantuan</button>
             </div>
          </div>
          <Sparkles className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
        </div>
      </div>
    </div>
  );

  if (!isAuthReady) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
       <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-black text-indigo-600 tracking-widest uppercase">Scribo</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans pb-32 md:pb-0">
      
      <nav className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-10">
              <h1 className="text-2xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center gap-2" onClick={() => setCurrentPage('home')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Sparkles size={18} fill="currentColor"/></div>
                SCRIBO
              </h1>
              <div className="hidden md:flex items-center gap-8">
                {[
                  { id: 'home', label: 'Beranda' },
                  { id: 'search', label: 'Cari' },
                  { id: 'saved', label: 'Simpan' },
                  { id: 'settings', label: 'Pengaturan' }
                ].map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => p.id === 'saved' ? (user ? setCurrentPage(p.id) : setIsAuthModalOpen(true)) : setCurrentPage(p.id)}
                    className={`text-sm font-bold transition-all ${currentPage === p.id ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => (user ? setIsUploadModalOpen(true) : setIsAuthModalOpen(true))} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"><Upload size={18} /> Unggah</button>
              {!user ? (
                <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700">Masuk</button>
              ) : (
                <div onClick={() => setCurrentPage('settings')} className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer transition-transform hover:scale-110 shadow-lg shrink-0">{user.email[0].toUpperCase()}</div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 min-h-[80vh]">
        {currentPage === 'home' && <HomeView />}
        {currentPage === 'search' && <SearchView />}
        {currentPage === 'saved' && <SavedView />}
        {currentPage === 'settings' && <SettingsView />}
      </main>

      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-2.5 flex justify-between items-center">
          <button onClick={() => setCurrentPage('home')} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'home' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}><Home size={22} /></button>
          <button onClick={() => setCurrentPage('search')} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'search' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}><Search size={22} /></button>
          <div className="relative -mt-10"><button onClick={() => (user ? setIsUploadModalOpen(true) : setIsAuthModalOpen(true))} className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl ring-8 ring-white dark:ring-slate-950"><Upload size={28} /></button></div>
          <button onClick={() => (user ? setCurrentPage('saved') : setIsAuthModalOpen(true))} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'saved' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}><Bookmark size={22} /></button>
          <button onClick={() => setCurrentPage('settings')} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}><Settings size={22} /></button>
        </div>
      </div>

      {/* --- FIX MODAL AUTH: Z-INDEX & INTERACTION --- */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          {/* Backdrop Layer */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer z-0" 
            onClick={() => setIsAuthModalOpen(false)}
          ></div>
          
          {/* Modal Content Layer */}
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 pointer-events-auto">
             <button 
                type="button" 
                onClick={() => setIsAuthModalOpen(false)} 
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
                <X size={20} />
             </button>
             
             <h3 className="text-2xl font-black dark:text-white text-center mb-8">
                {authMode === 'login' ? 'Masuk SCRIBO' : 'Daftar Akun'}
             </h3>

             {authError && (
               <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="font-medium">{authError}</p>
               </div>
             )}

             <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative group">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                   <input 
                      required 
                      type="email" 
                      placeholder="Email Mahasiswa" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-14 pr-6 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                   />
                </div>
                <div className="relative group">
                   <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                   <input 
                      required 
                      type="password" 
                      placeholder="Password" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-14 pr-6 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                   />
                </div>

                <button 
                   disabled={authLoading} 
                   type="submit" 
                   className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${authLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                   {authLoading ? <Loader2 className="animate-spin" size={20} /> : 'Lanjutkan'}
                </button>
             </form>

             <div className="mt-8 text-center">
                <p className="text-slate-400 text-sm font-medium">
                   {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                   <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="ml-2 text-indigo-600 font-black hover:underline"
                   >
                      {authMode === 'login' ? 'Daftar Sekarang' : 'Masuk Saja'}
                   </button>
                </p>
             </div>
          </div>
        </div>
      )}

      {selectedMaterial && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" onClick={() => setSelectedMaterial(null)}></div>
           {/* Detailed Material Modal - Premium Improvement */}
           <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 p-6 md:p-10 pointer-events-auto flex flex-col gap-6">
              
              {/* Header section with Category Badge and Close Button */}
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-wider">
                  {selectedMaterial.category}
                </span>
                <button 
                  onClick={() => setSelectedMaterial(null)} 
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* PDF Viewer / Document Preview Container */}
              <div className="w-full bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-inner">
                {/* PDF Viewer toolbar */}
                <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-indigo-600" />
                    <span>PREVIEW_READER.pdf</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Halaman Indicator */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                      <span>Hal.</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{activePage}</span>
                      <span className="text-slate-300">/</span>
                      <span>3</span>
                    </div>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <button 
                        onClick={() => setZoom(prev => Math.max(70, prev - 10))}
                        className="p-1 hover:text-indigo-600 transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="text-[10px] w-10 text-center">{zoom}%</span>
                      <button 
                        onClick={() => setZoom(prev => Math.min(150, prev + 10))}
                        className="p-1 hover:text-indigo-600 transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>

                    {/* Toggle fullscreen preview */}
                    <button 
                      onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                      className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 ${isFullscreenPreview ? 'text-indigo-600' : ''}`}
                      title="Fullscreen Preview"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>

                {/* REAL PDF VIEWER */}
<div className="w-full h-[600px] bg-slate-200 dark:bg-slate-900/60 rounded-2xl overflow-hidden">
  {selectedMaterial.pdfUrl ? (
    <iframe
      src={selectedMaterial.pdfUrl}
      title="PDF Preview"
      className="w-full h-full bg-white"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
      Preview PDF tidak tersedia
    </div>
  )}
</div>

                {/* PDF Page Navigation footer inside modal viewer */}
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <button 
                    disabled={activePage === 1}
                    onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-600 transition-colors"
                  >
                    Halaman Sebelumnya
                  </button>
                  <span>Halaman {activePage} dari 3</span>
                  <button 
                    disabled={activePage === 3}
                    onClick={() => setActivePage(prev => Math.min(3, prev + 1))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-600 transition-colors"
                  >
                    Halaman Selanjutnya
                  </button>
                </div>
              </div>

              {/* Title & Author */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                  {selectedMaterial.title}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    {selectedMaterial.author.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {selectedMaterial.author}
                  </p>
                </div>
              </div>

              {/* Quote / Short Description Box */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-500">
                <p className="text-sm italic font-medium text-slate-600 dark:text-indigo-300">
                  "{selectedMaterial.description}"
                </p>
              </div>

              {/* REAL PDF VIEWER */}
<div className="w-full h-[600px] bg-slate-200 dark:bg-slate-900/60 rounded-2xl overflow-hidden mb-8">
  {selectedMaterial.pdfUrl ? (
    <iframe
      src={selectedMaterial.pdfUrl}
      title="PDF Preview"
      className="w-full h-full bg-white"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
      Preview PDF tidak tersedia
    </div>
  )}
</div>

              {/* FIX RATING STAR: Default none active unless selected */}
              <div className="bg-[#10192e] rounded-3xl p-6 text-white border border-white/5 flex flex-col gap-4">
                <p className="font-bold text-base text-slate-100">Bagaimana menurutmu materi ini?</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => !user ? setIsAuthModalOpen(true) : setUserRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform active:scale-125 focus:outline-none"
                    >
                      <Star 
                        size={28} 
                        className={(hoveredRating || userRating) >= star ? "text-amber-400 fill-amber-400 cursor-pointer" : "text-slate-600 cursor-pointer"}
                      />
                    </button>
                  ))}
                  {userRating > 0 && (
                    <span className="ml-3 text-sm font-black text-amber-400">
                      Rating Anda: {userRating}.0 / 5.0
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <textarea 
                    placeholder={user ? "Tulis ulasan singkat..." : "Silakan masuk untuk berkomentar"}
                    disabled={!user}
                    className="flex-grow bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-12"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onClick={() => !user && setIsAuthModalOpen(true)}
                  />
                  <button 
                    onClick={postComment}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
                  >
                    Kirim
                  </button>
                </div>
              </div>

              {/* Ulasan Mahasiswa Header */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Ulasan Mahasiswa</h4>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400">
                  {selectedMaterial.commentsCount || selectedMaterial.comments?.length || 0} Komentar
                </span>
              </div>

              {/* FIX COMMENT SYSTEM & COMMENT UI: Avatar, username, rating, text, date */}
              <div className="space-y-4 custom-scrollbar pr-2">
                {(selectedMaterial.comments || []).map((c, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/50">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm shrink-0">
                      {c.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{c.user}</p>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">{c.date || 'Baru saja'}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} fill={c.rating > i ? "currentColor" : "none"} className={c.rating > i ? "text-amber-500" : "text-slate-300 dark:text-slate-700"} />
                        ))}
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
                {(!selectedMaterial.comments || selectedMaterial.comments.length === 0) && (
                  <p className="text-xs font-bold text-slate-400 text-center py-4">Belum ada ulasan untuk materi ini.</p>
                )}
              </div>

              {/* Big Download & Love/Bookmark Row */}
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-auto">
                <button 
                  onClick={() => !user ? setIsAuthModalOpen(true) : alert("Mengunduh dokumen PDF...")}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Unduh File PDF ({selectedMaterial.fileSize || '2.4 MB'})
                </button>
                <button 
                  onClick={(e) => toggleBookmark(e, selectedMaterial.id)}
                  className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center active:scale-95 ${
                    savedIds.includes(selectedMaterial.id) 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  <Bookmark size={22} fill={savedIds.includes(selectedMaterial.id) ? "currentColor" : "none"} />
                </button>
              </div>

           </div>
        </div>
      )}

      {/* --- ENHANCED UPLOAD MODAL --- */}
      {isUploadModalOpen && (
        <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          onUploadSuccess={handleUploadedMaterial}
          user={user}
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}

// --- NEW COMPONENT: PREMIUM SEARCHABLE & DRAG-AND-DROP UPLOAD MODAL ---
function UploadModal({ isOpen, onClose, onUploadSuccess, user }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('IT & Software');
  const [tags, setTags] = useState('');
  
  // PDF File States
  const [pdfFile, setPdfFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Thumbnail States
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const thumbnailInputRef = useRef(null);

  // Searchable Category States
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Filter Categories based on user typing
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetPdf(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetPdf(e.target.files[0]);
    }
  };

  const validateAndSetPdf = (file) => {
  if (file.type !== "application/pdf") {
    alert("Format berkas tidak valid! Hanya mendukung file .pdf");
    return;
  }

  const pdfUrl = URL.createObjectURL(file);

  setPdfFile({
    file,
    url: pdfUrl,
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
  });
};

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert("Format gambar tidak didukung! Hanya .jpg, .jpeg, dan .png");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!title.trim() || !pdfFile) {
      alert("Mohon lengkapi judul materi dan file PDF.");
      return;
    }

    const newMaterial = {
      id: `mat-upload-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "Tidak ada deskripsi yang disediakan.",
      category: selectedCategory,
      author: user?.email ? user.email.split('@')[0] : 'Uploader',
      rating: 0.0,
      views: 0,
      downloads: 0,
      fileSize: pdfFile.size,
      pdfUrl: pdfFile.url,
      pages: Math.floor(Math.random() * 50) + 5,
      tags: tags ? tags.split(',').map(t => t.trim()) : ['Kuliah'],
      uploadDate: new Date().toISOString().split('T')[0],
      thumbnail: thumbnailUrl || 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=400&auto=format&fit=crop&q=60',
      comments: []
    };

    onUploadSuccess(newMaterial);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar flex flex-col gap-6 animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-black dark:text-white">Unggah Materi Baru</h3>
            <p className="text-slate-400 text-sm font-medium">Bantu mahasiswa di Indonesia dengan catatan, rangkuman, atau bank soal.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body split into columns on desktop */}
        <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: PDF & Thumbnail uploads */}
          <div className="space-y-6">
            
            {/* 1. PDF Drag and Drop Area */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Unggah PDF Materi</label>
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`w-full p-8 border-2 border-dashed rounded-[2rem] text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
                  isDragActive 
                    ? 'border-indigo-600 bg-indigo-500/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-500'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                  <FileText size={24} />
                </div>
                {pdfFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[280px]">{pdfFile.name}</p>
                    <p className="text-xs font-semibold text-indigo-500">{pdfFile.size}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tarik berkas PDF atau klik di sini</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase">Validasi otomatis hanya berkas .pdf</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Thumbnail / Cover Upload */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Gambar Cover / Thumbnail</label>
              <div className="flex gap-4 items-center">
                <div 
                  onClick={() => thumbnailInputRef.current.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-500 cursor-pointer flex items-center justify-center text-slate-400 overflow-hidden relative shrink-0"
                >
                  <input 
                    type="file" 
                    ref={thumbnailInputRef}
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-sm font-bold dark:text-white">Pilih Gambar Cover</p>
                  <p className="text-xs text-slate-400">Gunakan rasio 1.2:1 atau kotak (.png, .jpg, .jpeg)</p>
                  <button 
                    type="button"
                    onClick={() => thumbnailInputRef.current.click()}
                    className="text-xs font-black text-indigo-600 hover:underline mt-1 block"
                  >
                    Cari File Gambar
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Realtime Preview Card */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Pratinjau Hasil Kartu</p>
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex gap-4">
                <div className="w-24 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400">
                  {thumbnailUrl ? <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" /> : <FileText size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">{selectedCategory}</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">{title || "Judul Materi..."}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                    <span>Oleh {user?.email ? user.email.split('@')[0] : 'Anda'}</span>
                    <span>•</span>
                    <span>{pdfFile ? pdfFile.size : '0.0 MB'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Title, Searchable Category, Description, Tags */}
          <div className="space-y-5">
            
            {/* Title */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Judul Dokumen</label>
              <input 
                required
                type="text" 
                placeholder="Contoh: Kalkulus 1 - Turunan dan Penerapannya"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Searchable & Selectable Category UI */}
            <div className="relative">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Kategori Program Studi</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari & pilih kategori..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={isCategoryOpen ? categorySearch : selectedCategory}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setIsCategoryOpen(true);
                  }}
                  onFocus={() => {
                    setIsCategoryOpen(true);
                    setCategorySearch('');
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 px-3 py-1 rounded-lg">
                  {selectedCategory}
                </span>
              </div>
              
              {/* Category Search Dropdown */}
              {isCategoryOpen && (
                <div className="absolute top-[102%] left-0 right-0 max-h-[200px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 custom-scrollbar animate-in slide-in-from-top-1">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryOpen(false);
                        setCategorySearch('');
                      }}
                      className="w-full text-left px-6 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800/80 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="p-4 text-xs font-bold text-slate-400 text-center">Kategori tidak ditemukan.</p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Abstrak / Deskripsi Singkat</label>
              <textarea 
                required
                placeholder="Rangkum secara singkat apa saja subtopik yang dibahas dalam berkas materi kuliah ini..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none text-sm font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tags (Pisah dengan Koma)</label>
              <input 
                type="text" 
                placeholder="Contoh: uts, aljabar, teknik, dosenA"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

          </div>

          {/* Form Actions spanning across bottom */}
          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm rounded-2xl transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
            >
              <Sparkles size={16} />
              Terbitkan Sekarang
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}