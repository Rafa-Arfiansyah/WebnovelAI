import React, { useState, useEffect } from "react";
import { Character, Relationship } from "../../types";
import { dbStore } from "../../dbStore";
import { Save, Edit, Users, Heart, Plus, Trash2 } from "lucide-react";

interface CharacterSectionProps {
  projectId: string;
  characters: Character[];
  selectedChar: Character | undefined;
  onRefreshBible: () => void;
}

export default function CharacterSection({
  projectId,
  characters,
  selectedChar,
  onRefreshBible
}: CharacterSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Form edit states
  const [charName, setCharName] = useState("");
  const [charAliases, setCharAliases] = useState<string[]>([]);
  const [charAge, setCharAge] = useState("");
  const [charGender, setCharGender] = useState("");
  const [charAppearance, setCharAppearance] = useState("");
  const [charPersonality, setCharPersonality] = useState("");
  const [charBackstory, setCharBackstory] = useState("");
  const [charArcGoal, setCharArcGoal] = useState("");
  const [charPower, setCharPower] = useState("");
  const [charAffiliations, setCharAffiliations] = useState<string[]>([]);
  const [charTags, setCharTags] = useState<string[]>([]);

  // Relationship creation states
  const [showRelForm, setShowRelForm] = useState(false);
  const [relTargetId, setRelTargetId] = useState("");
  const [relType, setRelType] = useState("Ally");
  const [relDesc, setRelDesc] = useState("");

  // Sync state initially when active character loads
  useEffect(() => {
    if (selectedChar) {
      setCharName(selectedChar.name || "");
      setCharAliases(selectedChar.aliases || []);
      setCharAge(selectedChar.age || "");
      setCharGender(selectedChar.gender || "");
      setCharAppearance(selectedChar.appearance || "");
      setCharPersonality(selectedChar.personality || "");
      setCharBackstory(selectedChar.backstory || "");
      setCharArcGoal(selectedChar.arcGoal || "");
      setCharPower(selectedChar.powerLevel || "");
      setCharAffiliations(selectedChar.affiliations || []);
      setCharTags(selectedChar.tags || []);
      setIsEditing(false);
    }
    setShowRelForm(false);
  }, [selectedChar]);

  if (!selectedChar) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[450px] space-y-3">
        <div className="w-16 h-16 bg-[#0A0A0A] border border-white/10 rounded-full flex items-center justify-center text-[#00FF88]">
          <Users size={24} />
        </div>
        <div className="space-y-1 text-left md:text-center">
          <h3 className="font-bold text-white font-sans text-sm uppercase tracking-wider text-center">No Character Profile Loaded</h3>
          <p className="text-white/40 text-xs text-center max-w-sm">
            Click on an existing core cast profile in the sidebar or press '+' to write out comprehensive mechanical guidelines.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveChar = () => {
    dbStore.updateCharacter(selectedChar.id, {
      name: charName,
      aliases: charAliases,
      age: charAge,
      gender: charGender,
      appearance: charAppearance,
      personality: charPersonality,
      backstory: charBackstory,
      arcGoal: charArcGoal,
      powerLevel: charPower,
      affiliations: charAffiliations,
      tags: charTags
    });
    setIsEditing(false);
    onRefreshBible();
  };

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relTargetId) return;

    const currentRels = selectedChar.relationships || [];
    const newRel: Relationship = {
      targetCharacterId: relTargetId,
      type: relType,
      description: relDesc
    };

    dbStore.updateCharacter(selectedChar.id, {
      relationships: [...currentRels, newRel]
    });

    setRelTargetId("");
    setRelType("Ally");
    setRelDesc("");
    setShowRelForm(false);
    onRefreshBible();
  };

  const handleDeleteRelationship = (targetId: string) => {
    const filtered = (selectedChar.relationships || []).filter(r => r.targetCharacterId !== targetId);
    dbStore.updateCharacter(selectedChar.id, { relationships: filtered });
    onRefreshBible();
  };

  return (
    <div className="flex flex-col h-full text-left" id="character-view-detail">
      {/* Header Details with toggle edit button */}
      <div className="border-b border-white/5 p-5 bg-[#0D0D0D] flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
            CHARACTER WORLD CARD
          </span>
          <h3 className="text-base font-black font-sans text-white leading-tight">
            {selectedChar.name}
          </h3>
        </div>
        
        <button
          onClick={() => isEditing ? handleSaveChar() : setIsEditing(true)}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition border-0 ${
            isEditing 
              ? "bg-[#00FF88] text-black shadow-[0_4px_12px_rgba(0,255,136,0.2)] hover:bg-[#00FF88]/90" 
              : "bg-white/10 text-white hover:bg-[#00FF88] hover:text-black"
          }`}
        >
          {isEditing ? <Save size={12} /> : <Edit size={12} />}
          <span>{isEditing ? "Commit Profile" : "Modify Details"}</span>
        </button>
      </div>

      {/* Character Fields Form / Details */}
      <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Codename / Full name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Hunter rank / Power Level</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. S-Tier Anti-Entropy Mage"
              value={charPower}
              onChange={(e) => setCharPower(e.target.value)}
              className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Target Age & Era</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. 21 orbits"
              value={charAge}
              onChange={(e) => setCharAge(e.target.value)}
              className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Biological gender</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Male"
              value={charGender}
              onChange={(e) => setCharGender(e.target.value)}
              className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Physical appearance descriptions</label>
          <textarea
            disabled={!isEditing}
            rows={2}
            placeholder="Provide details about scars, clothing armor, and weapon signatures..."
            value={charAppearance}
            onChange={(e) => setCharAppearance(e.target.value)}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 p-2.5 rounded-lg focus:border-[#00FF88] outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Internal psychology & Speaking Style quirks</label>
          <textarea
            disabled={!isEditing}
            rows={2}
            placeholder="Provide traits, speaking styles, or structural quotes..."
            value={charPersonality}
            onChange={(e) => setCharPersonality(e.target.value)}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 p-2.5 rounded-lg focus:border-[#00FF88] outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Backstory and core motivations</label>
          <textarea
            disabled={!isEditing}
            rows={3}
            placeholder="Where did they start and why are they willing to risk survival?"
            value={charBackstory}
            onChange={(e) => setCharBackstory(e.target.value)}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 p-2.5 rounded-lg focus:border-[#00FF88] outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Tags and Custom Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Affiliation Guilds (comma split)</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Scavengers, Fringe Guild"
              value={charAffiliations.join(", ")}
              onChange={(e) => setCharAffiliations(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Visual Tags (comma split)</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Tactician, Protagonist"
              value={charTags.join(", ")}
              onChange={(e) => setCharTags(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              className="w-full text-xs border border-[#121212] bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none"
            />
          </div>
        </div>

        {/* Relationships Board section (Rendered below Profile Cards) */}
        {!isEditing && (
          <div className="pt-5 border-t border-white/5 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-left gap-3">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">Cast Connections Index</h4>
                <p className="text-[10px] text-white/40">Detail social affiliations, magical bounds, or faction alignments of {selectedChar.name}.</p>
              </div>
              <button
                onClick={() => setShowRelForm(!showRelForm)}
                className="bg-[#00FF88] text-black font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#00FF88]/90 transition cursor-pointer border-0 shadow-[0_4px_12px_rgba(0,255,136,0.15)]"
              >
                <Plus size={11} />
                <span>{showRelForm ? "Close Form" : "Establish Connection"}</span>
              </button>
            </div>

            {showRelForm && (
              <div className="bg-[#0D0D0D] border border-white/10 p-5 rounded-2xl space-y-4 shadow-2xl relative animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="border-b border-white/5 pb-2 text-left">
                  <span className="text-[9px] font-bold text-[#00FF88] uppercase tracking-wider font-mono">New Connection Configuration</span>
                </div>
                <form onSubmit={handleAddRelationship} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase block font-mono">Target Cast Member</label>
                      <select
                        required
                        value={relTargetId}
                        onChange={(e) => setRelTargetId(e.target.value)}
                        className="w-full border border-white/10 bg-[#121212] text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-[#00FF88] outline-none"
                      >
                        <option value="" className="bg-[#121212]">-- Choose Target --</option>
                        {characters
                          .filter(c => c.id !== selectedChar.id)
                          .map(c => (
                            <option key={c.id} value={c.id} className="bg-[#121212]">{c.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase block font-mono">Connection Type / Bond type</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master-Disciple, Rival, Core Protector"
                        value={relType}
                        onChange={(e) => setRelType(e.target.value)}
                        className="w-full border border-white/10 bg-[#121212] text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-[#00FF88] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase block font-mono">Dynamic details / history of relationship</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rivals during core trials but respect each other under combat stress"
                      value={relDesc}
                      onChange={(e) => setRelDesc(e.target.value)}
                      className="w-full border border-white/10 bg-[#121212] text-white p-2.5 rounded-xl text-xs focus:ring-1 focus:ring-[#00FF88] outline-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowRelForm(false)}
                      className="border border-[#121212] text-white/50 text-[10px] uppercase font-black px-4 py-2 rounded-xl hover:bg-white/5 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#00FF88] text-black text-[10px] uppercase font-black px-4 py-2 rounded-xl hover:bg-[#00FF88]/90 transition border-0 font-bold"
                    >
                      Add Connection Map
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Relationship Mapping Rows list */}
            <div className="space-y-3">
              {(!selectedChar.relationships || selectedChar.relationships.length === 0) ? (
                <div className="text-xs text-white/40 bg-[#0A0A0A] p-6 rounded-2xl text-center font-medium border border-white/5 italic">
                  No character connections established yet for {selectedChar.name}.
                </div>
              ) : (
                selectedChar.relationships.map((rel, i) => {
                  const targetChar = characters.find(c => c.id === rel.targetCharacterId);
                  return (
                    <div key={i} className="flex justify-between items-center border border-white/10 bg-[#0A0A0A]/65 p-4 rounded-xl shadow-md text-xs text-left gap-3 hover:border-[#00FF88]/25 transition duration-200">
                      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                        <span className="font-bold text-white text-sm">{targetChar?.name || "Deleted Cast"}</span>
                        <span className="bg-rose-500/10 text-rose-400 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-lg border border-rose-500/10 flex items-center gap-1 font-mono">
                          <Heart size={8} />
                          <span>{rel.type}</span>
                        </span>
                        <span className="text-white/40 text-[11px] leading-relaxed">— {rel.description}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRelationship(rel.targetCharacterId)}
                        className="bg-white/5 hover:bg-rose-500/10 text-white/30 hover:text-rose-400 border border-white/5 hover:border-rose-500/15 w-8 h-8 rounded-xl flex items-center justify-center p-0 transition-all duration-200 cursor-pointer shrink-0 ml-2"
                        title="Delete relationship tag"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
