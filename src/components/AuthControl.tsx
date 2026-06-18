import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../config/firebase";
import { firebaseStore } from "../firebaseStore";
import { 
  User as UserIcon, LogIn, LogOut, Key, CheckCircle, 
  AlertCircle, Cloud, RefreshCw, Sparkles, X, ShieldAlert, Chrome
} from "lucide-react";

interface AuthControlProps {
  onRefreshAllData: () => void;
  onSelectProjectId: (id: string | null) => void;
}

export function AuthControl({ onRefreshAllData, onSelectProjectId }: AuthControlProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "error">("idle");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Track authentication state changes and online/offline status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && navigator.onLine) {
        // Automatically load and sync their manuscript drafts when they login
        await syncDataFromCloud(currentUser.uid);
      } else {
        // If they sign out, refresh view back to local storage
        onRefreshAllData();
      }
    });

    const handleOnline = () => {
      setIsOnline(true);
      if (auth.currentUser) {
        syncDataFromCloud(auth.currentUser.uid);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncDataFromCloud = async (userId: string) => {
    setSyncing(true);
    setSyncStatus("idle");
    try {
      // 1. Bi-directionally sync local and cloud data
      await firebaseStore.syncAllFromCloud(userId);

      // 3. Trigger parent to refresh state
      onRefreshAllData();

      setSyncStatus("synced");
    } catch (err: any) {
      console.error("Cloud synchronization failed:", err);
      setSyncStatus("error");
    } finally {
      setSyncing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setIsModalOpen(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Firebase auth error details:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Email atau kata sandi (password) tidak valid. Harap periksa kembali.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Alamat email ini sudah terdaftar. Silakan beralih ke pilihan 'Masuk Di Sini' di bawah.");
      } else if (err.code === "auth/weak-password") {
        setError("Kata sandi terlalu pendek. Masukkan minimal 6 karakter.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Provider 'Email/Password' belum diaktifkan di Console Firebase Anda. Harap buka Firebase Console -> Authentication -> Sign-in Method, lalu aktifkan provider 'Email/Password'. Sebagai alternatif instan, silakan gunakan tombol 'Masuk dengan Google' di bawah.");
      } else {
        setError(err.message || "Gagal melakukan autentikasi sistem.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Google sign in error details:", err);
      setError(err.message || "Gagal masuk menggunakan Akun Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar? Naskah lokal akan tetap aman di peramban ini.")) {
      try {
        await signOut(auth);
        setSyncStatus("idle");
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  return (
    <div className="relative" id="auth-panel">
      {/* Current User Display Row in Navigation Sidebar */}
      {!user ? (
        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-tight text-[#00FF88] border border-[#00FF88]/20 bg-[#00FF88]/5 hover:bg-[#00FF88]/15 cursor-pointer transition-all duration-300"
          id="btn-sidebar-login"
        >
          <div className="flex items-center gap-2">
            <LogIn size={14} className="animate-pulse" />
            <span>Masuk Akun / Cloud</span>
          </div>
          <span className="text-[9px] bg-[#00FF88]/10 text-[#00FF88] px-1.5 py-0.5 rounded-md border border-[#00FF88]/30 font-mono">OFFLINE</span>
        </button>
      ) : (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-left space-y-2.5 shadow-md" id="sidebar-user-card">
          <div className="flex items-center gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00FF88] to-blue-500 flex items-center justify-center font-black text-black text-xs font-mono">
              {user.email ? user.email.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/50 font-mono font-bold uppercase tracking-wider">Aktivasi Cloud</p>
              <p className="text-xs text-white font-semibold truncate hover:text-white transition-colors" title={user.email || ""}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-2">
            <div className="flex items-center gap-1.5">
              {!isOnline ? (
                <>
                  <ShieldAlert size={12} className="text-amber-400 animate-pulse" />
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400/90">
                    Offline (Lokal)
                  </span>
                </>
              ) : (
                <>
                  {syncing ? (
                    <RefreshCw size={12} className="animate-spin text-[#00FF88]" />
                  ) : (
                    <Cloud size={12} className="text-emerald-400" />
                  )}
                  <span className="font-mono text-[10px] uppercase font-bold text-white/60">
                    {syncing ? "Sinkronisasi..." : syncStatus === "synced" ? "Tersimpan" : "Sinkron"}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-[#FF4A4A] hover:text-[#FF6B6B] flex items-center gap-1 hover:underline font-bold transition-all cursor-pointer uppercase text-[9px]"
              title="Logout"
              id="btn-sidebar-logout"
            >
              <LogOut size={10} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Auth Form Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200" id="auth-modal-dialog">
          <div className="bg-[#0D0D0D] border border-white/15 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-[#00FF88]/5 flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#121212]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-tr from-[#00FF88] to-blue-500 rounded-lg"></div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white font-sans tracking-tight">MANUSCRIPT SYNC STATE</h3>
                  <p className="text-[9px] text-[#00FF88] font-mono font-bold tracking-wider">NOVELFORGE CLOUD INTERFACE</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                title="Tutup"
                id="btn-close-auth-modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAuth} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-white/60">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="masukkan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 hover:border-white/20 focus:border-[#00FF88] focus:outline-none p-3 rounded-lg text-sm transition-colors text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase font-bold text-white/60">Sandi Akun (Password)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#151515] border border-white/10 hover:border-white/20 focus:border-[#00FF88] focus:outline-none p-3 rounded-lg text-sm transition-colors text-white font-medium"
                />
              </div>

              {!isOnline && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2 items-start text-xs text-amber-400 rounded-lg">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-pulse text-amber-400" />
                  <div>
                    <strong className="block font-bold uppercase tracking-wider text-[10px] mb-0.5">Offline Mode</strong>
                    <span>Koneksi internet terputus. Silakan hubungkan kembali internet Anda untuk melakukan sinkronisasi cloud. Menulis lokal tetap aktif.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg flex gap-2 items-start text-xs text-rose-400 font-medium">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Toggle action button */}
              <button
                type="submit"
                disabled={loading || !isOnline}
                className="w-full py-3 bg-[#00FF88] hover:bg-[#00E577] disabled:bg-white/5 disabled:text-white/30 disabled:border-white/5 disabled:shadow-none disabled:cursor-not-allowed text-black font-black uppercase text-xs tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00FF88]/20"
                id="btn-submit-auth"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Key size={14} />
                    <span>{mode === "login" ? "Masuk ke Writing Suite" : "Daftarkan Akun Baru"}</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="px-3 text-[9px] uppercase font-mono font-bold text-white/30">Atau</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Google Sign In option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || !isOnline}
                className="w-full py-3 bg-white/5 hover:bg-white/10 hover:text-[#00FF88] disabled:bg-white/5 disabled:text-white/30 disabled:border-white/5 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
                id="btn-google-auth"
              >
                <Chrome size={14} className="animate-pulse" />
                <span>Masuk dengan Google (Instan)</span>
              </button>

              <div className="border-t border-white/5 pt-4 text-center">
                {mode === "login" ? (
                  <p className="text-xs text-white/40">
                    Belum punya akun cloud?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode("signup");
                      }}
                      className="text-[#00FF88] font-bold hover:underline cursor-pointer"
                    >
                      Daftar Baru
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-white/40">
                    Sudah punya akun writing suite?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode("login");
                      }}
                      className="text-[#00FF88] font-bold hover:underline cursor-pointer"
                    >
                      Masuk Di Sini
                    </button>
                  </p>
                )}
              </div>
            </form>

            {/* Cloud banner sync information */}
            <div className="bg-white/[0.02] p-5 border-t border-white/10 text-xs text-white/50 space-y-1.5 leading-relaxed text-left">
              <div className="flex items-center gap-1.5 font-bold text-[#00FF88] uppercase tracking-wide text-[10px]">
                <Sparkles size={11} />
                <span>Teknologi Auto-Cloud Sync</span>
              </div>
              <p>Setiap suntingan naskah, karakter, plot beat, dan pengaturan gaya penulisan Anda akan secara otomatis ter-upload dan tersimpan di server cloud setelah Anda masuk.</p>
            </div>

          </div>
        </div>,
        document.getElementById("root") || document.body
      )}
    </div>
  );
}
