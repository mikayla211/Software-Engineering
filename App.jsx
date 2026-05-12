import { useState, useEffect, useMemo } from "react";

const INITIAL_DATA = [
  { id: 1, title: "Kalkulus Lanjut - Turunan Parsial", author: "Budi Santoso", category: "Matematika", rating: 4.8, views: 1250, uploadDate: "2024-03-15", description: "Catatan lengkap mengenai turunan parsial dan aplikasinya dalam optimasi multidimensi.", thumbnail: "https://picsum.photos/seed/math101/400/300", pages: 12, fileSize: "2.4 MB", comments: [{ user: "Sarah", text: "Sangat membantu buat persiapan kuis besok!", stars: 5 }] },
  { id: 2, title: "Sejarah Diplomasi Indonesia", author: "Siti Aminah", category: "HI", rating: 4.5, views: 890, uploadDate: "2024-03-20", description: "Rangkuman kebijakan luar negeri Indonesia era Orde Baru hingga Reformasi.", thumbnail: "https://picsum.photos/seed/history42/400/300", pages: 8, fileSize: "1.1 MB", comments: [] },
  { id: 3, title: "Algoritma & Struktur Data", author: "Raka Pratama", category: "Teknik Informatika", rating: 4.9, views: 3400, uploadDate: "2024-03-10", description: "Pembahasan mendalam tentang Array, Linked List, dan Binary Search Tree.", thumbnail: "https://picsum.photos/seed/code77/400/300", pages: 25, fileSize: "5.7 MB", comments: [{ user: "Budi", text: "Penjelasannya oke banget, gampang dimengerti.", stars: 5 }] },
  { id: 4, title: "Biologi Molekuler: Replikasi DNA", author: "Sarah Putri", category: "Biologi", rating: 4.2, views: 560, uploadDate: "2024-03-22", description: "Proses replikasi DNA secara ringkas dan disertai diagram alur.", thumbnail: "https://picsum.photos/seed/bio55/400/300", pages: 15, fileSize: "3.2 MB", comments: [] }
];

const CAT_COLOR = {
  "Matematika": { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
  "Teknik Informatika": { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  "HI": { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  "Biologi": { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  "Umum": { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

const CAT_BADGE = (cat) => {
  const c = CAT_COLOR[cat] || CAT_COLOR["Umum"];
  return { backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" };
};

export default function App() {
  const [view, setView] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState(INITIAL_DATA);
  const [bookmarkedIds, setBookmarkedIds] = useState([3]);
  const [myUploadIds] = useState([3, 4]);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Selamat Datang!", text: "Mulai cari materi atau bagikan catatanmu hari ini.", type: "system", time: "Baru saja", read: false },
    { id: 2, title: "Materi Populer", text: "Catatan Algoritma milikmu mencapai 3,000 views!", type: "info", time: "1 jam yang lalu", read: true },
  ]);
  const [commentText, setCommentText] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (searchTerm) setIsLoading(true);
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setIsLoading(false); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const results = useMemo(() => notes.filter(item =>
    item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [debouncedSearch, notes]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const addNotification = (title, text, type) => {
    setNotifications(prev => [{ id: Date.now(), title, text, type, time: "Baru saja", read: false }, ...prev]);
  };

  const toggleBookmark = (id, e) => {
    e?.stopPropagation();
    const isAdding = !bookmarkedIds.includes(id);
    setBookmarkedIds(prev => isAdding ? [...prev, id] : prev.filter(i => i !== id));
    const note = notes.find(n => n.id === id);
    if (isAdding) { addToast(`Tersimpan: ${note.title}`); addNotification("Berhasil Simpan", `Kamu menyimpan "${note.title}" ke koleksi.`, "bookmark"); }
    else addToast("Dihapus dari koleksi", "info");
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = { user: "Anda", text: commentText, stars: ratingInput };
    setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, comments: [newComment, ...n.comments] } : n));
    setSelectedNote(prev => ({ ...prev, comments: [newComment, ...prev.comments] }));
    setCommentText("");
    setRatingInput(5);
    addToast("Ulasan berhasil dikirim!");
    addNotification("Komentar Terkirim", `Kamu memberikan rating ${ratingInput} bintang pada "${selectedNote.title}".`, "comment");
  };

  const handleUploadDemo = () => {
    addToast("Catatan berhasil dipublikasikan!", "success");
    addNotification("Upload Berhasil", "Catatan baru kamu kini tersedia untuk publik.", "upload");
    setView("home");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const s = {
    wrap: { fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" },
    nav: { position: "sticky", top: 0, zIndex: 40, backgroundColor: "rgba(255,255,255,0.97)", borderBottom: "1px solid #f1f5f9", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(8px)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
    logoIcon: { backgroundColor: "#4f46e5", padding: "9px 11px", borderRadius: 12, fontSize: 13 },
    logoText: { fontSize: 22, fontWeight: 900, color: "#4f46e5", letterSpacing: "-1px" },
    navRight: { display: "flex", alignItems: "center", gap: 10 },
    navBtn: (active) => ({ background: active ? "#eef2ff" : "none", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 14, color: active ? "#4f46e5" : "#94a3b8", cursor: "pointer" }),
    bellBtn: (active) => ({ position: "relative", background: active ? "#eef2ff" : "none", border: "none", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#4f46e5" : "#94a3b8", cursor: "pointer", fontSize: 16 }),
    uploadBtn: { backgroundColor: "#4f46e5", color: "white", border: "none", padding: "9px 18px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(79,70,229,0.2)" },
    avatar: { width: 36, height: 36, borderRadius: "50%", border: "2px solid #e0e7ff", cursor: "pointer" },
    main: { flex: 1 },
    page: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px" },
    hero: { textAlign: "center", marginBottom: 48 },
    heroTitle: { fontSize: 36, fontWeight: 900, color: "#0f172a", marginBottom: 20, lineHeight: 1.2 },
    searchWrap: { position: "relative", maxWidth: 580, margin: "0 auto" },
    searchInput: { width: "100%", paddingLeft: 52, paddingRight: 20, paddingTop: 18, paddingBottom: 18, borderRadius: 24, backgroundColor: "white", border: "2px solid #f1f5f9", outline: "none", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
    searchIcon: { position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "#cbd5e1", fontSize: 15, pointerEvents: "none" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 },
    card: (hovered) => ({ backgroundColor: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all 0.25s", transform: hovered ? "translateY(-6px)" : "none", boxShadow: hovered ? "0 16px 48px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.04)" }),
    cardImgWrap: { position: "relative", height: 170, overflow: "hidden" },
    cardImg: (hovered) => ({ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: hovered ? "scale(1.07)" : "scale(1)" }),
    bookmarkBtn: (saved) => ({ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: saved ? "#4f46e5" : "rgba(255,255,255,0.92)", color: saved ? "white" : "#94a3b8", fontSize: 13, transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }),
    cardBody: { padding: 20 },
    cardTitle: (hovered) => ({ fontSize: 14, fontWeight: 800, color: hovered ? "#4f46e5" : "#0f172a", marginBottom: 8, transition: "color 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
    cardMeta: { display: "flex", gap: 12, fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 14 },
    cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f8fafc" },
    authorAvatar: { width: 24, height: 24, borderRadius: "50%", backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#6366f1" },
    arrowBtn: (hovered) => ({ width: 26, height: 26, borderRadius: 8, backgroundColor: hovered ? "#4f46e5" : "#f8fafc", color: hovered ? "white" : "#cbd5e1", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, transition: "all 0.2s" }),
    skeleton: { background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "loading 1.5s infinite", borderRadius: 8 },
    // Notification
    notifPage: { maxWidth: 720, margin: "0 auto", padding: "40px 24px" },
    notifHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 },
    notifTitle: { fontSize: 28, fontWeight: 900, color: "#0f172a", margin: 0 },
    markAllBtn: { color: "#4f46e5", fontWeight: 700, fontSize: 13, background: "none", border: "none", cursor: "pointer" },
    notifCard: (read) => ({ padding: 20, borderRadius: 20, border: `1px solid ${read ? "#f1f5f9" : "#c7d2fe"}`, backgroundColor: read ? "white" : "#eef2ff", opacity: read ? 0.75 : 1, display: "flex", gap: 16, marginBottom: 12, transition: "all 0.2s" }),
    notifIcon: (type) => {
      const map = { bookmark: ["#fef3c7", "#d97706"], upload: ["#d1fae5", "#059669"], comment: ["#e0e7ff", "#4f46e5"], system: ["#f1f5f9", "#64748b"], info: ["#f1f5f9", "#64748b"] };
      const [bg, color] = map[type] || map.info;
      return { width: 44, height: 44, borderRadius: 14, backgroundColor: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 };
    },
    notifIconEmoji: (type) => ({ bookmark: "🔖", upload: "☁️", comment: "💬", system: "🔔", info: "ℹ️" }[type] || "🔔"),
    // Upload
    uploadPage: { maxWidth: 560, margin: "0 auto", padding: "40px 24px" },
    uploadCard: { backgroundColor: "white", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9", padding: "48px 40px", textAlign: "center" },
    uploadIcon: { width: 72, height: 72, backgroundColor: "#eef2ff", color: "#4f46e5", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" },
    uploadSubmit: { width: "100%", padding: "16px 0", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: 16, fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 8px 24px rgba(79,70,229,0.2)", fontFamily: "inherit" },
    // Profile
    profilePage: { maxWidth: 900, margin: "0 auto", padding: "40px 24px", textAlign: "center" },
    profileAvatar: { width: 88, height: 88, borderRadius: "50%", border: "3px solid #e0e7ff", padding: 3, marginBottom: 12 },
    statNum: { fontSize: 30, fontWeight: 900, color: "#4f46e5", margin: 0 },
    statLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" },
    // Modal
    modalOverlay: { position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(15,23,42,0.82)", backdropFilter: "blur(6px)" },
    modalBox: { backgroundColor: "white", borderRadius: 28, width: "100%", maxWidth: 860, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.25)" },
    modalHeader: { padding: "28px 32px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    modalClose: { background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 20, lineHeight: 1, borderRadius: 8, padding: 6, transition: "color 0.2s" },
    modalBody: { flex: 1, overflowY: "auto", padding: "24px 32px 32px" },
    reviewBox: { backgroundColor: "#0f172a", color: "white", padding: 28, borderRadius: 24, marginBottom: 28 },
    commentInput: { flex: 1, backgroundColor: "#1e293b", color: "white", padding: "14px 16px", borderRadius: 14, border: "1px solid #334155", outline: "none", fontSize: 14, fontFamily: "inherit" },
    sendBtn: { backgroundColor: "#4f46e5", color: "white", border: "none", padding: "0 24px", borderRadius: 14, fontWeight: 900, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
    commentCard: { display: "flex", gap: 14, marginBottom: 14 },
    commentAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#eef2ff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#6366f1", fontSize: 15 },
    commentBody: { flex: 1, backgroundColor: "white", padding: "16px 20px", borderRadius: 20, border: "1px solid #f1f5f9" },
    modalFooter: { padding: "16px 32px", borderTop: "1px solid #f1f5f9", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", display: "flex", gap: 12 },
    dlBtn: { flex: 1, padding: "16px 0", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: 20, fontWeight: 900, cursor: "pointer", fontSize: 15, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(79,70,229,0.2)" },
    heartBtn: (saved) => ({ width: 56, height: 56, border: `2px solid ${saved ? "#fecaca" : "#e2e8f0"}`, borderRadius: 20, backgroundColor: saved ? "#fff1f2" : "white", color: saved ? "#e11d48" : "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, transition: "all 0.2s" }),
    // Toast
    toastWrap: { position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", gap: 8 },
    toast: (type) => ({ backgroundColor: type === "success" ? "#0f172a" : "#4f46e5", color: "white", padding: "12px 18px", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, animation: "slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)" }),
  };

  return (
    <div style={s.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes slideUp { from { transform: translateY(16px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => setView("home")}>
          <div style={s.logoIcon}>📌</div>
          <span style={s.logoText}>SCRIBO</span>
        </div>
        <div style={s.navRight}>
          <button style={s.navBtn(view === "home")} onClick={() => setView("home")}>Beranda</button>
          <button style={s.bellBtn(view === "notifications")} onClick={() => setView("notifications")}>
            🔔
            {unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 9, height: 9, backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid white" }} />}
          </button>
          <button style={s.uploadBtn} onClick={() => setView("upload")}>
            <span>+</span><span>Upload</span>
          </button>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Raka" style={s.avatar} onClick={() => setView("profile")} />
        </div>
      </nav>

      <main style={s.main}>
        {/* HOME */}
        {view === "home" && (
          <div style={s.page}>
            <div style={s.hero}>
              <h1 style={s.heroTitle}>Materi Kuliah dalam Genggaman</h1>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Cari mata kuliah atau topik..."
                  style={s.searchInput}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#f1f5f9"}
                />
              </div>
            </div>

            <div style={s.grid}>
              {isLoading ? Array(4).fill(0).map((_, i) => (
                <div key={i} style={{ backgroundColor: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                  <div style={{ height: 170, ...s.skeleton }} />
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ height: 16, width: "75%", ...s.skeleton }} />
                    <div style={{ height: 12, width: "100%", ...s.skeleton }} />
                  </div>
                </div>
              )) : results.map(note => (
                <div
                  key={note.id}
                  style={s.card(hoveredCard === note.id)}
                  onClick={() => setSelectedNote(note)}
                  onMouseEnter={() => setHoveredCard(note.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={s.cardImgWrap}>
                    <img src={note.thumbnail} style={s.cardImg(hoveredCard === note.id)} />
                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span style={CAT_BADGE(note.category)}>{note.category}</span>
                    </div>
                    <button style={s.bookmarkBtn(bookmarkedIds.includes(note.id))} onClick={e => toggleBookmark(note.id, e)}>
                      {bookmarkedIds.includes(note.id) ? "🔖" : "🏷"}
                    </button>
                  </div>
                  <div style={s.cardBody}>
                    <h3 style={s.cardTitle(hoveredCard === note.id)}>{note.title}</h3>
                    <div style={s.cardMeta}>
                      <span>⭐ {note.rating}</span>
                      <span>👁 {note.views.toLocaleString()}</span>
                      <span>📄 {note.pages}hlm</span>
                    </div>
                    <div style={s.cardFooter}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={s.authorAvatar}>{note.author[0]}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{note.author}</span>
                      </div>
                      <div style={s.arrowBtn(hoveredCard === note.id)}>→</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isLoading && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <h3 style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Tidak ditemukan</h3>
                <p style={{ color: "#94a3b8", marginTop: 4, fontSize: 14 }}>Coba kata kunci lain.</p>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {view === "notifications" && (
          <div style={s.notifPage}>
            <div style={s.notifHeader}>
              <h2 style={s.notifTitle}>Notifikasi</h2>
              <button style={s.markAllBtn} onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>Tandai sudah baca semua</button>
            </div>
            {notifications.map(notif => (
              <div key={notif.id} style={s.notifCard(notif.read)}>
                <div style={s.notifIcon(notif.type)}>{s.notifIconEmoji(notif.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{notif.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{notif.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{notif.text}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: "60px 0", fontWeight: 700 }}>Tidak ada notifikasi.</p>}
          </div>
        )}

        {/* UPLOAD */}
        {view === "upload" && (
          <div style={s.uploadPage}>
            <div style={s.uploadCard}>
              <div style={s.uploadIcon}>📤</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Upload Catatanmu</h2>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>Berikan kontribusi untuk memudahkan teman sejawat belajar. Setiap upload memberimu poin reputasi!</p>
              <button style={s.uploadSubmit} onClick={handleUploadDemo}>✅ Simulasi Upload Sukses</button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {view === "profile" && (
          <div style={s.profilePage}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Raka" style={s.profileAvatar} />
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Raka Pratama</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 28 }}>Pecinta Algoritma & Struktur Data</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
              <div style={{ cursor: "pointer" }} onClick={() => setView("home")}>
                <p style={s.statNum}>{myUploadIds.length}</p>
                <p style={s.statLabel}>Upload</p>
              </div>
              <div style={{ cursor: "pointer" }} onClick={() => setView("home")}>
                <p style={s.statNum}>{bookmarkedIds.length}</p>
                <p style={s.statLabel}>Bookmark</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL */}
      {selectedNote && (
        <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && setSelectedNote(null)}>
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <div>
                <span style={CAT_BADGE(selectedNote.category)}>{selectedNote.category}</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>{selectedNote.title}</h2>
              </div>
              <button style={s.modalClose} onClick={() => setSelectedNote(null)}>✕</button>
            </div>

            <div style={s.modalBody}>
              <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: 14, fontStyle: "italic", padding: "16px 20px", backgroundColor: "#f8fafc", borderRadius: 16, borderLeft: "4px solid #4f46e5", marginBottom: 24 }}>
                "{selectedNote.description}"
              </p>

              {/* Rating Input */}
              <div style={s.reviewBox}>
                <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>Bagaimana menurutmu materi ini?</h4>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRatingInput(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, color: ratingInput >= star ? "#fbbf24" : "#334155", transition: "transform 0.15s", transform: ratingInput >= star ? "scale(1.15)" : "scale(1)" }}>
                      {ratingInput >= star ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder="Tulis ulasan singkat..." style={s.commentInput} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddComment()} />
                  <button style={s.sendBtn} onClick={handleAddComment}>Kirim</button>
                </div>
              </div>

              {/* Comments */}
              <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                <span>Ulasan Mahasiswa</span>
                <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: "#f1f5f9", padding: "4px 12px", borderRadius: 99, color: "#64748b" }}>{selectedNote.comments.length} Komentar</span>
              </h4>

              {selectedNote.comments.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Belum ada ulasan. Jadilah yang pertama!</p>
              )}

              {selectedNote.comments.map((c, i) => (
                <div key={i} style={s.commentCard}>
                  <div style={s.commentAvatar}>{c.user[0]}</div>
                  <div style={s.commentBody}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>{c.user}</span>
                      <span style={{ fontSize: 12, color: "#fbbf24" }}>{"⭐".repeat(c.stars)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.modalFooter}>
              <button style={s.dlBtn} onClick={() => { setSelectedNote(null); addToast("Download dimulai!"); }}>
                ⬇ Unduh File PDF ({selectedNote.fileSize})
              </button>
              <button style={s.heartBtn(bookmarkedIds.includes(selectedNote.id))} onClick={e => toggleBookmark(selectedNote.id, e)}>
                {bookmarkedIds.includes(selectedNote.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div style={s.toastWrap}>
        {toasts.map(t => (
          <div key={t.id} style={s.toast(t.type)}>
            <span>{t.type === "success" ? "✅" : "ℹ️"}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  )};
