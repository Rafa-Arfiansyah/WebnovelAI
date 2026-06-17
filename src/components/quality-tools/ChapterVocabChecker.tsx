import React, { useState } from "react";
import { VocabAnalysis, VocabIssue, IssueActionStatus } from "../../types";
import { Check, X, ShieldAlert, BookOpen, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";

interface ChapterVocabCheckerProps {
  activeVocabAnalysis: VocabAnalysis | null;
  isAnalyzingVocab: boolean;
  handleRunVocabAnalysis: () => void;
  handleRejectVocabIssue: (id: string) => void;
  handleAcceptVocabSuggestion: (id: string, suggestion: string) => void;
  editorContent: string;
}

export default function ChapterVocabChecker({
  activeVocabAnalysis,
  isAnalyzingVocab,
  handleRunVocabAnalysis,
  handleRejectVocabIssue,
  handleAcceptVocabSuggestion,
  editorContent
}: ChapterVocabCheckerProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // filter pending ones
  const pendingIssues = activeVocabAnalysis 
    ? activeVocabAnalysis.issues.filter(i => i.status === IssueActionStatus.Pending)
    : [];

  const completedIssuesCount = activeVocabAnalysis 
    ? activeVocabAnalysis.issues.filter(i => i.status === IssueActionStatus.Accepted).length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="vocab-simplicity-panel">
      
      {/* 1. Technical Info & Action Panel (Left 4 columns) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl text-left space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#00FF88]">
              <BookOpen size={13} />
              <span>Simplicity Guard</span>
            </h4>
            <span className="bg-[#00FF88]/10 text-[#00FF88] font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
              v1.2 active
            </span>
          </div>

          <div className="space-y-2 text-xs text-white/70 leading-relaxed">
            <p className="font-semibold text-white">How it helps:</p>
            <p>
              Scans your draft for pretentious words, overly formal structures ("kaku"), academic jargon, or overly "designed" dialogue that breaks raw, spontaneous human prose immersion.
            </p>
            <div className="bg-[#0A0A0A] p-3 rounded-lg border border-white/5 space-y-1 font-mono text-[10px]">
              <span className="text-[#00FF88] font-bold block">🚨 EXAMPLES DETECTED:</span>
              <ul className="list-disc list-inside space-y-1 text-white/50">
                <li><span className="text-white">visage</span> → face</li>
                <li><span className="text-white">blade to throat</span> → blade to neck</li>
                <li><span className="text-white">coruscating conflagration</span> → bright fire</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleRunVocabAnalysis}
            disabled={isAnalyzingVocab || !editorContent.trim()}
            className="w-full mt-2 bg-gradient-to-r from-[#00FF88] to-[#00D1FF] text-black font-black uppercase text-xs py-3 rounded-xl border-0 cursor-pointer shadow-[0_4px_12px_rgba(0,255,1).2] hover:opacity-90 flex items-center justify-center gap-1.5 transition duration-300 disabled:opacity-40"
          >
            {isAnalyzingVocab ? <RefreshCw className="animate-spin text-black" size={13} /> : <Sparkles size={13} />}
            <span>{isAnalyzingVocab ? "Analyzing Vocabulary..." : "Scan Vocab Simplicity"}</span>
          </button>
        </div>

        {activeVocabAnalysis && (
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4.5 text-left text-xs">
            <h5 className="font-bold text-white uppercase font-mono tracking-wider text-[10px] mb-2.5">Vocabulary Stats</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 text-[9px] uppercase font-mono block">Stiff Words</span>
                <span className="text-lg font-black text-[#00FF88] font-mono">{pendingIssues.length}</span>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-white/5">
                <span className="text-white/40 text-[9px] uppercase font-mono block">Simplified</span>
                <span className="text-lg font-black text-[#00D1FF] font-mono">{completedIssuesCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Issue Checklist & Corrections (Right 8 columns) */}
      <div className="lg:col-span-8 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl text-left flex flex-col min-h-[50vh]">
        <div className="pb-2.5 border-b border-white/5 mb-4 flex justify-between items-center">
          <div>
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">
              Simplicity Corrections ({pendingIssues.length} pending)
            </h4>
            <p className="text-[10px] text-white/40">Review overly formal, academic, or kaku phrasing. Click appropriate replacement suggestions to directly swap them.</p>
          </div>
          {pendingIssues.length > 0 && (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/15 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-lg animate-pulse">
              Needs Polish
            </span>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto max-h-[520px] pr-1">
          {!activeVocabAnalysis ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-white/30 text-xs font-mono space-y-2.5">
              <ShieldAlert size={36} className="text-white/10" />
              <p className="uppercase tracking-widest text-[#00D1FF] font-black">Ready to simplify vocab</p>
              <p className="font-sans text-[10px] text-white/40 max-w-sm">
                Get rid of dry, clinical, theatrical, and overly formal "kaku" words. Click "Scan Vocab Simplicity" on the left to analyze the current chapter.
              </p>
            </div>
          ) : pendingIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-[#00FF88] bg-[#00FF88]/5 rounded-2xl border border-[#00FF88]/10 space-y-3 p-6.5">
              <CheckCircle2 size={32} className="text-[#00FF88]" />
              <div>
                <p className="font-mono uppercase font-black text-xs tracking-wide">Fully Grounded prose!</p>
                <p className="font-sans text-[10px] text-white/40 max-w-sm mx-auto mt-1 leading-normal">
                  No pretentious words, academic jargon, or overly theatrical "throat" / "visage" structures are present. Your prose is simple, down-to-earth, and highly readable.
                </p>
              </div>
            </div>
          ) : (
            pendingIssues.map((iss) => {
              const isSelected = selectedIssueId === iss.id;
              return (
                <div
                  key={iss.id}
                  id={`vocab-issue-${iss.id}`}
                  onClick={() => setSelectedIssueId(iss.id)}
                  className={`border rounded-xl p-4.5 space-y-3 transition cursor-pointer text-xs ${
                    isSelected 
                      ? "border-[#00D1FF] ring-1 ring-[#00D1FF] bg-[#00D1FF]/5 shadow-[0_0_15px_rgba(0,209,255,0.15)]" 
                      : "border-white/10 bg-[#0A0A0A] hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Pretentious text
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        Trouble Word: <strong className="text-rose-400 font-bold">"{iss.word}"</strong>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectVocabIssue(iss.id);
                      }}
                      className="w-6 h-6 bg-white/5 hover:bg-rose-500/10 text-white/40 hover:text-rose-400 rounded-md flex items-center justify-center p-0 border-0 transition"
                      title="Dismiss suggestion"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/40 uppercase block font-mono">Found in context:</span>
                    <p className="font-semibold text-white italic border-l-2 border-[#00D1FF] pl-2 leading-relaxed bg-[#121212] p-2.5 rounded">
                      "{iss.originalText}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/40 uppercase block font-mono">Analysis:</span>
                    <p className="text-white/60 leading-relaxed text-[11px] font-sans">
                      {iss.explanation}
                    </p>
                  </div>

                  {/* Suggestions list */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-bold text-[#00D1FF] uppercase block font-mono">Click simplified alternative to replace:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {iss.suggestions.map((sug, sugIndex) => (
                        <button
                          key={sugIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptVocabSuggestion(iss.id, sug);
                          }}
                          className="text-left bg-white/5 border border-white/10 hover:bg-[#00D1FF] hover:text-black hover:border-[#00D1FF] transition text-[11px] p-2.5 rounded-lg font-bold text-white flex justify-between items-center group cursor-pointer duration-200"
                        >
                          <span className="whitespace-normal break-words flex-1 pr-2 leading-relaxed">{sug}</span>
                          <Check size={11} className="text-[#00D1FF] group-hover:text-black shrink-0 opacity-0 group-hover:opacity-100 font-extrabold" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}
