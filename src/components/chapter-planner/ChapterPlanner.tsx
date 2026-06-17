import React, { useState } from "react";
import { Chapter, Beat, NovelGenre, ChapterStatus, TensionLevel, Character, Location } from "../../types";
import { dbStore, generateUUID } from "../../dbStore";
import { Plus, ListPlus, Edit, Eye, Trash2, Sliders, ChevronDown, Sparkles, BookOpen, MapPin, Activity, HelpCircle, Save } from "lucide-react";

interface ChapterPlannerProps {
  projectId: string;
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  onRefreshChapters: () => void;
}

export default function ChapterPlanner({
  projectId,
  chapters,
  characters,
  locations,
  onRefreshChapters
}: ChapterPlannerProps) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  
  // Create state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPOV, setNewPOV] = useState("Ryan Vance");
  const [newLocationId, setNewLocationId] = useState("");

  // AI Planner state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [arcSynopsis, setArcSynopsis] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResultText, setAiResultText] = useState("");

  // Anti-Slop Timeline Generator states
  const [showTimelineGenerator, setShowTimelineGenerator] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [generatedChapters, setGeneratedChapters] = useState<any[]>([]);
  const [clearExistingChapters, setClearExistingChapters] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Beat form editing state (for active chapter details)
  const [showBeatForm, setShowBeatForm] = useState(false);
  const [beatDescription, setBeatDescription] = useState("");
  const [beatTension, setBeatTension] = useState<TensionLevel>(TensionLevel.Medium);
  const [beatCharIds, setBeatCharIds] = useState<string[]>([]);

  const handleGenerateTimeline = async () => {
    setTimelineLoading(true);
    setTimelineError("");
    setGeneratedChapters([]);
    setLoadingStep("Reading World Bible cast indexes...");

    const steps = [
      "Analyzing World Bible characters and motivations...",
      "Mapping physical location landmarks and atmosphere...",
      "Fusing anti-slop guidelines...",
      "Slicing repetitive chapter pattern loops...",
      "Pacing asymmetric story arc tension...",
      "Ensuring cause-and-effect logical action flows...",
      "Assembling high-fidelity chapter beats payload..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStep(steps[stepIdx]);
      }
    }, 1800);

    const project = dbStore.getProjects().find(p => p.id === projectId);
    const genre = project?.genre || "Other";
    const synopsis = project?.synopsis || "";
    const rules = project?.antiSlopRules || [];

    try {
      const result = await dbStore.generateTimeline(characters, locations, genre, synopsis, rules);
      if (result && result.chapters) {
        setGeneratedChapters(result.chapters);
      } else {
        setTimelineError("Invalid response structure received from server.");
      }
    } catch (e: any) {
      setTimelineError(e.message || "Failed to generate timeline.");
    } finally {
      clearInterval(interval);
      setTimelineLoading(false);
    }
  };

  const handleCommitTimeline = () => {
    if (generatedChapters.length === 0) return;

    let baseChapterNumber = 1;
    let allChapters = dbStore.getChapters(projectId);

    if (clearExistingChapters) {
      allChapters.forEach(c => dbStore.deleteChapter(c.id));
      allChapters = [];
    } else {
      if (allChapters.length > 0) {
        baseChapterNumber = Math.max(...allChapters.map(c => c.chapterNumber)) + 1;
      }
    }

    generatedChapters.forEach((ch, idx) => {
      const created = dbStore.createChapter(
        projectId,
        ch.title,
        baseChapterNumber + idx,
        ch.pov || "Third Person",
        ch.locationId || undefined
      );

      if (ch.beats && Array.isArray(ch.beats)) {
        const mappedBeats = ch.beats.map((b: any, bIdx: number) => ({
          id: generateUUID(),
          order: bIdx + 1,
          description: b.description,
          characterIds: b.characterIds || [],
          tension: b.tension || TensionLevel.Medium
        }));
        dbStore.updateChapter(created.id, { 
          beats: mappedBeats,
          summary: ch.summary || ""
        });
      }
    });

    setShowTimelineGenerator(false);
    setGeneratedChapters([]);
    onRefreshChapters();
  };

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Next chapter number is max + 1
    const nextNum = chapters.length > 0 
      ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 
      : 1;

    dbStore.createChapter(
      projectId,
      newTitle.trim(),
      nextNum,
      newPOV.trim() || "Third Person",
      newLocationId || undefined
    );

    setShowCreateModal(false);
    setNewTitle("");
    onRefreshChapters();
  };

  const handleDeleteChapter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingChapterId(id);
  };

  const handleUpdateStatus = (id: string, status: ChapterStatus) => {
    dbStore.updateChapter(id, { status });
    onRefreshChapters();
  };

  // Add a major story plot beat to the current chapter
  const handleAddBeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChapter || !beatDescription.trim()) return;

    const newBeat: Beat = {
      id: generateUUID(),
      order: activeChapter.beats.length + 1,
      description: beatDescription.trim(),
      characterIds: beatCharIds,
      tension: beatTension
    };

    const updatedBeats = [...activeChapter.beats, newBeat];
    dbStore.updateChapter(activeChapter.id, { beats: updatedBeats });
    setBeatDescription("");
    setBeatCharIds([]);
    setBeatTension(TensionLevel.Medium);
    setShowBeatForm(false);
    onRefreshChapters();
  };

  // Remove a plot beat
  const handleDeleteBeat = (beatId: string) => {
    if (!activeChapter) return;
    const updatedBeats = activeChapter.beats
      .filter(b => b.id !== beatId)
      .map((b, index) => ({ ...b, order: index + 1 })); // fix ordered index layout

    dbStore.updateChapter(activeChapter.id, { beats: updatedBeats });
    onRefreshChapters();
  };

  // Call API for AI outline assistance
  const handleAiOutlineGenerate = async () => {
    if (!arcSynopsis.trim()) return;
    setAiGenerating(true);
    setAiResultText("");

    const systemInstruction = `You are a professional world-building coach and fantasy outline planner.
Given an Arc/Volume description, generate a detailed 3-chapter structural breakdown for a webnovel.
Each chapter MUST include:
1. "Chapter Title"
2. "Focus POV Character"
3. "Key Plot Beats" (provide 3 sequential, intensely paced bullet points outlining the action).
Output format should be structured and readable so the author can copy and paste or read details clearly. Keep prose concise. Ensure no purple prose or slop is used.`;

    const promptText = `Generate a 3-chapter layout based on this Arc/Volume synopsis:
"${arcSynopsis}"
Characters available in project: ${characters.map(c => `${c.name} (${c.powerLevel || "unranked"})`).join(", ") || "Ryan Vance"}.
Locations available in project: ${locations.map(l => l.name).join(", ") || "Shadow Quarry"}.`;

    try {
      let accumulated = "";
      await dbStore.generateChapterStream(
        promptText,
        systemInstruction,
        (chunk) => {
          accumulated += chunk;
          setAiResultText(accumulated);
        },
        () => {
          setAiGenerating(false);
        },
        (error) => {
          setAiResultText(`Error during outline generation: ${error}`);
          setAiGenerating(false);
        }
      );
    } catch {
      setAiGenerating(false);
    }
  };

  // Quick action: Import the AI generated chapters dummy
  const handleQuickImportAiDraft = () => {
    // Generate some structured mock parsed chapters from the text generated to help mock user
    const nextNumBase = chapters.length > 0 
      ? Math.max(...chapters.map(c => c.chapterNumber)) + 1 
      : 1;

    // Inject Chapter A
    dbStore.createChapter(projectId, "Awakening inside the Frost Crypt", nextNumBase, "Ryan Vance", locations[0]?.id);
    // Inject Chapter B
    dbStore.createChapter(projectId, "The Gray Frozen Spell", nextNumBase + 1, "Althea Gray", locations[0]?.id);

    setShowAiAssistant(false);
    setArcSynopsis("");
    setAiResultText("");
    onRefreshChapters();
    alert("Injected placeholder outline chapters based on generated theme!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="planner-root">
      {/* Sidebar with Chapters sequence */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex justify-between items-center bg-[#121212] border border-white/10 p-4 rounded-xl shadow-xl text-left">
          <div>
            <h2 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Manuscript Timeline</h2>
            <p className="text-[10px] text-white/40 font-mono text-left">{chapters.length} chapters total</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTimelineGenerator(true)}
              className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition duration-200"
              title="Auto-Generate Anti-Slop Timeline from World Bible"
              id="btn-timeline-gen-wizard"
            >
              <ListPlus size={14} className="animate-pulse" />
            </button>
            <button
              onClick={() => setShowAiAssistant(true)}
              className="p-2 bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 rounded-lg hover:bg-[#00FF88]/20 transition duration-200"
              title="AI Outline Planner"
            >
              <Sparkles size={14} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-white text-black rounded-lg hover:bg-[#00FF88] hover:text-black transition duration-200"
              title="Add New Chapter"
              id="btn-add-chapter-ui"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Chapter Card List */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1" id="chapter-cards-list">
          {chapters.length === 0 ? (
            <div className="bg-[#121212] border border-white/10 text-center py-10 px-4 rounded-xl space-y-3 text-left">
              <BookOpen size={20} className="mx-auto text-white/40" />
              <div className="space-y-1 text-center">
                <p className="text-white font-bold text-xs">No Chapters Drafted</p>
                <p className="text-white/40 text-[10px] leading-relaxed">
                  Click 'New Chapter' or try the 'AI Outline Assister' to automatically generate multiple chapter tracks!
                </p>
              </div>
            </div>
          ) : (
            chapters.map((ch) => {
              const locationName = locations.find(l => l.id === ch.locationId)?.name || "Not set";
              const isActive = ch.id === activeChapterId;
              
              return (
                <div
                  key={ch.id}
                  onClick={() => setActiveChapterId(ch.id)}
                  className={`bg-[#121212]/90 border rounded-xl p-4 shadow-xl transition-all duration-300 cursor-pointer relative hover:border-[#00FF88]/50 text-left ${
                    isActive ? "border-[#00FF88] ring-1 ring-[#00FF88] bg-[#00FF88]/5 shadow-[0_0_15px_rgba(0,255,136,0.1)]" : "border-white/10"
                  }`}
                  id={`chapter-card-box-${ch.id}`}
                >
                  {deletingChapterId === ch.id && (
                    <div 
                      className="absolute inset-0 bg-black/95 flex flex-col justify-center items-center p-3 z-20 text-center rounded-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-white text-[11px] font-bold font-sans mb-2 leading-snug">
                        Delete Chapter {ch.chapterNumber}?<br />
                        <span className="text-rose-500 font-medium text-[10px]">All associated beats will be lost.</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dbStore.deleteChapter(ch.id);
                            if (activeChapterId === ch.id) {
                              setActiveChapterId(null);
                            }
                            setDeletingChapterId(null);
                            onRefreshChapters();
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChapterId(null);
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold text-white/40 tracking-wider">
                      CHAPTER {ch.chapterNumber}
                    </span>

                    {/* Controls container */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ch.status}
                        onChange={(e) => handleUpdateStatus(ch.id, e.target.value as ChapterStatus)}
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border focus:outline-none cursor-pointer font-mono ${
                          ch.status === ChapterStatus.Planned ? "bg-white/5 text-white/60 border-white/10" :
                          ch.status === ChapterStatus.Draft ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          ch.status === ChapterStatus.Writing ? "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20" :
                          ch.status === ChapterStatus.Review ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                          "bg-emerald-500/10 text-[#00FF88] border-[#00FF88]/20"
                        }`}
                      >
                        {Object.values(ChapterStatus).map((st) => (
                          <option key={st} value={st} className="bg-[#121212] text-white">{st}</option>
                        ))}
                      </select>

                      <button
                        onClick={(e) => handleDeleteChapter(ch.id, e)}
                        className="text-white/40 hover:text-rose-500 p-1.5 rounded bg-white/5 hover:bg-rose-500/10 transition"
                        title="Delete chapter"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-white text-xs mt-1.5 leading-tight line-clamp-1 block group-hover:text-[#00FF88] transition-colors">
                    {ch.title}
                  </h4>

                  {/* Badges */}
                  <div className="flex gap-4 mt-3 text-[10px] text-white/40 font-mono uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Sliders size={10} className="text-white/30" />
                      <span>POV: <span className="font-bold text-white/70">{ch.pov}</span></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ListPlus size={10} className="text-white/30" />
                      <span>{ch.beats.length} beats</span>
                    </div>
                  </div>

                  {ch.wordCount > 0 && (
                    <div className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-[#00FF88] tracking-tight bg-[#00FF88]/10 px-1.5 py-0.5 rounded border border-[#00FF88]/10">
                      {ch.wordCount} words
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor detailed configuration panel */}
      <div className="lg:col-span-8 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-h-[50vh] text-left">
        {!activeChapter ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-3">
            <div className="w-16 h-16 bg-[#0A0A0A] border border-white/10 rounded-full flex items-center justify-center text-white/40">
              <HelpCircle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white font-sans text-sm uppercase tracking-wider">No Chapter Selected</h3>
              <p className="text-white/40 text-xs max-w-sm text-center">
                Select an existing chapter from the timeline sidebar on the left to edit its detail, structure location, POV target, and story pacing beats.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-200" id="planner-detail-panel">
            {/* Header details bar */}
            <div className="border-b border-white/5 p-5 bg-[#0D0D0D] flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#00FF88] uppercase font-mono">
                  CHAPTER {activeChapter.chapterNumber} STRUCTURE
                </span>
                <h3 className="text-lg font-black font-sans text-white tracking-tight leading-tight mt-0.5">
                  {activeChapter.title}
                </h3>
              </div>
            </div>

            {/* Quick config fields */}
            <div className="p-5 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block">POV Character</label>
                <select
                  value={activeChapter.pov}
                  onChange={(e) => {
                    dbStore.updateChapter(activeChapter.id, { pov: e.target.value });
                    onRefreshChapters();
                  }}
                  className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white p-2.5 rounded-lg focus:border-[#00FF88] outline-none transition-all cursor-pointer font-mono"
                >
                  <option value="Third Person" className="bg-[#121212] text-white">Third Person</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.name} className="bg-[#121212] text-white">{char.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block">Dungeon Location</label>
                <select
                  value={activeChapter.locationId || ""}
                  onChange={(e) => {
                    dbStore.updateChapter(activeChapter.id, { locationId: e.target.value || undefined });
                    onRefreshChapters();
                  }}
                  className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white p-2.5 rounded-lg focus:border-[#00FF88] outline-none transition-all cursor-pointer font-mono"
                >
                  <option value="" className="bg-[#121212] text-white">-- Select World Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#121212] text-white">{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pacing beats section */}
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider italic">Sequential Plot Beats</h4>
                  <p className="text-[10px] text-white/40 leading-normal">Pacing points that the AI chapter generator will write out in order.</p>
                </div>
                <button
                  onClick={() => setShowBeatForm(!showBeatForm)}
                  className="bg-[#00FF88] text-black font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#00FF88]/90 transition duration-200 cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Insert Beat</span>
                </button>
              </div>

              {/* Add Beat Sub Form */}
              {showBeatForm && (
                <form onSubmit={handleAddBeat} className="bg-[#0A0A0A] border border-white/10 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono block">Beat Plot Action</label>
                    <textarea
                      required
                      placeholder="Describe what happens. e.g., Ryan encounters Althea Gray by the crystalline nodes. She points her sapphire wand, demanding he explain how he survived the blast."
                      rows={2}
                      value={beatDescription}
                      onChange={(e) => setBeatDescription(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 text-white rounded-lg p-2.5 text-xs focus:border-[#00FF88] outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono block">Tension Level</label>
                      <select
                        value={beatTension}
                        onChange={(e) => setBeatTension(e.target.value as TensionLevel)}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg p-2 text-xs focus:border-[#00FF88] outline-none"
                      >
                        {Object.values(TensionLevel).map((ten) => (
                          <option key={ten} value={ten} className="bg-[#121212] text-white">{ten} Tension</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono block block">Involved Cast</label>
                      <div className="border border-white/10 bg-[#121212] p-2 rounded-lg h-24 overflow-y-auto space-y-1 flex flex-col justify-start">
                        {characters.map((ch) => (
                          <label key={ch.id} className="inline-flex items-center gap-2 text-xs text-white/70 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={beatCharIds.includes(ch.id)}
                              onChange={(e) => {
                                  if (e.target.checked) setBeatCharIds([...beatCharIds, ch.id]);
                                  else setBeatCharIds(beatCharIds.filter(id => id !== ch.id));
                              }}
                              className="rounded border-white/10 text-[#00FF88] focus:ring-[#00FF88]/40 bg-transparent"
                            />
                            <span>{ch.name}</span>
                          </label>
                        ))}
                        {characters.length === 0 && (
                          <span className="text-[10px] text-white/30 italic">No world bible characters created yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowBeatForm(false)}
                      className="border border-white/15 text-white/60 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#00FF88] hover:bg-[#00FF88]/95 text-black text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-lg shadow-sm"
                    >
                      Save Beat
                    </button>
                  </div>
                </form>
              )}

              {/* Display List of Beats */}
              <div className="space-y-3">
                {activeChapter.beats.length === 0 ? (
                  <div className="bg-[#121212] border border-white/10 border-dashed rounded-xl p-8 text-center text-white/40 text-xs text-center font-medium leading-relaxed">
                    No sequential beats defined for this chapter yet. Adding beats allows Gemini to draft scenes contextually. Click 'Insert Beat' to begin.
                  </div>
                ) : (
                  activeChapter.beats
                    .sort((a,b) => a.order - b.order)
                    .map((b, idx) => {
                      const involvedCast = characters.filter(c => b.characterIds.includes(c.id));
                      return (
                        <div key={b.id} className="border border-white/10 rounded-xl p-4 flex gap-4 bg-[#0A0A0A] relative group shadow-xl">
                          {/* Bullet order marker */}
                          <div className="w-6 h-6 rounded-md bg-white/5 border border-white/15 flex items-center justify-center font-mono font-black text-xs text-[#00FF88] shrink-0">
                            {idx + 1}
                          </div>

                          <div className="space-y-2 flex-1 pr-6 text-left">
                            <p className="text-xs text-white/80 leading-relaxed font-sans font-medium">
                              {b.description}
                            </p>

                            {/* Involved Cast tags & Tension tag */}
                            <div className="flex gap-2 flex-wrap items-center pt-1.5">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                b.tension === TensionLevel.Low ? "bg-white/5 text-white/50 border border-white/10" :
                                b.tension === TensionLevel.Medium ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                b.tension === TensionLevel.High ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}>
                                <Activity size={10} />
                                <span>{b.tension} Pacing</span>
                              </span>

                              {involvedCast.map(c => (
                                <span key={c.id} className="bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteBeat(b.id)}
                            className="absolute right-3 top-3 text-white/30 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                            title="Delete plot beat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Dialog Drawer */}
      {showAiAssistant && (
        <div className="fixed inset-0 bg-[#050505]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-2xl border border-white/10 shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150 relative text-left">
            <button
              onClick={() => {
                setShowAiAssistant(false);
                setArcSynopsis("");
                setAiResultText("");
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-[#00FF88] font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Sparkles className="text-[#00FF88] animate-pulse" size={20} />
              <h3 className="font-extrabold text-white text-base uppercase tracking-wider font-sans italic">AI Arc & Outline Assistant</h3>
            </div>

            <p className="text-white/50 text-xs leading-relaxed font-sans font-medium">
              Input a synopsis of your next major arc. Our anti-slop Gemini generator will compile a structured 3-chapter manuscript plan complete with action beats.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block text-left">Arc Synopsis & Direction</label>
                <textarea
                  placeholder="e.g. Volume 2 of Solo Sovereign: Ryan ventures into the Level-3 Frostlands to extract cryo-shards. However, he is caught by a Conglomerate mage raid led by Althea Gray. They must form a temporary alliance to survive a mutated behemoth."
                  rows={3}
                  value={arcSynopsis}
                  onChange={(e) => setArcSynopsis(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 text-white rounded-lg p-2.5 text-xs focus:border-[#00FF88] outline-none resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleAiOutlineGenerate}
                disabled={aiGenerating || !arcSynopsis.trim()}
                className="w-full bg-[#00FF88] hover:bg-[#00FF88]/95 disabled:bg-white/10 text-black font-black uppercase tracking-wide text-xs py-2.5 rounded-lg border border-[#00FF88]/20 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
              >
                {aiGenerating ? "Plotting Outline Stream..." : "Generate 3-Chapter Outline Concepts"}
              </button>

              {aiResultText && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#0D0D0D] border border-white/10 px-3 py-1.5 rounded-lg">
                    <span className="text-[9px] font-bold text-[#00FF88] font-mono tracking-widest uppercase">GENERATED MANUSCRIPT DETAILS</span>
                    {!aiGenerating && (
                      <button
                        onClick={handleQuickImportAiDraft}
                        className="bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-black text-[10px] uppercase tracking-tight px-2.5 py-1 rounded-md transition-colors"
                      >
                        Accept & Import Chapters
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-white/5 bg-[#050505] p-4 rounded-xl font-mono text-xs text-left leading-relaxed text-white/80 whitespace-pre-wrap">
                    {aiResultText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Anti-Slop Timeline Generator Modal */}
      {showTimelineGenerator && (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#121212] rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left my-8">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-400 animate-pulse" size={18} />
                <h3 className="font-extrabold text-white text-base uppercase tracking-wider font-sans italic">
                  Complete Manuscript Timeline Generator
                </h3>
              </div>
              <button 
                onClick={() => {
                  if (!timelineLoading) {
                    setShowTimelineGenerator(false);
                    setGeneratedChapters([]);
                  }
                }}
                className="text-white/40 hover:text-purple-400 font-bold px-2 py-1"
                disabled={timelineLoading}
              >
                ✕
              </button>
            </div>

            <p className="text-white/60 text-xs leading-relaxed font-sans">
              Curate an incredible 5-chapter story sequence completely grounded on your World Bible. Our specialized prompt constraints guarantee zero repetitive AI-slop, establishing organic pacing variance, logical character cause-effect planning, and distinct chapter beats.
            </p>

            {/* Quick Bible Stats / Hints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0A0A0A] p-3.5 border border-white/5 rounded-xl text-left">
              <div className="text-xs space-y-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">World Bible Ingredients</span>
                <div className="flex gap-4 font-mono text-white/80 font-bold">
                  <span>🎭 Characters: <strong className="text-purple-400">{characters.length}</strong></span>
                  <span>🗺️ Locations: <strong className="text-purple-400">{locations.length}</strong></span>
                </div>
              </div>
              {(characters.length === 0 || locations.length === 0) && (
                <div className="text-[10px] text-amber-400/90 flex items-start gap-1 font-sans">
                  <span>💡 Pro-tip: populate your Characters and Locations sheets with details so the engine can fuse, bind and reference exact entries in the chapters!</span>
                </div>
              )}
            </div>

            {/* Error banner */}
            {timelineError && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-rose-300 text-xs font-mono">
                🛑 Error: {timelineError}
              </div>
            )}

            {/* Generation state tracker */}
            {timelineLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="text-white/80 font-mono text-xs font-bold uppercase tracking-wider animate-pulse">{loadingStep}</p>
                  <p className="text-white/40 text-[10px] font-mono">Anti-Slop constraints processing via gemini-3.5-flash...</p>
                </div>
              </div>
            ) : generatedChapters.length === 0 ? (
              <div className="space-y-4">
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Active Story Rules Preview</div>
                <div className="bg-[#050505] p-3.5 border border-white/5 rounded-xl space-y-2 text-xs font-mono text-white/75">
                  <p>📖 Genre: <span className="text-[#00FF88] font-bold">{dbStore.getProjects().find(p => p.id === projectId)?.genre || "Fantasy / Adventure"}</span></p>
                  <div>
                    <span className="block mb-1 text-white/40 uppercase text-[9px] tracking-wide">Crucial Rules Active:</span>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-white/60">
                      <li>Asymmetric tension dynamics (no cloned beats patterns)</li>
                      <li>Strict cause-and-effect logical bounds</li>
                      <li>Mobile web-novel formatting parameters</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleGenerateTimeline}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition cursor-pointer"
                >
                  ✨ Trigger High-Fidelity Sequence Generation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">5 Chapters Generated</span>
                  <button
                    onClick={handleGenerateTimeline}
                    className="text-[10px] text-white/50 hover:text-purple-400 font-bold flex items-center gap-1 uppercase tracking-tight"
                  >
                    🔄 Regenerate List
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {generatedChapters.map((ch, idx) => {
                    const locName = locations.find(l => l.id === ch.locationId)?.name || "World Arena / Context Setting";
                    return (
                      <div key={idx} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl space-y-2 relative text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/5 pb-2">
                          <h4 className="font-extrabold text-[#00FF88] text-xs font-sans">
                            Chapter {idx + 1}: {ch.title}
                          </h4>
                          <div className="flex items-center gap-2 font-mono text-[9px] text-white/45">
                            <span>POV: <strong className="text-purple-300">{ch.pov}</strong></span>
                            <span>|</span>
                            <span>📍 {locName}</span>
                          </div>
                        </div>

                        <p className="text-white/70 text-[11px] leading-relaxed font-sans font-medium italic">
                          "{ch.summary}"
                        </p>

                        <div className="pt-1.5 space-y-1.5">
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider font-mono">Plot Beats Sequence:</span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {(ch.beats || []).map((b: any, bIdx: number) => (
                              <div key={bIdx} className="bg-[#121212] p-2 rounded-lg text-[10px] text-white/80 leading-normal flex justify-between items-start gap-3">
                                <span>
                                  <strong className="text-[#00FF88]">{bIdx + 1}.</strong> {b.description}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  b.tension === "Climax" ? "bg-rose-500/20 text-rose-400" :
                                  b.tension === "High" ? "bg-amber-500/20 text-amber-400" :
                                  "bg-blue-500/20 text-blue-400"
                                }`}>
                                  {b.tension}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Integration Options */}
                <div className="bg-[#0A0A0A] border border-white/5 p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="opt-clear-manuscript"
                      checked={clearExistingChapters}
                      onChange={(e) => setClearExistingChapters(e.target.checked)}
                      className="accent-purple-500 h-3.5 w-3.5 cursor-pointer rounded bg-[#121212] border border-white/10"
                    />
                    <label htmlFor="opt-clear-manuscript" className="font-bold text-white/75 cursor-pointer font-sans select-none text-[11px]">
                      Replace existing timeline (Clear current chapter records)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
                    Default: Append to the end
                  </span>
                </div>

                {/* Final Confirm Toolbar */}
                <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setGeneratedChapters([]);
                      setShowTimelineGenerator(false);
                    }}
                    className="px-4 py-2 border border-white/15 text-white/60 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommitTimeline}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-xs rounded-lg shadow-md transition"
                  >
                    Confirm & Inject Chapters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapter Creation Standard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#050505]/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] rounded-2xl border border-white/10 shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-extrabold text-white text-base uppercase tracking-wider italic font-sans">New Chapter Draft</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-[#00FF88] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block text-left">Chapter Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shadows in the Frozen Quarry"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:border-[#00FF88] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block text-left">Chapter POV Character</label>
                <input
                  type="text"
                  placeholder="e.g. Ryan Vance"
                  value={newPOV}
                  onChange={(e) => setNewPOV(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:border-[#00FF88] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono block text-left">Initial Location (Optional)</label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:border-[#00FF88] outline-none transition-all cursor-pointer font-mono"
                >
                  <option value="" className="bg-[#121212] text-white">-- No Location Linked --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[#121212] text-white">{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-white/15 text-white/60 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00FF88] hover:bg-[#00FF88]/95 text-black font-black uppercase tracking-wider text-xs rounded-lg shadow-sm"
                >
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
