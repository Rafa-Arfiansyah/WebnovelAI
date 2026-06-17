import React, { useState, useEffect } from "react";
import { Location } from "../../types";
import { dbStore } from "../../dbStore";
import { Save, Edit, MapPin } from "lucide-react";

interface LocationSectionProps {
  projectId: string;
  locations: Location[];
  selectedLoc: Location | undefined;
  onRefreshBible: () => void;
}

export default function LocationSection({
  projectId,
  locations,
  selectedLoc,
  onRefreshBible
}: LocationSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Form edit states
  const [locName, setLocName] = useState("");
  const [locDescription, setLocDescription] = useState("");
  const [locAtmosphere, setLocAtmosphere] = useState("");
  const [locFeatures, setLocFeatures] = useState<string[]>([]);
  const [locTags, setLocTags] = useState<string[]>([]);

  // Sync state initially when active location loads
  useEffect(() => {
    if (selectedLoc) {
      setLocName(selectedLoc.name || "");
      setLocDescription(selectedLoc.description || "");
      setLocAtmosphere(selectedLoc.atmosphere || "");
      setLocFeatures(selectedLoc.notableFeatures || []);
      setLocTags(selectedLoc.tags || []);
      setIsEditing(false);
    }
  }, [selectedLoc]);

  if (!selectedLoc) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[450px] space-y-3">
        <div className="w-16 h-16 bg-[#0A0A0A] border border-white/10 rounded-full flex items-center justify-center text-[#00FF88]">
          <MapPin size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-white font-sans text-sm uppercase tracking-wider">No Sector Map Loaded</h3>
          <p className="text-white/40 text-xs max-w-sm">
            Click on an existing sector or dungeon field on the left sidebar, or press '+' to write out physical world atmosphere rules.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveLoc = () => {
    dbStore.updateLocation(selectedLoc.id, {
      name: locName,
      description: locDescription,
      atmosphere: locAtmosphere,
      notableFeatures: locFeatures,
      tags: locTags
    });
    setIsEditing(false);
    onRefreshBible();
  };

  return (
    <div className="flex flex-col h-full text-left" id="location-view-detail">
      {/* Header Details with toggle edit button */}
      <div className="border-b border-white/5 p-5 bg-[#0D0D0D] flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
            DUNGEON ENVIRONMENT CARD
          </span>
          <h3 className="text-base font-black font-sans text-white leading-tight">
            {selectedLoc.name}
          </h3>
        </div>
        
        <button
          onClick={() => isEditing ? handleSaveLoc() : setIsEditing(true)}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition border-0 ${
            isEditing 
              ? "bg-[#00FF88] text-black shadow-[0_4px_12px_rgba(0,255,136,0.2)] hover:bg-[#00FF88]/90" 
              : "bg-white/10 text-white hover:bg-[#00FF88] hover:text-black"
          }`}
        >
          {isEditing ? <Save size={12} /> : <Edit size={12} />}
          <span>{isEditing ? "Commit Location" : "Modify Details"}</span>
        </button>
      </div>

      {/* Location details form */}
      <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Sector Name</label>
          <input
            type="text"
            disabled={!isEditing}
            placeholder="e.g. Sector-4 Crystallized Smelter"
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
            className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Atmospheric Vibe & Color Mood</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Lavender electric smog, metallic hums"
              value={locAtmosphere}
              onChange={(e) => setLocAtmosphere(e.target.value)}
              className="w-full text-xs font-bold border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Notable Landmark Features (comma split)</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. Titan Loader Crane, Crystal Fissure"
              value={locFeatures.join(", ")}
              onChange={(e) => setLocFeatures(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Physical terrain descriptions</label>
          <textarea
            disabled={!isEditing}
            rows={4}
            placeholder="Provide details about the environmental layout, hazard parameters, or magical mineral decay nodes..."
            value={locDescription}
            onChange={(e) => setLocDescription(e.target.value)}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 p-2.5 rounded-lg focus:border-[#00FF88] outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">Visual map tags (comma split)</label>
          <input
            type="text"
            disabled={!isEditing}
            placeholder="e.g. Industrial, Dungeon, Fissure fallout"
            value={locTags.join(", ")}
            onChange={(e) => setLocTags(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white disabled:opacity-40 px-3 py-2 rounded-lg focus:border-[#00FF88] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
