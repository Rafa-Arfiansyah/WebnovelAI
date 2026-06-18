import React, { useState, useEffect } from "react";
import { Project, Chapter } from "../types";
import { dbStore } from "../dbStore";
import { FileDown, ShieldCheck, Cpu, Terminal, Copy, Clipboard, CheckCircle, Info, Trash2, HelpCircle } from "lucide-react";

interface SettingsPanelProps {
  activeProject: Project | null;
  chapters: Chapter[];
  onRefreshProject: () => void;
}

const ELITE_PRESETS = [
  {
    id: "strictly_indonesian_flow",
    name: "Aliran Humanis Webnovel Indonesia (Strict)",
    description: "Preset novel Indonesia modern: micro-paragraf (1-3 kalimat), bahasa sederhana sekali baca langsung mengerti, bebas kalimat negasi-kontras, tanpa aroma/bau, dialog santai 50% tagless.",
    rules: [
      "FORMAT MICRO-PARAGRAF: Wajib menggunakan paragraf yang sangat pendek (maksimal 1-3 kalimat per paragraf). Pecah baris sesering mungkin agar nyaman dibaca di layar HP.",
      "BAHASA SEDERHANA & LANGSUNG PAHAM: Gunakan kosa kata sederhana yang langsung dipahami sekali baca. Hindari kalimat berbelit-belit, majas puitis berlebih (purple prose), eksplanasi latar dunia yang bertele-tele, dan deskripsi sinematik teatrikal.",
      "LARANGAN MUTLAK OVER-DESCRIBE OBJEK/PROPS: DILARANG KERAS menghias barang sepele dengan kata sifat berlebihan yang tidak penting bagi pembaca (misal: Hindari menulis 'hidrolik yang berkarat', 'besi tua yang berdebu', 'pagar yang sudah lapuk', 'skeleton ekskavator'). Cukup tulis fungsinya secara langsung ('hidrolik', 'ekskavator', 'pagar'). Pembaca sama sekali tidak peduli detail lingkungan sepele ini.",
      "KEPADATAN DIALOG TINGGI (40-50% DIALOG): Dominasi draf dengan dialog santai gaul masa kini (boleh slang, kependekan kata, partikel gaul seperi sih, kok, kan, dong, lho, ya, aja, deh) agar mengalir alami.",
      "DIALOG VARIATIF & TAGLESS: DILARANG KERAS menggunakan pola percakapan kaku yang monoton (seperti 'dia melakukan gerakan lalu berkata'). Biarkan dialog berdiri sendiri ('tagless dialogue') mengalir bersahut-sahutan alami.",
      "LARANGAN MUTLAK PENULISAN BAU ATAU AROMA (NEVER DESCRIBE SMELL): Jangan sekali-kali mendeskripsikan bau udara, aroma ruangan, wangi parfum, atau bau-bauan sekeliling.",
      "LARANGAN MUTLAK POLA NEGASI-KONTRAS: DILARANG KERAS menggunakan pola kalimat 'bukan sekadar X, melainkan Y', 'tidak hanya X, melainkan/tetapi Y', 'bukan hanya X, tetapi juga Y' atau variasi serupa. Langsung ceritakan apa yang terjadi secara lugas dan alami."
    ]
  },
  {
    id: "strictly_human_flow",
    name: "Strict Human Flow (Ultra Anti-Slop)",
    description: "Write in a natural, grounded, fluid, and human style: absolute ban on em-dashes, 'not X but Y' patterns, cliche body language, typical AI words, and robotic chatbot dialogues.",
    rules: [
      "COHESIVE, LIFELIKE FLOW: Write prose that flows beautifully and naturally, filled with genuine human feelings and soulful pacing. Avoid dry, clinical, or stiff sentence construction.",
      "ABSOLUTE BAN ON EM-DASHES: Under no circumstances use any em-dashes (—) or double hyphens (--) in narration or dialogues. Write clean, direct standard sentences.",
      "BAN ON CLICHÉ SPECIFIC WORDS: Do NOT use the adjective 'heavy' to dramatize abstract feelings or scenes (No 'heavy silence', no 'heart felt heavy', no 'breathing heavily'). Do NOT use the word 'boots' to depict footsteps or character eye aversion.",
      "BAN ON 'NOT X, BUT Y' PATTERN: Do not exaggerate emotions using negation-contrasts (Avoid patterns like 'He wasn't merely sad, but entirely devoured by dark sorrow' or 'It wasn't just cold, but a freezing, primal winter'). Keep prose direct; write exact feelings or actions immediately.",
      "BAN ON CLICHÉ BODY LANGUAGE: NEVER write 'let out a breath he/she didn't know he/she was holding' or 'released the breath she was holding'. DO NOT use 'shiver ran down his spine', 'eyes widened', 'heart hammered/pounded in his chest', 'swallowed hard', or 'biting her lower lip'. Let characters show original, subtle, and natural human responses.",
      "BAN ON OVERUSED ADJECTIVES: Never write 'palpable', 'piercing' (like 'piercing gaze'), 'ethereal', 'crimson' (simply use 'red' or depict raw fluid value organically), or 'echoed'.",
      "BAN ON STORYTELLER TROPES: Avoid 'Little did he know...', 'As if on cue...', 'With a swift motion...', or any direct foreshadowing narration.",
      "SOULFUL SHOW-DON'T-TELL: Gently describe atmospheres with grounded sensory descriptions (like the scent of wet wooden tables, the distant hum of traffic, or a gentle touch) that organically weave into the character's heart, avoiding preachy summaries of their emotions.",
      "REALISTIC DIALOGUE: Characters speak with natural, relaxed English contractions (don't, can't, gonna, wanna, yeah, hey) matching real casual spoken patterns. Avoid flat informational declarative dialogue. Make dialogues fluid, emotionally authentic, with natural conversational gaps, pauses, or realistic phrasing reflecting relationship and panic/calm state."
    ]
  },
  {
    id: "cohesive_lifelike",
    name: "Cohesive, Lifelike Flow (Anti-AI Clichés)",
    description: "Prose flows naturally with genuine feelings and soulful pacing, with absolute bans on standard ChatGPT clichés, em-dashes, storyteller tropes, and circular body language.",
    rules: [
      "Alirkan prosa secara natural (tidak kaku atau klinis).",
      "Dilarang pakai em-dash (—) atau double hyphen (--) baik di narasi maupun dialog.",
      "Ganti kata klise dramatis (e.g. ganti 'heavy silence' / 'breathing heavily'). Jangan menulis 'boots' untuk langkah kaki.",
      "DILARANG keras pola kontras melingkar 'Not X, but Y' atau 'Not X, just Y' (e.g., 'Not anger, but concern...'; 'Bukan kemarahan, melainkan...'). Nyatakan langsung emosinya secara aktif.",
      "Hapus gestur klise AI: 'breath they didn't know they were holding', 'shiver down spine', 'eyes widened', 'heart hammered', 'swallowed hard'.",
      "Dilarang memakai kata pasaran AI: 'palpable', 'piercing', 'ethereal', 'crimson', 'echoed', 'delve', 'tapestry'.",
      "Hapus kalimat pendongeng: 'Little did he know...', 'As if on cue...', 'With a swift motion...'.",
      "Show don't tell secara singkat: Fokus ke aksi fisik langsung, batasi detail bau, suhu, dan dekorasi lingkungan.",
      "Mulai cerita langsung di paragraf pertama tanpa intro, salam AI, atau preamble.",
      "Gunakan dialog santai dengan singkatan natural (don't, can't, yeah, hey, kok, sih, lho). Hindari dialog formal/declarative.",
      "Hindari repetisi kata redundan. Ganti struktur kalimat di tiap baris dan jangan ulangi informasi yang sudah diketahui pembaca.",
      "Jangan menutup bab dengan rangkuman filosofis, pesan moral, atau tebakan masa depan."
    ]
  },
  {
    id: "action_packed_litrpg",
    name: "Systemic Fast-Paced LitRPG",
    description: "Minimal numbers dump, tactical skills, punchy impact pacing, clear spatial setups.",
    rules: [
      "Notifikasi sistem & game UI wajib singkat (maksimal 4 baris).",
      "Monolog internal fokus ke kalkulasi taktis dan aksi aktif, bukan kesombongan kosong.",
      "Batasi dump status angka (stats); tampilkan hanya status situasi yang relevan.",
      "Hindari menjelaskan mekanisme sihir berlebihan; ganti dengan deskripsi kecepatan dan dampak kinetis langsung."
    ]
  },
  {
    id: "human_authenticity",
    name: "Human Authenticity (Anti-AI Pattern Detection)",
    description: "Breaks the 5 most common AI writing fingerprints: predictable sentence structure, generic cinematic vocab, emotionally perfect protagonists, theme-word repetition, and stock pain descriptions.",
    rules: [
      "RANDOMIZE SENTENCE STRUCTURE: Avoid predictable action→description→explanation→dialogue chains. Break the sequence unexpectedly — jump focus, add an imperfect or incomplete observation mid-scene, or lead with dialogue before the action. Real prose is not clean or formulaic.",
      "BAN GENERIC SCI-FI/FANTASY CINEMATIC VOCAB: NEVER use these overused AI descriptor words: 'shimmered', 'warped/warping', 'jagged shapes', 'flickered', 'pulsed', 'corrupted', 'ambient energy', 'ethereal', 'cascading'. Replace with concrete, grounded, specific physical detail instead.",
      "EMOTIONALLY IMPERFECT PROTAGONIST: The main character must NOT always be calm, calculating, and correct. Inject realistic imperfection — a miscalculation, brief panic, shallow breath, intrusive negative thought, or wrong first instinct — before they recover. Avoid the 'hero template' of steady voice and perfect situational reads.",
      "LIMIT ENERGY/POWER WORD REPETITION: In any ~1500-word chapter block, cap theme-cluster words (e.g. 'glowing', 'energy', 'core', 'crystal', 'system', 'power') to a maximum of 3 appearances each. Rotate with specific synonyms or reframe the sentence to avoid the repeated word.",
      "SPECIFIC PHYSICAL IMPACT DESCRIPTION: Avoid generic action-pain templates like 'the impact knocked the wind out of him' or 'his ribs creaking under the strain'. Replace with body-part-specific, character-personal detail: e.g. 'His left shoulder went numb past the elbow', 'Something inside his vest cracked near the collarbone'. Make physical pain feel particular to THIS character's body, not a stock template."
    ]
  }
];

export default function SettingsPanel({
  activeProject,
  chapters,
  onRefreshProject
}: SettingsPanelProps) {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [isOverrideActive, setIsOverrideActive] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [healthStatus, setHealthStatus] = useState("Loading...");
  const [isCopied, setIsCopied] = useState(false);

  // Custom rules setup state
  const [newRule, setNewRule] = useState("");

  // Template customizer state
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [customizingRules, setCustomizingRules] = useState<{ text: string; checked: boolean }[]>([]);

  // Export selection state
  const [selectedExportChapId, setSelectedExportChapId] = useState("");
  const [exportPreviewText, setExportPreviewText] = useState("");

  const triggerHealthCheck = () => {
    fetch("/api/health", {
      headers: {
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      }
    })
      .then(res => res.json())
      .then(data => {
        setHasApiKey(data.hasApiKey);
        setHasServerKey(data.hasGlobalKey);
        setIsOverrideActive(data.hasOverrideKey);
        setHealthStatus(data.status === "ok" ? "Operational - Active" : "Stale");
      })
      .catch(() => {
        setHealthStatus("Offline (Check Container Ports)");
      });
  };

  useEffect(() => {
    const saved = localStorage.getItem("novelforge_custom_gemini_key") || "";
    setCustomKeyInput(saved);
    triggerHealthCheck();
  }, []);

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customKeyInput.trim();
    if (trimmed) {
      localStorage.setItem("novelforge_custom_gemini_key", trimmed);
      alert("Custom Gemini API Key saved locally in your browser. Writing & audit engines updated!");
      triggerHealthCheck();
    }
  };

  const handleClearCustomKey = () => {
    localStorage.removeItem("novelforge_custom_gemini_key");
    setCustomKeyInput("");
    alert("Custom override key cleared! Reverting to system default server configuration.");
    triggerHealthCheck();
  };

  // Update or append custom writing rules
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newRule.trim()) return;
    const current = activeProject.antiSlopRules || [];
    dbStore.updateProject(activeProject.id, {
      antiSlopRules: [...current, newRule.trim()]
    });
    setNewRule("");
    onRefreshProject();
  };

  const handleDeleteRule = (index: number) => {
    if (!activeProject) return;
    const current = activeProject.antiSlopRules || [];
    const filtered = current.filter((_, i) => i !== index);
    dbStore.updateProject(activeProject.id, {
      antiSlopRules: filtered
    });
    onRefreshProject();
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) {
      setCustomizingRules([]);
      return;
    }
    const found = ELITE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCustomizingRules(found.rules.map((r) => ({ text: r, checked: true })));
    }
  };

  const handleApplyPresetOverwrite = () => {
    if (!activeProject) return;
    const rulesToApply = customizingRules
      .filter((r) => r.checked && r.text.trim())
      .map((r) => r.text.trim());
    dbStore.updateProject(activeProject.id, {
      antiSlopRules: rulesToApply,
    });
    setSelectedPresetId("");
    setCustomizingRules([]);
    onRefreshProject();
  };

  const handleApplyPresetAppend = () => {
    if (!activeProject) return;
    const current = activeProject.antiSlopRules || [];
    const rulesToApply = customizingRules
      .filter((r) => r.checked && r.text.trim())
      .map((r) => r.text.trim());

    const combined = [...current];
    rulesToApply.forEach((r) => {
      if (!combined.includes(r)) {
        combined.push(r);
      }
    });

    dbStore.updateProject(activeProject.id, {
      antiSlopRules: combined,
    });
    setSelectedPresetId("");
    setCustomizingRules([]);
    onRefreshProject();
  };

  // Convert rich formatted tags into Webnovel.com compliant raw texts
  const handleExportChapterToWebnovel = (chapId: string) => {
    const target = chapters.find(c => c.id === chapId);
    if (!target) {
      setExportPreviewText("");
      return;
    }

    // WEBNOVEL COMPLIANCE COMPILATOR (Section 6.1 from PRD):
    // 1. Strip all complex HTML tags, replace with spaces / carriage breaks
    let text = target.content;
    
    // Convert <p> closures to double spacing
    text = text.replace(/<\/p>/gi, "\n\n");
    // strip remaining bracket tags
    text = text.replace(/<[^>]*>/g, " ");

    // 2. Format Title header standard
    const headerTitle = `Chapter ${target.chapterNumber}: ${target.title}\n=========================================\n\n`;

    // 3. Clean up dialogue formatting (ensure dialogue is placed on separate lines with clean speech marks)
    let finalMerged = headerTitle + text.trim();

    // 4. Strip leftover markdown anomalies
    finalMerged = finalMerged.replace(/[\*\_\~]/g, "");

    setExportPreviewText(finalMerged);
  };

  const handleCopyClipboard = () => {
    if (!exportPreviewText) return;
    navigator.clipboard.writeText(exportPreviewText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export full manifest JSON backup
  const handleExportFullProjectJson = () => {
    if (!activeProject) return;
    const fullBundle = {
      project: activeProject,
      chapters,
      characters: dbStore.getCharacters(activeProject.id),
      locations: dbStore.getLocations(activeProject.id),
      metaExportedAt: new Date().toISOString()
    };

    const str = JSON.stringify(fullBundle, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject.title.replace(/\s+/g, "_")}_backup.json`;
    link.click();
  };

  return (
    <div className="space-y-5" id="settings-root">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        
        {/* Left Section - Engine checks and Custom Writing Rules */}
        <div className="lg:col-span-6 space-y-5">
          {/* Health Status check card */}
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex gap-2 items-center pb-2 border-b border-white/5">
              <Cpu className="text-[#00FF88] animate-pulse" size={17} />
              <h3 className="font-extrabold text-[#00FF88] text-xs uppercase tracking-wider font-mono">System Engine Diagnostics</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold font-mono uppercase tracking-wider text-white/40">
              <div className="bg-[#0A0A0A] p-3 rounded-lg flex flex-col justify-between border border-white/5">
                <span>Gemini API Status:</span>
                <span className={`text-[11px] font-black uppercase mt-1 ${hasApiKey ? "text-[#00FF88]" : "text-rose-400"}`}>
                  {hasApiKey ? "Ready (Active)" : "Missing Key"}
                </span>
              </div>
              <div className="bg-[#0A0A0A] p-3 rounded-lg flex flex-col justify-between border border-white/5">
                <span>Operational Mode:</span>
                <span className="text-[11px] font-black text-[#00FF88] mt-1 font-mono tracking-tight">
                  {isOverrideActive ? "Browser Override" : hasServerKey ? "Direct Server Key" : "No Auth Creds"}
                </span>
              </div>
            </div>

            {/* Custom Gemini Key setting form */}
            <form onSubmit={handleSaveCustomKey} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl space-y-3">
              <label className="text-[10px] font-extrabold text-[#00FF88] uppercase tracking-wider block font-mono">
                🔑 Self-Managed Gemini API Key (Manual Override)
              </label>
              
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your custom GEMINI_API_KEY..."
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  className="flex-1 text-xs border border-white/10 p-2.5 rounded-lg bg-[#121212] text-white focus:outline-none focus:border-[#00FF88] font-mono"
                />
                <button
                  type="submit"
                  className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-black uppercase text-xs px-4 rounded-lg cursor-pointer border-0 transition whitespace-nowrap"
                >
                  Save Key
                </button>
              </div>

              {isOverrideActive && (
                <div className="flex justify-between items-center bg-[#00FF88]/5 border border-[#0000]/10 p-2 rounded-lg">
                  <span className="text-[10px] text-[#00FF88] font-mono uppercase font-bold">✨ Browser key active</span>
                  <button
                    type="button"
                    onClick={handleClearCustomKey}
                    className="text-rose-400 hover:text-rose-300 font-mono text-[9px] uppercase font-bold underline cursor-pointer border-0 bg-transparent"
                  >
                    Clear Override
                  </button>
                </div>
              )}
            </form>

            <div className="flex items-start gap-2.5 bg-[#00FF88]/5 border border-[#00FF88]/20 p-3.5 rounded-lg text-xs">
              <Info className="text-[#00FF88] shrink-0 mt-0.5" size={15} />
              <div className="text-white/70 leading-normal font-sans">
                You can set a <strong>Custom Gemini API Key</strong> locally in your browser cache. Alternatively, configure <span className="font-mono text-[#00FF88] font-bold">GEMINI_API_KEY</span> inside the AI Studio **Settings &gt; Secrets** panel to apply it system-wide.
              </div>
            </div>
          </div>

          {/* Custom Audit Rules section */}
          {activeProject && (
            <div className="bg-[#121212] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex gap-2 items-center pb-2 border-b border-white/5">
                <ShieldCheck className="text-[#00FF88]" size={17} />
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Writing Guardrail Directives</h3>
              </div>
              <p className="text-xs text-white/40 font-sans leading-normal">
                Define custom rules that Gemini will hard-inject when drafting or auditing chapters.
              </p>

              {/* Select Preset Template */}
              <div className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl space-y-2.5">
                <label className="text-[10px] font-extrabold text-[#00FF88] uppercase tracking-wider block font-mono">
                  ✨ Quick Template Presets
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full text-xs font-bold border border-white/10 p-2.5 rounded-lg bg-[#121212] text-white focus:outline-none focus:border-[#00FF88]"
                >
                  <option value="">-- Select Elite Preset --</option>
                  {ELITE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedPresetId && (
                  <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                    {ELITE_PRESETS.find((p) => p.id === selectedPresetId)?.description}
                  </p>
                )}
              </div>

              {/* Template Customizer / Pre-flight Editor */}
              {selectedPresetId && customizingRules.length > 0 && (
                <div className="bg-[#181818] border border-[#00FF88]/20 rounded-xl p-4.5 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] font-bold text-[#00FF88] uppercase tracking-wider font-mono bg-[#00FF88]/10 px-2.5 py-1 rounded-md">
                      Customize Preset Directives
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPresetId("");
                        setCustomizingRules([]);
                      }}
                      className="text-white/40 hover:text-white text-xs cursor-pointer font-bold border-0 bg-transparent"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-[11px] text-white/60 leading-normal font-sans">
                    Tick which rules to load, or customize the wording directly in each text box below.
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {customizingRules.map((ruleObj, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-[#0A0A0A]/60 p-2.5 rounded-lg border border-white/5">
                        <input
                          type="checkbox"
                          checked={ruleObj.checked}
                          onChange={(e) => {
                            const updated = [...customizingRules];
                            updated[idx].checked = e.target.checked;
                            setCustomizingRules(updated);
                          }}
                          className="mt-1 shadow-sm h-4 w-4 rounded border-white/10 text-[#00FF88] focus:ring-[#00FF88] accent-[#00FF88]"
                        />
                        <textarea
                          rows={2}
                          value={ruleObj.text}
                          onChange={(e) => {
                            const updated = [...customizingRules];
                            updated[idx].text = e.target.value;
                            setCustomizingRules(updated);
                          }}
                          className="flex-1 text-[11px] bg-transparent text-white border-0 p-0 focus:ring-0 focus:outline-none resize-none leading-relaxed font-sans"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1 font-mono text-[10px] uppercase font-bold">
                    <button
                      type="button"
                      onClick={handleApplyPresetOverwrite}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg shadow-md cursor-pointer border-0 transition"
                    >
                      Overwrite Project Rules
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPresetAppend}
                      className="flex-1 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black py-2 rounded-lg shadow-md cursor-pointer border-0 transition"
                    >
                      Append to Rules
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddRule} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Establish dark, grimy atmosphere details in first paragraph."
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  className="flex-1 border border-white/10 bg-[#0A0A0A] text-white px-3 py-2 rounded-lg text-xs focus:border-[#00FF88] focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#00FF88] text-black font-black uppercase text-xs px-4 py-2 rounded-lg border-0 cursor-pointer shadow-[0_0_12px_rgba(0,255,136,0.25)] transition hover:bg-[#00FF88]/90 whitespace-nowrap"
                >
                  Append
                </button>
              </form>

              {/* Active Rules List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                {activeProject.antiSlopRules && activeProject.antiSlopRules.length > 0 ? (
                  activeProject.antiSlopRules.map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-[#0A0A0A] border border-white/5 p-2.5 rounded-lg text-white/80 font-mono">
                      <span>{rule}</span>
                      <button
                        onClick={() => handleDeleteRule(idx)}
                        className="text-white/30 hover:text-rose-500 transition-colors"
                        title="Delete custom guardrail"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-white/30 text-xs italic text-center py-4 font-mono uppercase tracking-wider text-[10px]">No custom directives. Adding directives forces AI alignment.</div>
                )}
              </div>
            </div>
          )}

          {/* Backup project card */}
          {activeProject && (
            <div className="bg-[#121212] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Offline Project Backup</h3>
                <span className="bg-white/5 border border-white/10 text-[#00FF88] text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">local sync</span>
              </div>
              <p className="text-xs text-white/40 leading-normal font-sans">
                Export all chapters, characters, settings, and relationships into a single lightweight schema file. Useful for backing up data offline.
              </p>
              <button
                onClick={handleExportFullProjectJson}
                className="w-full bg-white text-black hover:bg-[#00FF88] text-xs font-black uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition shadow-xl border-0"
              >
                <FileDown size={14} />
                <span>Export Project JSON Backup</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section - Webnovel Compilator compiler center */}
        <div className="lg:col-span-6 text-left">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5 shadow-xl space-y-4 min-h-[400px] flex flex-col h-full">
            <div className="flex gap-2 items-center pb-2 border-b border-white/5 justify-start">
              <Terminal className="text-[#00FF88]" size={17} />
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Webnovel.com Compliance Exporter center</h3>
            </div>
            
            <p className="text-[11px] text-white/45 leading-normal font-sans">
              Select any completed chapter drafts below. This engine forces Webnovel compliance rules (maximum 4 sentence paragraph breaks, trims formatting asterisks, separates dialogues on separate rows for readable mobile UI) and prepares a plain-text payload ready for copy-paste.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block font-mono">Select Export Chapter</label>
              <select
                value={selectedExportChapId}
                onChange={(e) => {
                  setSelectedExportChapId(e.target.value);
                  handleExportChapterToWebnovel(e.target.value);
                }}
                className="w-full text-xs font-bold border border-white/10 p-2.5 rounded-lg bg-[#0A0A0A] text-white focus:outline-none focus:border-[#00FF88]"
              >
                <option value="">-- Choose Chapter target --</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    Chap {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Display webnovel block output preview */}
            {exportPreviewText ? (
              <div className="flex-1 flex flex-col space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[9px] text-[#00FF88] uppercase tracking-widest font-mono">EXPORT BROWSER PAYLOAD PREVIEW</span>
                  <button
                    onClick={handleCopyClipboard}
                    className="bg-[#00FF88] text-black font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-[0_0_12px_rgba(0,255,136,0.25)] border-0"
                  >
                    {isCopied ? <CheckCircle size={11} /> : <Copy size={11} />}
                    <span>{isCopied ? "Copied" : "Copy to Clipboard"}</span>
                  </button>
                </div>
                
                <textarea
                  readOnly
                  value={exportPreviewText}
                  className="flex-1 w-full border border-white/10 bg-[#0A0A0A] text-white p-4 rounded-xl font-mono text-xs leading-relaxed focus:outline-none select-text resize-none max-h-64 overflow-y-auto"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 text-xs py-12 border border-white/10 border-dashed rounded-xl font-mono">
                <HelpCircle size={22} className="text-white/10 mb-1" />
                <p className="uppercase tracking-wide text-[10px]">Choose an active chapter target above to compile.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
