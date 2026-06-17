import React from "react";
import { Save, Sparkles } from "lucide-react";

interface PremiseSectionProps {
  projectSynopsis: string;
  setProjectSynopsis: (val: string) => void;
  onSavePremise: () => void;
}

export default function PremiseSection({
  projectSynopsis,
  setProjectSynopsis,
  onSavePremise
}: PremiseSectionProps) {
  return (
    <div className="flex flex-col h-full text-left" id="premise-view-detail">
      <div className="border-b border-white/5 p-5 bg-[#0D0D0D] flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
            MANUSCRIPT CORE ALIGNMENT
          </span>
          <h3 className="text-lg font-black font-sans text-white leading-tight">
            Main Premise & Novel Synopsis
          </h3>
        </div>
        <button
          onClick={onSavePremise}
          className="px-4 py-2 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition border-0 shadow-[0_4px_12px_rgba(0,255,136,0.15)]"
        >
          <Save size={12} />
          <span>Save Premise</span>
        </button>
      </div>

      <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
        <div className="bg-[#00FF88]/5 border border-[#00FF88]/15 p-4 rounded-xl space-y-2">
          <div className="flex gap-1.5 items-center text-[#00FF88] font-bold text-xs">
            <Sparkles size={13} />
            <span>AI Ground Truth Guidance</span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed font-sans">
            The primary synopsis represents the core narrative core of your webnovel. Keeping this premise enriched with key rules, system attributes, main conflict bounds, and themes ensures that all chapters, anti-slop text suggestions, and plot outlines made by the AI conform strictly to your design, preventing hallucinated elements.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#00FF88] uppercase block font-mono">The Novel Synopsis / Underpinning Premise</label>
          <textarea
            rows={14}
            placeholder="Write the core story premise here... Give details about the protagonist's goals, unique attributes/cheats, the world rules, primary conflict, and target tone."
            value={projectSynopsis}
            onChange={(e) => setProjectSynopsis(e.target.value)}
            className="w-full text-xs border border-white/10 bg-[#0A0A0A] text-white p-3.5 rounded-lg focus:border-[#00FF88] outline-none resize-none leading-relaxed min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
}
