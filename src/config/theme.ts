// src/config/theme.ts
// Single source of truth for all repeating styles and color schemes.

export const COLORS = {
  accent: "#00FF88",
  accentCyan: "#00D1FF",
  bg: {
    base: "#050505",
    card: "#121212",
    surface: "#0A0A0A",
    header: "#0D0D0D",
  },
  severity: {
    High: "text-rose-400",
    Medium: "text-amber-400",
    Low: "text-white/40",
  },
  category: {
    PurpleProse: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    Adverb: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    Cliché: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    Pacing: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    Default: "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20",
  },
} as const;

// Shared tailwind className strings across elements
export const CX = {
  card: "bg-[#121212] border border-white/10 rounded-2xl shadow-xl",
  input: "w-full border border-white/10 bg-[#0A0A0A] text-white rounded-xl px-3 py-2 text-xs focus:border-[#00FF88] outline-none transition-all",
  label: "text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono block",
  btnPrimary: "bg-[#00FF88] text-black font-black uppercase text-xs rounded-xl cursor-pointer border-0 transition hover:bg-[#00FF88]/90 shadow-[0_4px_12px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:cursor-not-allowed",
  btnGhost: "border border-white/15 text-white/60 rounded-xl font-bold uppercase tracking-wider hover:bg-white/5 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed",
  badge: "font-mono text-[9px] px-2 py-0.5 rounded-full font-bold",
  sectionTitle: "font-extrabold text-white text-xs uppercase tracking-wider font-mono",
} as const;
