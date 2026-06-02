import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, BookOpen, Bookmark, Settings, Bell, Upload, User,
  Star, Eye, EyeOff, FileText, ChevronRight, ChevronLeft, X, Sparkles, LogOut,
  Home, Sun, Moon, Mail, Lock, AlertCircle, Loader2, Info,
  Download, MessageCircle, Share2, Heart, Clock, TrendingUp,
  Shield, CreditCard, BellRing, HelpCircle, Filter, Camera, Trash2, Globe, Image as ImageIcon
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

// --- Kategori ---
const CATEGORIES = [
  'IT & Software', 'Teknik Informatika', 'Sistem Informasi', 'Data Science', 'Cyber Security',
  'Artificial Intelligence', 'Kedokteran', 'Keperawatan', 'Farmasi', 'Psikologi', 'Hukum',
  'Akuntansi', 'Manajemen', 'Ekonomi', 'Bisnis', 'Perpajakan', 'Matematika', 'Statistika',
  'Fisika', 'Kimia', 'Biologi', 'Teknik Sipil', 'Teknik Elektro', 'Teknik Industri',
  'Teknik Mesin', 'Arsitektur', 'Desain Grafis', 'UI/UX', 'Ilmu Komunikasi', 'Pendidikan',
  'Bahasa Inggris', 'Sastra', 'Filsafat', 'Hubungan Internasional', 'Administrasi Negara',
  'Agribisnis', 'Pariwisata'
];

const AUTHORS = [
  'Dr. Aris Munandar', 'Prof. Sarah Jane', 'Budi Raharjo, M.T.',
  'Anisa Fitri, Ph.D', 'Kevin Sanjaya', 'Lestari Putri'
];

const GENERATED_MATERIALS = Array.from({ length: 50 }).map((_, i) => {
  const categorySelected = CATEGORIES[i % CATEGORIES.length];

  let defaultPages = 12;
  if (categorySelected.includes('Sains') || categorySelected.includes('Matematika')) defaultPages = 45;
  if (categorySelected.includes('Hukum')) defaultPages = 32;
  if (categorySelected.includes('Kedokteran')) defaultPages = 120;

  const titles = [
    'Algoritma Pemrograman Lanjut', 'Anatomi Tubuh Manusia Dasar', 'Strategi Pemasaran Digital',
    'Psikologi Kognitif', 'Hukum Dagang Internasional', 'Kalkulus Lanjut - Turunan Parsial',
    'Desain Sistem Terintegrasi', 'Manajemen Sumber Daya Manusia', 'Fisika Kuantum untuk Pemula',
    'Arsitektur Mikroservis', 'Metode Penelitian Kualitatif', 'Ekonomi Makro Terapan'
  ];

  return {
    id: `mat-${i}`,
    title: titles[i % 12] + (i > 12 ? ` Vol. ${Math.floor(i / 12) + 1}` : ''),
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
    uploadDate: '2024-05-14',
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

  // User Profile States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  const [currentLanguage, setCurrentLanguage] = useState('Indonesia');
  const [settingsSubView, setSettingsSubView] = useState('main');

  const translations = {
  Indonesia: {
    settings: "Pengaturan",
    profile: "Profil",
    password: "Ubah Kata Sandi",
    language: "Bahasa",
    theme: "Tema",
    review: "Beri Penilaian",
    help: "Pusat Bantuan",
    logout: "Keluar",
    dark: "Mode Gelap",
    light: "Mode Terang",
    system: "Ikuti Sistem",
    home: "Beranda",
    search: "Cari",
    saved: "Simpan",
    upload: "Unggah",
    login: "Masuk"
  },

  English: {
    settings: "Settings",
    profile: "Profile",
    password: "Change Password",
    language: "Language",
    theme: "Theme",
    review: "Rate This App",
    help: "Help Center",
    logout: "Logout",
    dark: "Dark Mode",
    light: "Light Mode",
    system: "System Default",
    home: "Home",
    search: "Search",
    saved: "Saved",
    upload: "Upload",
    login: "Login"
  }
};

const t = translations[currentLanguage];

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
      user: profileName,
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

  const handleUploadedMaterial = (newMat) => {
    setMaterials([newMat, ...materials]);
    setIsUploadModalOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage('home');
  };

  // --- Sorting & Filtering ---
  const filteredMaterials = useMemo(() => {
    let result = materials.filter(m => {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.tags?.some(t => t.toLowerCase().includes(q))
      );
    });

    switch (activeSort) {
      case 'Highest Rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'Highest Views': result.sort((a, b) => b.views - a.views); break;
      case 'Most Saved': result.sort((a, b) => b.downloads - a.downloads); break;
      case 'Latest':
      default: result.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)); break;
    }

    return result;
  }, [materials, searchQuery, activeSort]);

  const savedMaterials = materials.filter(m => savedIds.includes(m.id));

  // --- Components ---
  const MaterialCard = ({ item }) => (
    <div
      onClick={() => handleSelectMaterial(item)}
      className="group bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 hover:dark:bg-slate-800 hover:shadow-lg hover:-translate-y-2 transition-all cursor-pointer shadow-sm relative"
    >
      <div className="w-full h-32 rounded-xl mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <FileText size={32} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>

      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
        {item.category}
      </span>

      <button
        onClick={(e) => toggleBookmark(e, item.id)}
        className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl backdrop-blur-md transition-all shadow-sm ${
          savedIds.includes(item.id)
            ? 'bg-indigo-600 text-white'
            : 'bg-white/90 dark:bg-slate-900/90 text-slate-300 hover:text-indigo-600'
        }`}
      >
        <Bookmark size={18} fill={savedIds.includes(item.id) ? "currentColor" : "none"} />
      </button>

      <h3 className="font-black text-sm mt-1 mb-1 dark:text-white line-clamp-2">{item.title}</h3>
      <p className="text-xs text-slate-400 font-medium mb-3">{item.author}</p>

      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          {item.rating}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {item.views}
        </span>
        <span>{item.fileSize}</span>
      </div>
    </div>
  );

  // --- Views ---
  const HomeView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-black dark:text-white mb-4 leading-tight">
          Materi Kuliah dalam Genggaman
        </h1>
        <p className="text-slate-400 text-lg">
          Cari, simpan, dan pelajari materi kuliah favoritmu dengan cepat.
        </p>
        <div
          className="mt-10 relative group max-w-2xl mx-auto cursor-pointer"
          onClick={() => setCurrentPage('search')}
        >
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 pl-6 gap-3">
            <Search className="text-slate-400" size={20} />
            <span className="text-slate-400 font-medium">
              Cari mata kuliah, author, atau kategori...
            </span>
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
              type="text"
              placeholder="Cari materi kuliah..."
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium placeholder:text-slate-400 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 mr-2 text-slate-400 hover:text-indigo-600"
              >
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
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  activeSort === f
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
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
            <h3 className="text-xl font-black text-slate-400 dark:text-slate-600">
              Mulai mengetik untuk mencari materi
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
              Cari berdasarkan judul, kategori, atau nama dosen pengampu.
            </p>
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
      <div className="mb-8">
        <h2 className="text-3xl font-black dark:text-white">Materi Tersimpan</h2>
        <p className="text-slate-400 font-semibold mt-1">{savedMaterials.length} Item</p>
      </div>

      {savedMaterials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {savedMaterials.map(m => <MaterialCard key={m.id} item={m} />)}
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-12">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bookmark size={40} />
          </div>
          <h3 className="text-2xl font-black mb-2 dark:text-white">Kosong?</h3>
          <p className="text-slate-400 font-medium mb-8">
            Kamu belum menyimpan materi apapun. Cari materi menarik dan simpan di sini!
          </p>
          <button
            onClick={() => setCurrentPage('search')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg"
          >
            Cari Materi
          </button>
        </div>
      )}
    </div>
  );

  // --- Settings View ---
  const SettingsView = () => {
    const avatarInputRef = useRef(null);

    // Local state untuk form profil — supaya typing tidak trigger re-render App
    const [localName, setLocalName] = useState(profileName);
    const [localPhone, setLocalPhone] = useState(profilePhone);

    const triggerAvatarUpload = () => {
      if (avatarInputRef.current) avatarInputRef.current.click();
    };

    const handleAvatarChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => setProfileAvatar(reader.result);
        reader.readAsDataURL(file);
      }
    };

    // Gatekeeper: belum login
    if (!user) {
      return (
        <div className="max-w-md mx-auto py-12 px-4 text-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Shield size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black dark:text-white leading-tight">
                Masuk untuk mengakses profil dan fitur pribadi
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Masuk atau daftarkan akun baru Anda untuk menikmati fitur pencatatan, menyimpan dokumen favorit, dan kuis bertenaga AI di SCRIBO.
              </p>
            </div>
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-600/20"
              >
                Masuk
              </button>
              <button
                onClick={() => { setAuthMode('register'); setIsAuthModalOpen(true); }}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black transition-all border border-slate-200 dark:border-slate-700"
              >
                Daftar
              </button>
            </div>
          </div>
        </div>
      );
    }

    const renderMainSettings = () => (
      <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-lg">
              <img src={profileAvatar} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <button
              onClick={triggerAvatarUpload}
              className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-90"
            >
              <Camera size={12} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <h2 className="text-lg font-black dark:text-white mt-3">{profileName}</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">{user.email}</p>
        </div>

        {/* Umum */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">Umum</h4>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            <button
              onClick={() => setSettingsSubView('profile')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-sm font-bold dark:text-white">{t.profile}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => setSettingsSubView('password')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Lock size={16} />
                </div>
                <span className="text-sm font-bold dark:text-white">{t.password}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Lainnya */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2">Lainnya</h4>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            <button
              onClick={() => setSettingsSubView('language')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <span className="text-sm font-bold dark:text-white">{t.language}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button
              onClick={() => setSettingsSubView('theme')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="text-sm font-bold dark:text-white">{t.theme}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">{isDarkMode ? 'Dark' : 'Light'}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </button>
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <span className="text-sm font-bold dark:text-white">E-PPID</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Star size={16} />
                </div>
                <span className="text-sm font-bold dark:text-white">Ulas Aplikasi Ini</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 text-[11px] font-bold text-slate-400">
            <span>Versi</span>
            <span>V.2.10.2</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
          >
            Keluar
          </button>
        </div>
      </div>
    );

    const renderProfilePage = () => (
      <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSettingsSubView('main')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-black dark:text-white">Profil</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Nama Anda</label>
            <input
              type="text"
              className="w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-2xl py-3.5 px-5 dark:text-white font-bold outline-none"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">No Handphone</label>
            <input
              type="text"
              className="w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-2xl py-3.5 px-5 dark:text-white font-bold outline-none"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">Email</label>
            <input
              type="text"
              disabled
              className="w-full bg-slate-100 dark:bg-slate-800/40 border-none rounded-2xl py-3.5 px-5 text-slate-400 font-bold cursor-not-allowed outline-none"
              value={user?.email || ''}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-red-500/10 rounded-2xl px-2 transition-all group">
              <div className="flex items-center gap-3 text-red-500">
                <Trash2 size={16} />
                <span className="text-sm font-bold">Hapus Akun</span>
              </div>
              <ChevronRight size={16} className="text-red-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <button
            onClick={() => {
              // Baru sync ke App state pas klik Ubah
              setProfileName(localName);
              setProfilePhone(localPhone);
              alert("Profil berhasil diperbarui!");
              setSettingsSubView('main');
            }}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-2xl font-black text-base transition-all shadow-lg mt-6"
          >
            Ubah
          </button>
        </div>
      </div>
    );

    const renderPasswordPage = () => {
      const [pwd, setPwd] = useState('');
      const [confirmPwd, setConfirmPwd] = useState('');
      const [showPwd, setShowPwd] = useState(false);
      const [showConfirmPwd, setShowConfirmPwd] = useState(false);

      return (
        <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSettingsSubView('main')}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-black dark:text-white">Tambah Kata Sandi</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Masukkan kata sandi baru Anda"
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-2xl py-3.5 pl-5 pr-12 dark:text-white font-bold outline-none"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Ulangi Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru Anda"
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-2xl py-3.5 pl-5 pr-12 dark:text-white font-bold outline-none"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (pwd !== confirmPwd) { alert("Kata sandi tidak cocok!"); return; }
                alert("Kata sandi berhasil ditambahkan!");
                setSettingsSubView('main');
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-2xl font-black text-base transition-all shadow-lg mt-6"
            >
              Tambah Kata Sandi
            </button>
          </div>
        </div>
      );
    };

    const renderLanguagePage = () => (
      <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSettingsSubView('main')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-black dark:text-white">Ubah Bahasa</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          {['Indonesia', 'English'].map(lang => (
            <button
              type="button"
              key={lang}
              onClick={() => { setCurrentLanguage(lang); alert(`Bahasa diubah ke ${lang}`); setSettingsSubView('main'); }}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
            >
              <span className="text-sm font-bold dark:text-white">{lang}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentLanguage === lang ? 'border-indigo-600' : 'border-slate-300'}`}>
                {currentLanguage === lang && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );

    const renderThemePage = () => (
      <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSettingsSubView('main')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-black dark:text-white">Tema</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          {['Dark Mode', 'Light Mode', 'System Default'].map(themeOption => {
            const isThemeActive =
              (themeOption === 'Dark Mode' && isDarkMode) ||
              (themeOption === 'Light Mode' && !isDarkMode);

            return (
              <button
                type="button"
                key={themeOption}
                onClick={() => {
                  if (themeOption === 'Dark Mode' && !isDarkMode) toggleTheme();
                  if (themeOption === 'Light Mode' && isDarkMode) toggleTheme();
                  alert(`Tema diatur ke ${themeOption}`);
                  setSettingsSubView('main');
                }}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all"
              >
                <span className="text-sm font-bold dark:text-white">{themeOption}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isThemeActive ? 'border-indigo-600' : 'border-slate-300'}`}>
                  {isThemeActive && <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );

    switch (settingsSubView) {
      case 'profile': return renderProfilePage();
      case 'password': return renderPasswordPage();
      case 'language': return renderLanguagePage();
      case 'theme': return renderThemePage();
      case 'main':
      default: return renderMainSettings();
    }
  };

  // --- Main Render ---
  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300`}>

      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-10">
              <h1
                className="text-2xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center gap-2"
                onClick={() => setCurrentPage('home')}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Sparkles size={18} fill="currentColor" />
                </div>
                SCRIBO
              </h1>
              <div className="hidden md:flex items-center gap-8">
                {[
                  { id: 'home', label: t.home },
                  { id: 'search', label: t.search },
                  { id: 'saved', label: t.saved },
                  { id: 'settings', label: t.settings }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() =>
                      p.id === 'saved'
                        ? (user ? setCurrentPage(p.id) : setIsAuthModalOpen(true))
                        : setCurrentPage(p.id)
                    }
                    className={`text-sm font-bold transition-all ${
                      currentPage === p.id ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => (user ? setIsUploadModalOpen(true) : setIsAuthModalOpen(true))}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
              >
                <Upload size={18} /> {t.upload}
              </button>
              {!user ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700"
                >
                  {t.login}
                </button>
              ) : (
                <div
                  onClick={() => setCurrentPage('settings')}
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold cursor-pointer transition-transform hover:scale-110 shadow-lg shrink-0 overflow-hidden"
                >
                  <img src={profileAvatar} className="w-full h-full object-cover" alt="Avatar" />
                </div>
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

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 rounded-[2.5rem] shadow-2xl p-2.5 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage('home')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'home' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
          >
            <Home size={22} />
          </button>
          <button
            onClick={() => setCurrentPage('search')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'search' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
          >
            <Search size={22} />
          </button>
          <div className="relative -mt-10">
            <button
              onClick={() => (user ? setIsUploadModalOpen(true) : setIsAuthModalOpen(true))}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl ring-8 ring-white dark:ring-slate-950"
            >
              <Upload size={28} />
            </button>
          </div>
          <button
            onClick={() => (user ? setCurrentPage('saved') : setIsAuthModalOpen(true))}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'saved' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
          >
            <Bookmark size={22} />
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl ${currentPage === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Modal: Detail Material */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
            onClick={() => setSelectedMaterial(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 p-8 md:p-10 pointer-events-auto flex flex-col gap-6">

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

            {/* PDF Viewer */}
            <div className="w-full h-[400px] bg-slate-200 dark:bg-slate-900/60 rounded-2xl overflow-hidden relative">
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

            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-500">
              <p className="text-sm italic font-medium text-slate-600 dark:text-indigo-300">
                "{selectedMaterial.description}"
              </p>
            </div>

            {/* Rating & Komentar */}
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
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md shrink-0"
                >
                  Kirim
                </button>
              </div>
            </div>

            {/* Daftar Komentar */}
            <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
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
                        <Star
                          key={i}
                          size={12}
                          fill={c.rating > i ? "currentColor" : "none"}
                          className={c.rating > i ? "text-amber-500" : "text-slate-300 dark:text-slate-700"}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Unduh & Simpan */}
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-6 mt-auto">
              <button
                onClick={() => !user ? setIsAuthModalOpen(true) : alert("Mengunduh dokumen PDF...")}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
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

      {/* Modal: Auth */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer z-0"
            onClick={() => setIsAuthModalOpen(false)}
          />
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-14 pr-6 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-14 pr-6 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
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

      {/* Modal: Upload */}
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

// --- Upload Modal ---
function UploadModal({ isOpen, onClose, onUploadSuccess, user }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('IT & Software');
  const [tags, setTags] = useState('');

  const [pdfFile, setPdfFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const thumbnailInputRef = useRef(null);

  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter(cat =>
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
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
      reader.onloadend = () => setThumbnailUrl(reader.result);
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
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar flex flex-col gap-6 animate-in slide-in-from-bottom-10">

        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-black dark:text-white">Unggah Materi Baru</h3>
            <p className="text-slate-400 text-sm font-medium">
              Bantu mahasiswa di Indonesia dengan catatan, rangkuman, atau bank soal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kolom Kiri */}
          <div className="space-y-6">
            {/* Upload PDF */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Unggah PDF Materi
              </label>
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
                <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleFileChange} className="hidden" />
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

            {/* Thumbnail */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Gambar Cover / Thumbnail
              </label>
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

            {/* Card Preview */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Pratinjau Hasil Kartu</p>
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex gap-4">
                <div className="w-24 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400">
                  {thumbnailUrl
                    ? <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    : <FileText size={24} />
                  }
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

          {/* Kolom Kanan */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Judul Dokumen
              </label>
              <input
                required
                type="text"
                placeholder="Contoh: Pembahasan Aljabar Linear"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Searchable Category */}
            <div className="relative">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Kategori Program Studi
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari & pilih kategori..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={isCategoryOpen ? categorySearch : selectedCategory}
                  onChange={(e) => { setCategorySearch(e.target.value); setIsCategoryOpen(true); }}
                  onFocus={() => { setIsCategoryOpen(true); setCategorySearch(''); }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 px-3 py-1 rounded-lg">
                  {selectedCategory}
                </span>
              </div>

              {isCategoryOpen && (
                <div className="absolute top-[102%] left-0 right-0 max-h-[200px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 custom-scrollbar animate-in slide-in-from-top-1">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); setCategorySearch(''); }}
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

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Abstrak / Deskripsi Singkat
              </label>
              <textarea
                required
                placeholder="Rangkum secara singkat apa saja subtopik..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none text-sm font-medium"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                Tags (Pisah dengan Koma)
              </label>
              <input
                type="text"
                placeholder="Contoh: uts, aljabar, teknik"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Tombol */}
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