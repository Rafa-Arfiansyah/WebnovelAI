import React, { useState, useEffect } from "react";
import { Character, Location } from "../../types";
import { dbStore } from "../../dbStore";
import { 
  Plus, Trash2, HelpCircle, Users, MapPin, 
  Sparkles, BookOpen 
} from "lucide-react";

import PremiseSection from "./PremiseSection";
import CharacterSection from "./CharacterSection";
import LocationSection from "./LocationSection";

interface WorldBibleProps {
  projectId: string;
  characters: Character[];
  locations: Location[];
  onRefreshBible: () => void;
}

export default function WorldBible({
  projectId,
  characters,
  locations,
  onRefreshBible
}: WorldBibleProps) {
  const [activeTab, setActiveTab] = useState<"premise" | "characters" | "locations" | any>("premise");
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  const [deletingCharId, setDeletingCharId] = useState<string | null>(null);
  const [deletingLocId, setDeletingLocId] = useState<string | null>(null);

  // AI states
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Premise states
  const project = dbStore.getProjects().find(p => p.id === projectId);
  const [projectSynopsis, setProjectSynopsis] = useState(project?.synopsis || "");

  useEffect(() => {
    const proj = dbStore.getProjects().find(p => p.id === projectId);
    setProjectSynopsis(proj?.synopsis || "");
    setSelectedCharId(null);
    setSelectedLocId(null);
    setDeletingCharId(null);
    setDeletingLocId(null);
  }, [projectId]);

  const handleSavePremise = () => {
    if (!projectId) return;
    dbStore.updateProject(projectId, { synopsis: projectSynopsis });
    alert("Main Novel Premise updated successfully in manuscript state!");
  };

  const handleGenerateCharAI = async () => {
    setIsGeneratingAI(true);
    try {
      const existingNames = characters.map(c => c.name);
      const res = await fetch("/api/generate-character", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
        },
        body: JSON.stringify({
          genre: project?.genre || "Fantasy",
          synopsis: projectSynopsis || "",
          existingNames
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate character profile.");
      }

      const generatedChar = await res.json();
      
      // Save to database
      const fresh = dbStore.createCharacter(projectId, generatedChar.name);
      dbStore.updateCharacter(fresh.id, {
        aliases: generatedChar.aliases || [],
        age: generatedChar.age || "",
        gender: generatedChar.gender || "",
        appearance: generatedChar.appearance || "",
        personality: generatedChar.personality || "",
        backstory: generatedChar.backstory || "",
        arcGoal: generatedChar.arcGoal || "",
        powerLevel: generatedChar.powerLevel || "",
        affiliations: generatedChar.affiliations || [],
        tags: generatedChar.tags || [],
        relationships: []
      });

      onRefreshBible();
      setSelectedCharId(fresh.id);
    } catch (err: any) {
      console.error(err);
      alert("Error generating character: " + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateLocAI = async () => {
    setIsGeneratingAI(true);
    try {
      const existingNames = locations.map(l => l.name);
      const res = await fetch("/api/generate-location", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
        },
        body: JSON.stringify({
          genre: project?.genre || "Fantasy",
          synopsis: projectSynopsis || "",
          existingNames
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate setting sector.");
      }

      const generatedLoc = await res.json();

      // Save to database
      const fresh = dbStore.createLocation(projectId, generatedLoc.name);
      dbStore.updateLocation(fresh.id, {
        description: generatedLoc.description || "",
        atmosphere: generatedLoc.atmosphere || "",
        notableFeatures: generatedLoc.notableFeatures || [],
        tags: generatedLoc.tags || []
      });

      onRefreshBible();
      setSelectedLocId(fresh.id);
    } catch (err: any) {
      console.error(err);
      alert("Error generating location: " + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSelectChar = (char: Character) => {
    setSelectedCharId(char.id);
  };

  const handleAddNewChar = () => {
    const fresh = dbStore.createCharacter(projectId, "Unnamed cast");
    onRefreshBible();
    setSelectedCharId(fresh.id);
  };

  const handleDeleteChar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCharId(id);
  };

  const handleSelectLoc = (loc: Location) => {
    setSelectedLocId(loc.id);
  };

  const handleAddNewLoc = () => {
    const fresh = dbStore.createLocation(projectId, "Unnamed Location Sector");
    onRefreshBible();
    setSelectedLocId(fresh.id);
  };

  const handleDeleteLoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingLocId(id);
  };

  const selectedChar = characters.find(c => c.id === selectedCharId);
  const selectedLoc = locations.find(l => l.id === selectedLocId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="bible-root">
      
      {/* Sidebar with Character or Location Lists */}
      <div className="lg:col-span-4 space-y-3">
        {/* Toggle bar tabs */}
        <div className="border border-white/15 bg-[#0A0A0A] p-1 rounded-xl flex gap-1 shadow-inner justify-start">
          <button
            onClick={() => {
              setActiveTab("premise");
              setSelectedCharId(null);
              setSelectedLocId(null);
            }}
            className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer border-0 ${
              activeTab === "premise" ? "bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.3)]" : "text-white/40 hover:text-white"
            }`}
          >
            <BookOpen size={12} />
            <span>Premise</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("characters");
              setSelectedCharId(null);
              setSelectedLocId(null);
            }}
            className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer border-0 ${
              activeTab === "characters" ? "bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.3)]" : "text-white/40 hover:text-white"
            }`}
          >
            <Users size={12} />
            <span>Cast ({characters.length})</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("locations");
              setSelectedCharId(null);
              setSelectedLocId(null);
            }}
            className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer border-0 ${
              activeTab === "locations" ? "bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.3)]" : "text-white/40 hover:text-white"
            }`}
          >
            <MapPin size={12} />
            <span>Sectors ({locations.length})</span>
          </button>
        </div>

        {/* Dynamic header and Create Btn */}
        <div className="bg-[#121212] border border-white/10 p-3.5 rounded-xl shadow-xl flex justify-between items-center text-left">
          <div>
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">
              {activeTab === "premise" ? "Manuscript Premise" : activeTab === "characters" ? "Persona Profiles" : "Environment Index"}
            </h3>
            <p className="text-[10px] text-white/40 font-mono">Managed story bible constraints</p>
          </div>
          {activeTab !== "premise" && (
            <div className="flex gap-1.5">
              <button
                onClick={activeTab === "characters" ? handleGenerateCharAI : handleGenerateLocAI}
                disabled={isGeneratingAI}
                className="p-2 bg-[#00FF88]/15 border border-[#00FF88]/20 hover:bg-[#00FF88] text-[#00FF88] hover:text-black rounded-lg transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                title={activeTab === "characters" ? "AI Generate high-fidelity Character profile matching premise" : "AI Generate physical setting sector matching premise"}
              >
                <Sparkles size={14} className={isGeneratingAI ? "animate-spin" : ""} />
              </button>
              <button
                onClick={activeTab === "characters" ? handleAddNewChar : handleAddNewLoc}
                className="p-2 bg-white hover:bg-[#00FF88] text-black border-0 rounded-lg transition duration-200 cursor-pointer"
                id="btn-add-bible-asset"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Lists Container */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === "premise" ? (
            <div className="bg-[#121212] border border-white/10 rounded-xl p-4.5 space-y-3.5 text-left shadow-xl">
              <span className="text-[9px] font-mono font-bold text-[#00FF88] uppercase tracking-wider block">Novel Meta Alignment</span>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-white/40 text-[9px] uppercase font-bold">Manuscript Genre</div>
                  <div className="text-[#00FF88] font-black">{project?.genre || "Not Specified"}</div>
                </div>
                <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-white/40 text-[9px] uppercase font-bold">Standard POV Focus</div>
                  <div className="text-white font-bold">{project?.defaultPOV || "Third Person"}</div>
                </div>
                <div className="bg-[#0A0A0A] p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-white/40 text-[9px] uppercase font-bold">Arc Beat Rule Constraints</div>
                  <div className="text-white/70 font-mono text-[10px] leading-relaxed">
                    Reads synopsis and enforces anti-slop beats to keep conflict logical.
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "characters" ? (
            characters.length === 0 ? (
              <div className="bg-[#121212] border border-white/10 rounded-xl p-8 text-center text-white/40 text-xs text-left">
                No profiled characters. Fill in details so the AI is aware of core cast motivations.
              </div>
            ) : (
              characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => handleSelectChar(char)}
                  className={`bg-[#121212]/90 border p-3 rounded-xl shadow-xl cursor-pointer hover:border-[#00FF88]/50 transition relative text-left ${
                    selectedCharId === char.id ? "ring-1 ring-[#00FF88] border-[#00FF88] bg-[#00FF88]/5" : "border-white/10"
                  }`}
                >
                  {deletingCharId === char.id && (
                    <div 
                      className="absolute inset-0 bg-black/95 flex flex-col justify-center items-center p-2.5 z-25 text-center rounded-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-white text-[11px] font-bold font-sans mb-1.5 leading-snug">
                        Delete Character Profile?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dbStore.deleteCharacter(char.id);
                            if (selectedCharId === char.id) setSelectedCharId(null);
                            setDeletingCharId(null);
                            onRefreshBible();
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCharId(null);
                          }}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="font-bold text-white text-xs block transition leading-none hover:text-[#00FF88]">
                    {char.name}
                  </h4>
                  <div className="flex gap-2 flex-wrap mt-2.5 items-center">
                    {char.powerLevel && (
                      <span className="bg-[#00FF88]/10 text-[#00FF88] font-mono text-[9px] px-1.5 py-0.5 rounded border border-[#00FF88]/20">
                        {char.powerLevel}
                      </span>
                    )}
                    {char.gender && (
                      <span className="bg-white/5 text-white/70 font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/5">
                        {char.gender}
                      </span>
                    )}
                    {char.tags.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-white/40 font-mono text-[9px]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => handleDeleteChar(char.id, e)}
                    className="absolute top-3 right-3 text-white/20 hover:text-rose-500 p-1 bg-transparent border-0 rounded transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )
          ) : (
            locations.length === 0 ? (
              <div className="bg-[#121212] border border-white/10 rounded-xl p-8 text-center text-white/40 text-xs text-left">
                No environment sectors compiled. Map out the world settings.
              </div>
            ) : (
              locations.map(loc => (
                <div
                  key={loc.id}
                  onClick={() => handleSelectLoc(loc)}
                  className={`bg-[#121212]/90 border p-3 rounded-xl shadow-xl cursor-pointer hover:border-[#00FF88]/50 transition relative text-left ${
                    selectedLocId === loc.id ? "ring-1 ring-[#00FF88] border-[#00FF88] bg-[#00FF88]/5" : "border-white/10"
                  }`}
                >
                  {deletingLocId === loc.id && (
                    <div 
                      className="absolute inset-0 bg-black/95 flex flex-col justify-center items-center p-2.5 z-20 text-center rounded-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-white text-[11px] font-bold font-sans mb-1.5 leading-snug">
                        Delete Location Permanent?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dbStore.deleteLocation(loc.id);
                            if (selectedLocId === loc.id) setSelectedLocId(null);
                            setDeletingLocId(null);
                            onRefreshBible();
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingLocId(null);
                          }}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] uppercase font-mono rounded cursor-pointer border-0 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="font-bold text-white text-xs block transition leading-none hover:text-[#00FF88]">
                    {loc.name}
                  </h4>
                  <p className="text-[10px] text-white/40 line-clamp-1 mt-1 leading-snug">
                    Vibe: <span className="text-[#00FF88] italic font-medium">{loc.atmosphere || "Mysterious"}</span>
                  </p>

                  <button
                    onClick={(e) => handleDeleteLoc(loc.id, e)}
                    className="absolute top-3 right-3 text-white/20 hover:text-rose-500 p-1 bg-transparent border-0 rounded transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Main Panel - View / Edit Assets */}
      <div className="lg:col-span-8 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-h-[50vh]">
        {activeTab === "premise" ? (
          <PremiseSection
            projectSynopsis={projectSynopsis}
            setProjectSynopsis={setProjectSynopsis}
            onSavePremise={handleSavePremise}
          />
        ) : activeTab === "characters" ? (
          <CharacterSection
            projectId={projectId}
            characters={characters}
            selectedChar={selectedChar}
            onRefreshBible={onRefreshBible}
          />
        ) : (
          <LocationSection
            projectId={projectId}
            locations={locations}
            selectedLoc={selectedLoc}
            onRefreshBible={onRefreshBible}
          />
        )}
      </div>
    </div>
  );
}
