import React from "react";
import { SlopAnalysis, SlopIssue } from "../../types";
import { Check, X, ShieldCheck, RefreshCw } from "lucide-react";
import { MeterBar, SectionHeader, Button } from "../ui";

interface ChapterAntiSlopAuditProps {
  activeAnalysis: SlopAnalysis | null;
  isAnalyzing: boolean;
  pendingIssues: SlopIssue[];
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  handleRunSlopAnalysis: () => void;
  handleRejectIssue: (id: string) => void;
  handleAcceptIssueSuggestion: (id: string, suggestion: string) => void;
}

export default function ChapterAntiSlopAudit({
  activeAnalysis,
  isAnalyzing,
  pendingIssues,
  selectedIssueId,
  setSelectedIssueId,
  handleRunSlopAnalysis,
  handleRejectIssue,
  handleAcceptIssueSuggestion
}: ChapterAntiSlopAuditProps) {
  const isNewConvention = activeAnalysis?.scores 
    ? (activeAnalysis.scores.negationPatterns !== undefined || activeAnalysis.scores.dialogueFormulaic !== undefined)
    : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200" id="anti-slop-panel">
      
      {/* Left Score Card & Breakdowns (4 Columns) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl text-left space-y-4">
          <SectionHeader title="Diagnostics" badge="Anti-slop Engine" />

          <div className="text-center py-3 bg-[#0A0A0A]/50 rounded-xl p-4 border border-white/5">
            {activeAnalysis ? (
              <div className="space-y-1">
                <h1 className={`text-5xl font-black font-mono ${
                  isNewConvention
                    ? (activeAnalysis.overallScore <= 20 ? "text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]" :
                       activeAnalysis.overallScore <= 50 ? "text-amber-400" : "text-rose-400")
                    : (activeAnalysis.overallScore >= 80 ? "text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]" :
                       activeAnalysis.overallScore >= 60 ? "text-amber-400" : "text-rose-400")
                }`}>
                  {activeAnalysis.overallScore}
                </h1>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                  {isNewConvention ? "Slop Index (Lower is Better)" : "Overall Human-Like Rating"}
                </p>
              </div>
            ) : (
              <div className="text-white/40 py-2 text-center">
                <p className="text-xs font-bold text-white uppercase tracking-normal">Ready to Scan</p>
                <p className="text-[9px] max-w-[180px] mx-auto mt-1 leading-normal font-mono">
                  Run Slop Analysis to generate detailed category breakdowns.
                </p>
              </div>
            )}
          </div>

          {/* Meter bars parameters */}
          {activeAnalysis && (() => {
            const scores = activeAnalysis.scores;
            const isNewConvention = scores.negationPatterns !== undefined || scores.dialogueFormulaic !== undefined;
            return (
              <div className="space-y-3 pt-1">
                <MeterBar 
                  label="Prose Integrity (Anti-Purple)" 
                  value={scores.purpleProse} 
                  color="bg-indigo-400" 
                />
                <MeterBar 
                  label="Verb Precision (Anti-Adverb)" 
                  value={scores.adverbDensity} 
                  color="bg-rose-500" 
                />
                <MeterBar 
                  label={isNewConvention ? "Dialogue Formulaic (Lower is Better)" : "Dialogue Ratio"} 
                  value={scores.dialogueFormulaic ?? scores.dialogueQuality} 
                  color="bg-teal-500" 
                />
                <MeterBar 
                  label={isNewConvention ? "Cliché Intensity (Lower is Better)" : "Tone Sincerity (Anti-Cliche)"} 
                  value={scores.clicheIntensity ?? scores.clicheCount} 
                  color="bg-amber-500" 
                />
                <MeterBar 
                  label={isNewConvention ? "Pacing Issues (Lower is Better)" : "Pacing Vibe alignment"} 
                  value={scores.pacingIssues ?? scores.pacing} 
                  color="bg-[#00FF88]" 
                />
                {scores.negationPatterns !== undefined && (
                  <MeterBar 
                    label="Negation Patterns (Lower is Better)" 
                    value={scores.negationPatterns} 
                    color="bg-cyan-400" 
                  />
                )}
                {scores.propOverdescription !== undefined && (
                  <MeterBar 
                    label="Overdescription (Lower is Better)" 
                    value={scores.propOverdescription} 
                    color="bg-purple-400" 
                  />
                )}
              </div>
            );
          })()}

          <Button
            onClick={handleRunSlopAnalysis}
            disabled={isAnalyzing}
            className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5"
            id="btn-run-analysis"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin text-black" size={13} /> : <ShieldCheck size={13} />}
            <span>{isAnalyzing ? "Auditing Prose..." : "Recalculate Slop Analysis"}</span>
          </Button>
        </div>
      </div>

      {/* Right Audit resolution card listings (8 Columns) */}
      <div className="lg:col-span-8 bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl text-left flex flex-col min-h-[50vh]">
        <div className="pb-2.5 border-b border-white/5 mb-4">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Slop checklist ({pendingIssues.length} items)</h4>
          <p className="text-[10px] text-white/40">Review identified clichés, purple prose adverbs, and click suggestions to directly write updates in the typist core.</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
          {!activeAnalysis ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-white/30 text-xs font-mono space-y-2">
              <ShieldCheck size={36} className="text-white/10" />
              <p className="uppercase tracking-wider">No audit diagnostics loaded.</p>
              <p className="font-sans text-[10px] text-white/40 text-center">Click "Run Slop Analysis" or "Recalculate" on the left diagnostic box to sync parameters.</p>
            </div>
          ) : pendingIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-emerald-400 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2 p-6">
              <Check size={28} className="border border-emerald-400 rounded-full p-0.5" />
              <p className="font-mono uppercase font-bold text-xs">Purged manuscript! Zero anomalies</p>
              <p className="font-sans text-[10px] text-white/40 max-w-sm text-center">No slop blocks detected. Excellent literary pacing with high flow rating.</p>
            </div>
          ) : (
            pendingIssues.map((iss) => {
              const isSelected = selectedIssueId === iss.id;
              return (
                <div
                  key={iss.id}
                  id={`issue-card-${iss.id}`}
                  onClick={() => setSelectedIssueId(iss.id)}
                  className={`border rounded-xl p-4.5 space-y-3 transition cursor-pointer text-xs ${
                    isSelected 
                      ? "border-[#00FF88] ring-1 ring-[#00FF88] bg-[#00FF88]/5 shadow-[0_0_15px_rgba(0,255,136,0.15)]" 
                      : "border-white/10 bg-[#0A0A0A] hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md font-mono ${
                      iss.category === "PurpleProse" ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" :
                      iss.category === "Adverb" ? "bg-rose-500/10 text-rose-300 border border-rose-500/20" :
                      iss.category === "Cliché" || iss.category === "ClicheIntensity" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                      iss.category === "NegationPattern" ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" :
                      iss.category === "DialogueFormulaic" ? "bg-teal-500/10 text-teal-300 border border-teal-500/20" :
                      iss.category === "PropOverdescription" ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" :
                      "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20"
                    }`}>
                      {iss.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] uppercase font-black font-mono tracking-wider ${
                        iss.severity === "High" ? "text-rose-400 animate-pulse" :
                        iss.severity === "Medium" ? "text-amber-400" : "text-white/40"
                      }`}>
                        {iss.severity} Priority
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectIssue(iss.id);
                        }}
                        className="w-6 h-6 bg-white/5 hover:bg-[#c62828]/20 text-white/40 hover:text-rose-400 rounded-md flex items-center justify-center p-0 border-0 transition"
                        title="Dismiss issue"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/40 uppercase block font-mono">Flagged passage:</span>
                    <p className="font-semibold text-white italic border-l-2 border-[#00FF88] pl-2 leading-relaxed bg-[#121212] p-2.5 rounded">
                      "{iss.originalText}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/40 uppercase block font-mono">Correction Reasoning:</span>
                    <p className="text-white/60 leading-relaxed text-[11px] font-sans">
                      {iss.explanation}
                    </p>
                  </div>

                  {/* Suggested lists */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-bold text-[#00FF88] uppercase block font-mono">Click replacement option to swap spelling:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {iss.suggestions.map((sug, sugIndex) => (
                        <button
                          key={sugIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptIssueSuggestion(iss.id, sug);
                          }}
                          className="text-left bg-white/5 border border-white/10 hover:bg-[#00FF88] hover:text-black hover:border-[#00FF88] transition text-[11px] p-2.5 rounded-lg font-bold text-white flex justify-between items-center group cursor-pointer duration-200"
                        >
                          <span className="whitespace-normal break-words flex-1 pr-2 leading-relaxed">{sug}</span>
                          <Check size={11} className="text-[#00FF88] group-hover:text-black shrink-0 opacity-0 group-hover:opacity-100 font-black shrink-0" />
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
