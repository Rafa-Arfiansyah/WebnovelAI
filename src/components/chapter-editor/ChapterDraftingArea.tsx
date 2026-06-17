import React from "react";
import { Chapter } from "../../types";

interface ChapterDraftingAreaProps {
  editorContent: string;
  setEditorContent: (val: string) => void;
  wordCount: number;
  activeChapter: Chapter;
}

export default function ChapterDraftingArea({
  editorContent,
  setEditorContent,
  wordCount,
  activeChapter
}: ChapterDraftingAreaProps) {
  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[60vh] text-left animate-in fade-in duration-200">
      <div className="p-4 border-b border-white/5 bg-[#0D0D0D] flex justify-between items-center">
        <span className="text-[10px] font-bold text-[#00FF88] uppercase tracking-widest font-mono">
          ✏️ Live Drafting Canvas
        </span>
        <span className="text-[9px] text-[#00FF88] font-bold uppercase font-mono tracking-tight bg-[#00FF88]/10 px-2 py-0.5 rounded-md border border-[#00FF88]/10">
          Auto-saver active (1.5s)
        </span>
      </div>

      {/* Text Writing Area */}
      <div className="flex-1 p-6 flex flex-col bg-[#0A0A0A]/20 min-h-[400px]">
        <textarea
          placeholder="Translate your story beats directly here or let Gemini stream a starting draft under the Chapter Generator..."
          value={editorContent}
          onChange={(e) => setEditorContent(e.target.value)}
          className="flex-1 w-full border-0 bg-transparent text-white p-2 text-base focus:outline-none focus:ring-0 resize-none leading-relaxed font-sans min-h-[350px] select-text outline-none focus:border-0"
          id="editor-textarea-context"
        />
      </div>

      {/* Live Info statistics bar */}
      <div className="p-4 border-t border-white/5 bg-[#0D0D0D] flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-white/40 gap-2">
        <span>Manuscript Word Count: <strong className="text-[#00FF88] font-bold">{wordCount} words</strong></span>
        <span>Last modified: {new Date(activeChapter.updatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
