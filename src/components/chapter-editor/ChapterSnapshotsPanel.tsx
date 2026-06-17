import React from "react";
import { Chapter } from "../../types";
import { dbStore } from "../../dbStore";
import { History, Save, Search } from "lucide-react";

interface ChapterSnapshotsPanelProps {
  activeChapter: Chapter;
  newVersionLabel: string;
  setNewVersionLabel: (val: string) => void;
  rollbackVersionId: string | null;
  setRollbackVersionId: (val: string | null) => void;
  handleSaveVersionSnapshot: () => void;
  setEditorContent: (val: string) => void;
  onRefreshChapters: () => void;
  findText: string;
  setFindText: (val: string) => void;
  replaceText: string;
  setReplaceText: (val: string) => void;
  handleFindReplace: () => void;
}

export default function ChapterSnapshotsPanel({
  activeChapter,
  newVersionLabel,
  setNewVersionLabel,
  rollbackVersionId,
  setRollbackVersionId,
  handleSaveVersionSnapshot,
  setEditorContent,
  onRefreshChapters,
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  handleFindReplace
}: ChapterSnapshotsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200" id="snapshots-panel">
      {/* Snapshot Backup Vault */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl text-left">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Manual Snapshots Backups</h4>
          <History size={14} className="text-white/40" />
        </div>

        <div className="space-y-3 bg-[#0A0A0A]/50 p-4 rounded-xl border border-white/5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">Create Backup log label</label>
            <input
              type="text"
              placeholder="e.g., before pruning adverb lines"
              value={newVersionLabel}
              onChange={(e) => setNewVersionLabel(e.target.value)}
              className="w-full border border-white/10 bg-[#0A0A0A] text-white p-3 rounded-xl text-xs focus:border-[#00FF88]"
            />
          </div>
          <button
            onClick={handleSaveVersionSnapshot}
            className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-black uppercase text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition border-0 shadow-[0_4px_12px_rgba(0,255,136,0.15)]"
          >
            <Save size={12} />
            <span>Archive current state</span>
          </button>
        </div>

        {/* History version entries lists */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-white/45 uppercase tracking-widest block font-mono">Load older snapshots</label>
          {(activeChapter.versions && activeChapter.versions.length > 0) ? (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {activeChapter.versions.map((ver) => {
                const isRollbackConfirming = rollbackVersionId === ver.id;
                return (
                  <div key={ver.id} className="relative bg-[#0A0A0A] border border-white/10 p-3 rounded-lg text-xs">
                    {isRollbackConfirming ? (
                      <div className="flex justify-between items-center w-full bg-rose-950/95 border border-rose-500/30 p-2 rounded-xl animate-pulse">
                        <span className="text-white font-black text-[10px] uppercase font-mono tracking-widest">Confirm Rollback?</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditorContent(ver.content);
                              dbStore.updateChapter(activeChapter.id, { content: ver.content });
                              setRollbackVersionId(null);
                              onRefreshChapters();
                            }}
                            className="bg-rose-600 text-white font-extrabold text-[9px] px-2 py-1 rounded-md cursor-pointer border-0"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => setRollbackVersionId(null)}
                            className="bg-white/10 text-white font-bold text-[9px] px-2 py-1 rounded-md cursor-pointer border-0"
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full gap-2">
                        <div className="text-left">
                          <div className="text-white font-bold truncate max-w-[180px]">{ver.label}</div>
                          <div className="text-[9px] text-white/40 mt-0.5">{new Date(ver.timestamp).toLocaleString()} ({ver.wordCount} words)</div>
                        </div>
                        <button
                          onClick={() => setRollbackVersionId(ver.id)}
                          className="bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-[#00FF88]/10 cursor-pointer"
                        >
                          Rollback
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center italic text-white/30 py-6 text-xs bg-[#0A0A0A] rounded-xl border border-white/5 font-mono">
              No archived backups logged.
            </div>
          )}
        </div>
      </div>

      {/* Find/Replace tools */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl text-left">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">Find / Replace Tools</h4>
          <Search size={14} className="text-white/40" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">Find text string</label>
            <input
              type="text"
              placeholder="Search string"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              className="w-full border border-white/10 bg-[#0A0A0A] text-white p-3 rounded-xl text-xs focus:border-[#00FF88]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider font-mono">Replace with</label>
            <input
              type="text"
              placeholder="Replace with"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full border border-white/10 bg-[#0A0A0A] text-white p-3 rounded-xl text-xs focus:border-[#00FF88]"
            />
          </div>

          <button
            onClick={handleFindReplace}
            className="w-full bg-[#0A0A0A] border border-white/15 hover:bg-white/5 text-white/70 font-bold uppercase text-[10px] tracking-wider py-2.5 rounded-xl transition duration-200 cursor-pointer"
          >
            Apply Replace String
          </button>
        </div>
      </div>
    </div>
  );
}
