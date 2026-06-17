// src/config/constants.ts

// ─── AI Model Configuration ───────────────────
export const AI_MODEL = "gemini-3.5-flash";

// ─── Chapter Editor Tabs ───────────────────────
export const CHAPTER_EDITOR_TABS = {
  WRITE: "write",
  AUDIT: "audit",
  ISSUES: "issues",
  SNAPSHOTS: "snapshots",
} as const;

export type ChapterEditorTab = typeof CHAPTER_EDITOR_TABS[keyof typeof CHAPTER_EDITOR_TABS];

// ─── Chapter Generator Tabs ───────────────────
export const GENERATOR_TABS = {
  DRAFT: "draft",
  SETTINGS: "settings",
  CONTEXT: "context",
  MIMIC: "mimic",
} as const;

export type GeneratorTab = typeof GENERATOR_TABS[keyof typeof GENERATOR_TABS];

// ─── App Navigation Modules ───────────────────
export const APP_MODULES = {
  DASHBOARD: "dashboard",
  PLANNER: "planner",
  GENERATOR: "generator",
  EDITOR: "editor",
  BIBLE: "bible",
  SETTINGS: "settings",
} as const;

export type AppModule = typeof APP_MODULES[keyof typeof APP_MODULES];

// ─── Writing Presets ──────────────────────────
export const WRITING_PRESETS = [
  {
    name: "LitRPG Action Sequence",
    desc: "Fast pacing, dynamic skill triggers, minimal game stats blockades, high kinetic focus.",
  },
  {
    name: "Slow-burn Tactical Dialogue",
    desc: "Minimum 50% dialogue ratio, intense atmospheric silence, focus on tactical negotiation.",
  },
  {
    name: "Tactical Exposition & Leveling",
    desc: "Detailed description of spell architecture, systemic core ranks, zero purple prose.",
  },
  {
    name: "Brutal Boss Climax",
    desc: "High tension, heavy impacts, focus on protagonist plans breaking step-by-step.",
  },
] as const;

// ─── Tone Options ─────────────────────────────
export const TONE_OPTIONS = ["Gritty", "Adventurous", "Comedic"] as const;
export type ToneOption = typeof TONE_OPTIONS[number];

// ─── Word Count Limits ────────────────────────
export const WORD_COUNT_MIN = 500;
export const WORD_COUNT_MAX = 3000;
export const WORD_COUNT_STEP = 250;
export const WORD_COUNT_DEFAULT = 1500;
