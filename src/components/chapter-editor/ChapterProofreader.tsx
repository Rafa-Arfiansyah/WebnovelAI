import React from "react";
import { Sparkles, X, RefreshCw } from "lucide-react";

interface ChapterProofreaderProps {
  editorContent: string;
  pendingIssuesCount: number;
  renderProofreaderPreview: () => string;
  handlePreviewPanelClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  selectedTextToPolish: string;
  setSelectedTextToPolish: (val: string) => void;
  polishQuery: string;
  setPolishQuery: (val: string) => void;
  isPolishing: boolean;
  polishedDiffResult: string | null;
  setPolishedDiffResult: (val: string | null) => void;
  handlePolishPassage: () => void;
  handleAcceptPolishDiff: () => void;
  setActiveTab: (tab: "write" | "audit" | "issues" | "snapshots") => void;
}

export default function ChapterProofreader({
  editorContent,
  pendingIssuesCount,
  renderProofreaderPreview,
  handlePreviewPanelClick,
  selectedTextToPolish,
  setSelectedTextToPolish,
  polishQuery,
  setPolishQuery,
  isPolishing,
  polishedDiffResult,
  setPolishedDiffResult,
  handlePolishPassage,
  handleAcceptPolishDiff,
  setActiveTab
}: ChapterProofreaderProps) {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[60vh] text-left animate-in fade-in duration-200">
      <div className="p-4.5 border-b border-white/5 bg-[#0D0D0D] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#00FF88] uppercase tracking-widest font-mono">
            👁️ Styled Annotations & Highlight Reader
          </span>
          <p className="text-[10px] text-white/40 font-sans leading-normal">
            Highlight any sentence or paragraph with your mouse below to trigger the dynamic **AI Selection Polisher** toolbar.
          </p>
        </div>
        {pendingIssuesCount > 0 ? (
          <button
            onClick={() => setActiveTab("issues")}
            className="bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold text-[9px] px-2.5 py-1.5 rounded-lg font-mono hover:bg-rose-500/20 cursor-pointer"
          >
            {pendingIssuesCount} ISSUES DETECTED
          </button>
        ) : (
          <span className="bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 font-bold text-[9px] px-2.5 py-1.5 rounded-lg font-mono">
            ✓ Clean Proofread Status
          </span>
        )}
      </div>

      <div className="p-6 relative select-text bg-[#0A0A0A]/10 min-h-[350px]">
        <div 
          onClick={handlePreviewPanelClick}
          className="w-full border border-white/10 rounded-xl bg-[#0A0A0A] p-6 text-white text-base leading-relaxed whitespace-pre-wrap overflow-y-auto min-h-[350px] text-left cursor-text shadow-xl select-text"
          dangerouslySetInnerHTML={{ __html: renderProofreaderPreview() }}
        />
      </div>

      {/* AI Polish Selection Bar */}
      {selectedTextToPolish && (
        <div className="p-5 border-t border-white/5 bg-[#0D0D0D]/90 space-y-4 shadow-inner text-xs text-left">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-[10px] text-[#00FF88] font-bold flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Sparkles size={12} className="text-[#00FF88]" />
              <span>AI Selection Polish Workspace</span>
            </span>
            <button 
              onClick={() => {
                setSelectedTextToPolish("");
                setPolishedDiffResult(null);
              }} 
              className="w-6 h-6 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center p-0 border-0 transition cursor-pointer"
              title="Clear selection"
            >
              <X size={12} />
            </button>
          </div>

          <div className="bg-[#050505] border border-white/5 p-3 rounded-lg italic text-white/50 leading-relaxed max-h-24 overflow-y-auto">
            "{selectedTextToPolish}"
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. strengthen combat verbs, eliminate passive tags, raise kinetic pacing..."
              value={polishQuery}
              onChange={(e) => setPolishQuery(e.target.value)}
              className="flex-1 border border-white/10 bg-[#0A0A0A] text-white p-3 text-xs rounded-xl focus:border-[#00FF88]"
            />
            <button
              onClick={handlePolishPassage}
              disabled={isPolishing || !polishQuery.trim()}
              className="bg-[#00FF88] text-black font-black text-xs px-5 rounded-xl flex items-center gap-1.5 transition cursor-pointer border-0 disabled:opacity-40"
            >
              {isPolishing ? <RefreshCw className="animate-spin text-black" size={13} /> : <Sparkles size={13} />}
              <span>Polish Selection</span>
            </button>
          </div>

          {/* Diff Comparison View */}
          {polishedDiffResult && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="font-extrabold text-[10px] text-white/40 uppercase tracking-widest font-mono">Passage comparison diff view</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-left font-sans">
                  <span className="text-[9px] font-bold text-rose-400 uppercase block mb-1 font-mono">Original passage</span>
                  <span className="text-white/70 font-normal leading-relaxed">{selectedTextToPolish}</span>
                </div>
                <div className="bg-[#00FF88]/10 border border-[#00FF88]/20 p-3.5 rounded-xl text-left font-sans">
                  <span className="text-[9px] font-bold text-[#00FF88] uppercase block mb-1 font-mono">Polished rewrite</span>
                  <span className="text-white font-medium leading-relaxed">{polishedDiffResult}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPolishedDiffResult(null)}
                  className="border border-white/15 text-white/60 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/5 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleAcceptPolishDiff}
                  className="bg-[#00FF88] text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-0"
                >
                  Accept Diff Swap
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
