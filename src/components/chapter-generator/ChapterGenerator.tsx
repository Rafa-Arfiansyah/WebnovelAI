import React, { useState, useEffect } from "react";
import { Chapter, Character, Location, ChapterStatus } from "../../types";
import { dbStore } from "../../dbStore";
import { buildChapterGenerationPrompt, buildChapterSystemInstruction } from "../../config/ai-prompts";
import { 
  Sparkles, Sliders, Play, AlertCircle, RefreshCw, Layers, 
  ShieldCheck, FileText, ArrowRight, Eye, Settings, Terminal, 
  CheckCircle, HelpCircle, ChevronDown, ChevronUp, Feather
} from "lucide-react";

interface ChapterGeneratorProps {
  projectId: string;
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  selectedChapterId: string | null;
  onSelectChapterId: (id: string) => void;
  onRefreshChapters: () => void;
  onNavigateToModule: (module: string) => void;
}

export default function ChapterGenerator({
  projectId,
  chapters,
  characters,
  locations,
  selectedChapterId,
  onSelectChapterId,
  onRefreshChapters,
  onNavigateToModule
}: ChapterGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"draft" | "settings" | "context" | "mimic">("draft");
  const [activePreset, setActivePreset] = useState("LitRPG Action Sequence");
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [toneAdjustment, setToneAdjustment] = useState<"Gritty" | "Adventurous" | "Comedic">("Adventurous");
  const [wordCountTarget, setWordCountTarget] = useState(1500);
  const [customInst, setCustomInst] = useState("");

  const [mimicStyleText, setMimicStyleText] = useState(() => {
    const project = dbStore.getProjects().find(p => p.id === projectId);
    return project?.styleReferenceText || "";
  });

  useEffect(() => {
    const project = dbStore.getProjects().find(p => p.id === projectId);
    setMimicStyleText(project?.styleReferenceText || "");
  }, [projectId]);

  const handleSaveMimicStyle = (text: string) => {
    setMimicStyleText(text);
    dbStore.updateProject(projectId, { styleReferenceText: text });
    onRefreshChapters();
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [apiError, setApiError] = useState("");

  const activeChapter = chapters.find(c => c.id === selectedChapterId);

  // Active Context calculations
  const chapterLocation = locations.find(l => l.id === activeChapter?.locationId);
  const coreBeats = activeChapter?.beats || [];
  
  // Characters involved in chapter beats
  const involvedCharIds = Array.from(new Set(coreBeats.flatMap(b => b.characterIds)));
  const involvedCharacters = characters.filter(c => involvedCharIds.includes(c.id));

  const presets = [
    {
      name: "LitRPG Action Sequence",
      desc: "Fast pacing, dynamic skill triggers, minimal game stats blockades, high kinetic focus."
    },
    {
      name: "Slow-burn Tactical Dialogue",
      desc: "Minimum 50% dialogue ratio, intense atmospheric silence, focus on tactical negotiation."
    },
    {
      name: "Tactical Exposition & Leveling",
      desc: "Detailed description of spell architecture modifications, systemic core ranks, zero purple prose."
    },
    {
      name: "Brutal Boss Climax",
      desc: "High tension, heavy impacts, focus on protagonist Ryan Vance plans breaking step-by-step."
    }
  ];

  // Helper to compile final structured prompt instructions to send to the Gemini server
  const compileFinalPrompt = (): string => {
    if (!activeChapter) return "";

    const precedingChapters = chapters
      .filter(c => c.chapterNumber < activeChapter.chapterNumber)
      .sort((a,b) => b.chapterNumber - a.chapterNumber) // descending
      .slice(0, 2);

    return buildChapterGenerationPrompt({
      chapter: {
        ...activeChapter,
        beats: coreBeats
      },
      characters: involvedCharacters,
      location: chapterLocation,
      precedingChapters,
      wordCountTarget,
      toneAdjustment,
      customInst,
      projectRules: dbStore.getProjects().find(p => p.id === projectId)?.antiSlopRules || [],
      mimicStyleText
    });
  };

  const handleGenerate = async () => {
    if (!activeChapter) return;
    setIsGenerating(true);
    setApiError("");
    setStreamedContent("");

    const project = dbStore.getProjects().find(p => p.id === projectId);
    const rawRules = project?.antiSlopRules || [];

    const instructionRules = buildChapterSystemInstruction(
      activeChapter.chapterNumber,
      toneAdjustment,
      rawRules,
      mimicStyleText
    );

    const promptText = compileFinalPrompt();

    try {
      let accumulated = "";
      await dbStore.generateChapterStream(
        promptText,
        instructionRules,
        (chunk) => {
          accumulated += chunk;
          setStreamedContent(accumulated);
        },
        async () => {
          setIsGenerating(false);
          // Auto-save generated content to local storage
          dbStore.updateChapter(activeChapter.id, {
            content: accumulated,
            status: ChapterStatus.Draft
          });

          // GEN-07: Trigger auto-generating chapter summary in background
          try {
            const summaryInst = "Convert this webnovel chapter into a highly concise 2-sentence summary tracking Ryan Vance's structural status and plot progression. Return ONLY the two sentences.";
            const resSummary = await dbStore.polishText(accumulated, summaryInst, activePreset);
            if (resSummary !== accumulated) {
              dbStore.updateChapter(activeChapter.id, { summary: resSummary });
            }
          } catch (e) {
            console.error("Summary gen warning:", e);
          }

          onRefreshChapters();
        },
        (error) => {
          setApiError(error);
          setIsGenerating(false);
        }
      );
    } catch {
      setIsGenerating(false);
    }
  };

  const handleApplyDraft = () => {
    if (!activeChapter || !streamedContent) return;
    dbStore.updateChapter(activeChapter.id, {
      content: streamedContent
    });
    onRefreshChapters();
    onNavigateToModule("editor");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="generator-root">
      
      {/* 1. Header Segment Ribbon (Sub-navbar) spanning full width */}
      <div className="lg:col-span-12">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xl mb-2">
          {/* Target manuscript chapter choice dropdown */}
          <div className="flex items-center gap-2.5">
            <span className="text-white/40 text-[10px] font-bold uppercase font-mono tracking-wider whitespace-nowrap">Chapter Target:</span>
            <select
              value={selectedChapterId || ""}
              onChange={(e) => onSelectChapterId(e.target.value)}
              className="font-bold text-xs border border-white/10 p-2 px-3 rounded-xl bg-[#0A0A0A] text-white focus:outline-none focus:border-[#00FF88] cursor-pointer"
            >
              <option value="">-- Choose Chapter target --</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Chap {ch.chapterNumber}: {ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Elegant top tabs dividing features inside Chapter Generator */}
          <div className="flex border border-white/10 bg-[#0A0A0A] rounded-xl p-1 text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab("draft")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "draft"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Sparkles size={13} />
              <span>Draft Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Sliders size={13} />
              <span>Crafting Tuning</span>
            </button>
            <button
              onClick={() => setActiveTab("context")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "context"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Layers size={13} />
              <span>Context Aggregator</span>
              {activeChapter && (
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-bold font-mono ${
                  activeTab === "context" ? "bg-black/15 text-black" : "bg-white/10 text-white"
                }`}>
                  {(chapterLocation ? 1 : 0) + (coreBeats.length > 0 ? 1 : 0) + (involvedCharacters.length > 0 ? 1 : 0)}/3
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("mimic")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "mimic"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Feather size={13} />
              <span>Mimic Style</span>
              {mimicStyleText.trim() && (
                <span className={`text-[9.5px] rounded-full px-1.5 py-0.5 font-bold font-mono ${
                  activeTab === "mimic" ? "bg-black/15 text-black" : "bg-[#00D1FF]/10 text-[#00D1FF]"
                }`}>
                  Active
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Workspace Body */}
      <div className="lg:col-span-12">
        {!selectedChapterId ? (
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl flex flex-col items-center justify-center space-y-4">
            <HelpCircle size={40} className="text-white/10" />
            <div className="space-y-1">
              <p className="text-white/60 font-semibold text-sm uppercase font-mono tracking-wider">No Target Chapter Chosen</p>
              <p className="text-white/30 text-xs font-mono">Select a target chapter in the top left navbar or dropdown target selector to start.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB CONTENT: 📋 Context Aggregator */}
            {activeTab === "context" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {/* 1. World Location Setting */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl text-left">
                  <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]"></span>
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">1. World Location setting</h4>
                  </div>
                  {chapterLocation ? (
                    <div className="space-y-3">
                      <div className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-[#00FF88] font-mono block uppercase">Active Zone name</span>
                        <div className="font-bold text-sm text-white mt-1">{chapterLocation.name}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase font-mono tracking-widest">Environmental Essence & Atmosphere</span>
                        <p className="text-xs text-white/70 bg-[#0A0A0A] p-3 rounded-xl leading-relaxed border border-white/5 italic">
                          "{chapterLocation.atmosphere}"
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase font-mono tracking-widest">Geography Features & Layout</span>
                        <p className="text-xs text-white/60 bg-[#0A0A0A] p-3 rounded-xl leading-relaxed border border-white/5">
                          {chapterLocation.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 bg-amber-400/5 p-4 rounded-xl border border-amber-400/10 italic font-mono space-y-1">
                      <div>No active dungeon zone setting linked.</div>
                      <div className="text-[10px] text-white/35 font-sans not-italic leading-relaxed">
                        Navigate to the "Chapter Planner" and allocate a setting sector to supply organic environmental rules and spatial constraints to the linesmith generator.
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Procedural Outline Progress */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl text-left">
                  <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]"></span>
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">2. Outline Beats ({coreBeats.length})</h4>
                  </div>
                  {coreBeats.length > 0 ? (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {coreBeats.map((b, i) => (
                        <div key={b.id} className="text-xs bg-[#0A0A0A] border border-white/5 rounded-xl p-3 leading-relaxed text-white/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-[#00FF88] font-mono uppercase tracking-wider text-[10px]">Beat {i+1}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded font-mono ${
                              b.tension === "High" ? "bg-rose-500/10 text-rose-300 border border-rose-500/20" :
                              b.tension === "Medium" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                              "bg-white/5 text-white/40"
                            }`}>
                              {b.tension} Pacing
                            </span>
                          </div>
                          <p className="text-white/70 text-[11px] font-sans pr-1">{b.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 bg-amber-400/5 p-4 rounded-xl border border-amber-400/10 italic font-mono space-y-1">
                      <div>No outline beats configured.</div>
                      <div className="text-[10px] text-white/35 font-sans not-italic leading-relaxed">
                        Chapters write best when you sequence beat blocks inside the Chapter Planner. Without beats, Gemini will construct logical actions blindly.
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Cast Context Aggregation */}
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-xl text-left">
                  <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]"></span>
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">3. Tracked Scene Cast</h4>
                  </div>
                  {involvedCharacters.length > 0 ? (
                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {involvedCharacters.map((c) => (
                        <div key={c.id} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-xl space-y-1.5 text-left text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{c.name}</span>
                            <span className="text-[9px] text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded font-mono font-bold">
                              {c.powerLevel || "unranked"}
                            </span>
                          </div>
                          {c.appearance && (
                            <div className="text-[10px] text-white/50 leading-normal line-clamp-2">
                              {c.appearance}
                            </div>
                          )}
                          {c.arcGoal && (
                            <div className="text-[10px] text-[#00FF88]/70 italic leading-relaxed border-t border-white/5 pt-1">
                              Goal: {c.arcGoal}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="text-xs text-white/50 bg-[#0A0A0A] border border-white/5 p-3.5 rounded-xl leading-normal">
                        <span className="font-bold text-[#00FF88] block font-mono uppercase tracking-wider text-[10px]">Default POV focus</span>
                        <p className="mt-1">Involved cast calculated from outline beats. Currently tracking POV standard actor, <strong className="text-white">Ryan Vance</strong>.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ✒️ Mimic Style Reference */}
            {activeTab === "mimic" && (
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl text-left max-w-4xl mx-auto animate-in fade-in duration-200">
                <div className="flex gap-2 items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Feather size={16} className="text-[#00FF88]" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-white">
                      Author Style Mimicking Engine
                    </h3>
                  </div>
                  <span className="bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/25 font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Execution Mimic v2.0
                  </span>
                </div>

                <div className="space-y-3.5 text-xs text-white/70 leading-relaxed font-sans">
                  <p className="text-white text-sm font-semibold">
                    Paste a reference passage or chapter from an author below to configure style replication.
                  </p>
                  <p className="text-white/50 text-[11px] leading-relaxed">
                    Unlike standard "tone presets," this option extracts raw mechanical cues: sentence length distribution, vocabulary complexity, the Indonesian/English slang blends, how details are paced, and how characters are voiced.
                  </p>

                  <div className="bg-[#0A0A0A] p-4 rounded-xl border border-white/5 space-y-2 font-mono text-[10px] text-white/65">
                    <span className="text-[#00FF88] font-black uppercase text-[11px] block">💡 PRO STYLE TIPS FOR MAXIMUM REPLICATION:</span>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-white/50">
                      <li>Paste a block of <span className="text-white">1,000 to 2,000 words</span> of pristine, pre-edited prose representing your target style.</li>
                      <li>Ensures the reference has a mixture of active narration blocks as well as character dialogue.</li>
                      <li>This enforces physical chapter construction, slang keywords, punctuation habits, and phrasing patterns directly into the writing core.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-white/45 uppercase tracking-wider font-mono">
                      Target Passage / Style Reference Manuscript
                    </label>
                    <span className="text-white/40 text-[10px] font-mono">
                      Character Count: <strong className="text-white font-bold">{mimicStyleText.length}</strong>
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    placeholder="Paste the reference chapter/passage here (e.g. detailed paragraphs of active fighting sequences, high-pacing dialogues, typical slang structures, or unique prose)..."
                    value={mimicStyleText}
                    onChange={(e) => handleSaveMimicStyle(e.target.value)}
                    className="w-full border border-white/10 bg-[#0A0A0A] text-white rounded-2xl px-4 py-3.5 text-xs font-mono focus:ring-1 focus:outline-none focus:ring-[#00FF88] focus:border-[#00FF88] leading-relaxed shadow-inner placeholder-white/20 resize-none min-h-[300px]"
                  />
                </div>

                <div className="flex justify-between items-center bg-[#0A0A0A] border border-white/5 rounded-xl p-4.5">
                  <div className="text-[11px] text-white/40 leading-normal max-w-xl">
                    {mimicStyleText.trim() ? (
                      <span className="text-[#00FF88] font-bold">✔️ Style reference active.</span>
                    ) : (
                      <span className="text-amber-400 font-bold">⚠️ No sample loaded.</span>
                    )}
                    <span> Style metrics will automatically inject into system instruction blocks when pushing stream compilation draft generations.</span>
                  </div>
                  {mimicStyleText.trim() && (
                    <button
                      onClick={() => handleSaveMimicStyle("")}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition cursor-pointer"
                    >
                      Clear Reference
                    </button>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab("draft")}
                    className="bg-[#00FF88] text-black font-black uppercase text-xs px-5 py-3 rounded-xl shadow-[0_4px_14px_rgba(0,255,136,0.25)] flex items-center gap-1.5 cursor-pointer leading-tight border-0 transition duration-200 hover:opacity-95 text-center"
                  >
                    <span>Proceed to draft Canvas</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 🎛️ Crafting Settings */}
            {activeTab === "settings" && (
              <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl text-left max-w-4xl mx-auto animate-in fade-in duration-200">
                <div className="flex gap-2 items-center justify-start pb-2.5 border-b border-white/5">
                  <Sliders size={16} className="text-[#00FF88]" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-white">
                    Anti-Slop Crafting parameters
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  {/* STYLE PRESET DRAPDOWN */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">
                      1. Style Preset / AI Writing Persona
                    </label>
                    
                    {/* CUSTOM PREMIUM SELECT DROPDOWN */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                        className="w-full text-xs font-semibold border border-white/10 bg-[#0A0A0A] text-white p-3 px-4 rounded-xl focus:outline-none focus:border-[#00FF88] flex justify-between items-center cursor-pointer transition-all duration-200"
                        id="custom-preset-select-btn"
                      >
                        <div className="text-left">
                          <span className="font-bold text-[#00FF88]">{activePreset}</span>
                          <span className="text-[10px] text-white/40 block font-normal leading-normal font-sans">
                            {presets.find(p => p.name === activePreset)?.desc}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 shrink-0 ml-4 ${isPresetDropdownOpen ? "rotate-180 text-[#00FF88]" : ""}`} />
                      </button>

                      {isPresetDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsPresetDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-40 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1.5 duration-150">
                            {presets.map((p) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => {
                                  setActivePreset(p.name);
                                  setIsPresetDropdownOpen(false);
                                }}
                                className={`w-full text-left p-3.5 px-4 text-xs border-b border-white/5 last:border-b-0 hover:bg-[#00FF88]/10 hover:text-[#00FF88] transition-colors flex flex-col cursor-pointer ${
                                  activePreset === p.name ? "bg-[#00FF88]/15 text-[#00FF88] font-bold" : "text-white/80"
                                }`}
                              >
                                <span className="font-bold text-xs">{p.name}</span>
                                <span className={`text-[10px] leading-relaxed mt-1 font-normal font-sans ${activePreset === p.name ? "text-white/60" : "text-white/40"}`}>{p.desc}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PACING VIBE SELECTOR BUTTON GROUP */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono block mb-1">
                      2. Pacing Vibe Level: <span className="text-[#00FF88] font-black">{toneAdjustment}</span>
                    </label>
                    <div className="flex flex-col sm:flex-row border border-white/10 bg-[#0A0A0A] rounded-xl p-1.5 text-xs font-semibold gap-2 shadow-inner">
                      {(["Gritty", "Adventurous", "Comedic"] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setToneAdjustment(t)}
                          className={`flex-1 py-2 px-3 text-2xs sm:text-xs font-black uppercase rounded-lg cursor-pointer transition-all duration-200 text-center whitespace-nowrap border-0 ${
                            toneAdjustment === t 
                              ? "bg-[#00FF88] text-black shadow-[0_4px_12px_rgba(0,255,136,0.25)] font-black" 
                              : "text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WORDCOUNT LIMIT SLIDER */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">
                        3. Target Chapter Length limit
                      </label>
                      <span className="text-[#00FF88] font-black text-xs font-mono bg-[#00FF88]/10 px-2 rounded-md py-0.5 border border-[#00FF88]/10">
                        {wordCountTarget} words
                      </span>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3.5 flex items-center gap-6 shadow-inner">
                      <span className="text-[10px] text-white/30 font-mono">500w</span>
                      <input
                        type="range"
                        min={500}
                        max={3000}
                        step={250}
                        value={wordCountTarget}
                        onChange={(e) => setWordCountTarget(parseInt(e.target.value))}
                        className="flex-1 accent-[#00FF88] h-1.5 bg-white/5 rounded-lg cursor-pointer transition-colors"
                      />
                      <span className="text-[10px] text-white/30 font-mono">3000w</span>
                    </div>
                  </div>

                  {/* CUSTOM WRITE REMINDERS */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">
                      4. Custom Director / Novelist Specific Reminders
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Focus on Althea Gray's extreme suspicion of Ryan's newly awakened core."
                      value={customInst}
                      onChange={(e) => setCustomInst(e.target.value)}
                      className="w-full border border-white/10 bg-[#0A0A0A] text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:outline-none focus:ring-[#00FF88] focus:border-[#00FF88] p-3 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => setActiveTab("draft")}
                    className="bg-[#00FF88] text-black font-black uppercase text-xs px-4 py-2.5 rounded-xl shadow-[0_0_12px_rgba(0,255,136,0.2)] flex items-center gap-1.5 cursor-pointer leading-tight border-0 transition"
                  >
                    <span>Proceed to draft Canvas</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ✍️ Workspace Drafting Canvas */}
            {activeTab === "draft" && (
              <div className="bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[60vh] text-left animate-in fade-in duration-200">
                
                {/* Embedded shield rules banner */}
                <div className="p-4 bg-[#0A0A0A]/50 border-b border-white/5">
                  <div className="bg-[#00FF88]/5 border border-[#000000]/0 light:border-0 dark:border-[#00FF88]/20 p-3.5 rounded-xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(0,255,136,0.03)]">
                    <ShieldCheck size={16} className="text-[#00FF88] shrink-0 mt-0.5" />
                    <div className="text-[10.5px] text-white/70 leading-normal font-sans">
                      <span className="font-bold text-white uppercase tracking-wider text-[9px] font-mono mr-1">Suite Writing Guard Enforced:</span> Dynamically applying your customized writing guard filters, user-defined rules, style mimic guidelines, and tone presets using the model <span className="font-mono text-[#00FF88] font-bold">gemini-3.5-flash</span>.
                    </div>
                  </div>
                </div>

                {apiError && (
                  <div className="p-4 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-2 text-rose-300 text-xs text-left">
                    <AlertCircle size={15} className="shrink-0 text-rose-400" />
                    <div>
                      <span className="font-bold">Generation Error: </span> {apiError}
                    </div>
                  </div>
                )}

                {/* Streaming output body */}
                <div className="flex-1 p-6 relative overflow-y-auto max-h-[60vh] min-h-[350px] leading-relaxed select-text select-all">
                  {streamedContent ? (
                    <div className="prose max-w-none text-white/90 text-sm leading-relaxed space-y-4 font-normal font-sans tracking-wide">
                      <div dangerouslySetInnerHTML={{ __html: streamedContent }} />
                      {isGenerating && (
                        <span className="inline-block w-2.5 h-4 bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse ml-1 align-middle"></span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-white/30 text-xs font-mono space-y-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-full text-white/50 animate-pulse">
                        <Sparkles size={22} className="text-[#00FF88]" />
                      </div>
                      <div className="max-w-md space-y-1">
                        <p className="font-bold text-white uppercase font-mono tracking-widest text-[10px]">Canvas empty and ready</p>
                        <p className="font-sans text-[11px] text-white/40 leading-relaxed">
                          Ready to draft Chapter "{activeChapter.title}" with POV {activeChapter.pov}. Adjust presets or instructions on the other tabs if you want, and click "Engage Generation Stream" to begin linesmithing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lower Action bar */}
                <div className="border-t border-white/5 p-3.5 bg-[#0D0D0D]/90 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {streamedContent ? (
                      <span>Generated Wordcount: <strong className="text-[#00FF88] font-bold">{streamedContent.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length}</strong> / {wordCountTarget} words</span>
                    ) : (
                      <span>Context assembly completes on stream.</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-[#00FF88] text-black font-black uppercase text-xs px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:bg-[#00FF88]/90 flex items-center gap-1.5 cursor-pointer border-0 transition-all duration-300 disabled:opacity-50"
                      id="btn-engage-stream"
                    >
                      {isGenerating ? <RefreshCw className="animate-spin text-black" size={14} /> : <Play size={14} />}
                      <span>{isGenerating ? "Streaming Chapter..." : "Engage Generation Stream"}</span>
                    </button>

                    {streamedContent && !isGenerating && (
                      <button
                        onClick={handleApplyDraft}
                        className="bg-white text-black hover:bg-[#00FF88] hover:text-black font-black uppercase text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer border-0 transition-all duration-300"
                        id="btn-apply-draft"
                      >
                        <span>Apply & Open Editor</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

