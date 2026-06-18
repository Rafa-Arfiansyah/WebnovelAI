import React, { useState, useEffect } from "react";
import { Chapter, SlopAnalysis, SlopIssue, ChapterVersion, IssueActionStatus, VocabAnalysis, VocabIssue } from "../../types";
import { dbStore } from "../../dbStore";
import { useChapterDrafting } from "../../hooks";
import { EmptyState } from "../ui";
import { 
  Edit, Eye, ShieldCheck, History, BookOpen
} from "lucide-react";

import ChapterDraftingArea from "./ChapterDraftingArea";
import ChapterProofreader from "./ChapterProofreader";
import { ChapterAntiSlopAudit, ChapterVocabChecker } from "../quality-tools";
import ChapterSnapshotsPanel from "./ChapterSnapshotsPanel";

interface ChapterEditorProps {
  projectId: string;
  chapters: Chapter[];
  selectedChapterId: string | null;
  onRefreshChapters: () => void;
  onNavigateToModule: (module: string) => void;
}

export default function ChapterEditor({
  projectId,
  chapters,
  selectedChapterId,
  onRefreshChapters,
  onNavigateToModule
}: ChapterEditorProps) {
  const activeChapter = chapters.find(c => c.id === selectedChapterId);

  // Unconditional hook usage for drafting and auto-saving
  const {
    editorContent,
    setEditorContent,
    wordCount,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    handleFindReplace
  } = useChapterDrafting(activeChapter, onRefreshChapters);

  // Sub-navigation Module Active Tab
  const [activeTab, setActiveTab] = useState<"write" | "audit" | "issues" | "snapshots" | "vocabulary">("write");

  // Core Editor states
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [rollbackVersionId, setRollbackVersionId] = useState<string | null>(null);

  // AI Analyzer states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<SlopAnalysis | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // AI Vocabulary states
  const [isAnalyzingVocab, setIsAnalyzingVocab] = useState(false);
  const [activeVocabAnalysis, setActiveVocabAnalysis] = useState<VocabAnalysis | null>(null);

  // AI Polish states
  const [polishQuery, setPolishQuery] = useState("");
  const [selectedTextToPolish, setSelectedTextToPolish] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedDiffResult, setPolishedDiffResult] = useState<string | null>(null);

  // Sync state initially when active chapter loads
  useEffect(() => {
    if (activeChapter) {
      setActiveAnalysis(activeChapter.latestAnalysis || null);
      setActiveVocabAnalysis(activeChapter.latestVocabAnalysis || null);
    } else {
      setActiveAnalysis(null);
      setActiveVocabAnalysis(null);
    }
    setSelectedIssueId(null);
    setPolishedDiffResult(null);
  }, [selectedChapterId]);


  if (!activeChapter) {
    return (
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 h-[60vh] flex items-center justify-center">
        <EmptyState 
          icon={<Edit size={24} />}
          title="No Chapter Loaded inside Editor"
          description="Select a manuscript chapter on the left Planner or draft one under Generator to begin line editing."
        />
      </div>
    );
  }

  // Run full structural Slop Analyzer
  const handleRunSlopAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await dbStore.analyzeSlop(editorContent);
      
      const mappedIssues: SlopIssue[] = (result.issues || []).map((issue: any, index: number) => ({
        ...issue,
        id: `local-issue-${index}-${Date.now()}`,
        status: IssueActionStatus.Pending
      }));

      const fullAnalysis: SlopAnalysis = {
        overallScore: result.overallScore,
        scores: result.scores,
        issues: mappedIssues,
        analyzedAt: new Date().toISOString()
      };

      setActiveAnalysis(fullAnalysis);
      setSelectedIssueId(null);

      const history = activeChapter.analysisHistory || [];
      const updatedHistory = [
        ...history, 
        { overallScore: result.overallScore, analyzedAt: new Date().toISOString() }
      ].slice(-5);

      dbStore.updateChapter(activeChapter.id, {
        slopScore: result.overallScore,
        analysisHistory: updatedHistory,
        latestAnalysis: fullAnalysis
      });

      onRefreshChapters();
      setActiveTab("issues");
    } catch (err: any) {
      console.error(err);
      alert("Error analyzing slop: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Perform AI line polish of a specific highlighted passage
  const handlePolishPassage = async () => {
    if (!selectedTextToPolish.trim() || !polishQuery.trim()) return;
    setIsPolishing(true);
    try {
      const polished = await dbStore.polishText(selectedTextToPolish, polishQuery, "Webnovel Editor Style");
      setPolishedDiffResult(polished);
    } catch (err: any) {
      alert("Failed to polish text: " + err.message);
    } finally {
      setIsPolishing(false);
    }
  };

  // Accept polished diff replace
  const handleAcceptPolishDiff = () => {
    if (!polishedDiffResult) return;
    const updated = editorContent.replace(selectedTextToPolish, polishedDiffResult);
    setEditorContent(updated);
    setPolishedDiffResult(null);
    setSelectedTextToPolish("");
    setPolishQuery("");
  };

  // Accept specific anti-slop suggestions
  const handleAcceptIssueSuggestion = (issueId: string, suggestion: string) => {
    if (!activeAnalysis) return;
    const targetIssue = activeAnalysis.issues.find(i => i.id === issueId);
    if (!targetIssue) return;

    if (editorContent.includes(targetIssue.originalText)) {
      const updatedText = editorContent.replace(targetIssue.originalText, suggestion);
      setEditorContent(updatedText);

      const updatedIssues = activeAnalysis.issues.map(iss => {
        if (iss.id === issueId) {
          return { ...iss, status: IssueActionStatus.Accepted, originalText: suggestion };
        }
        return iss;
      });

      const updatedAnalysis = { ...activeAnalysis, issues: updatedIssues };
      setActiveAnalysis(updatedAnalysis);
      dbStore.updateChapter(activeChapter.id, { latestAnalysis: updatedAnalysis });
      setSelectedIssueId(null);
      onRefreshChapters();
    } else {
      alert("Matched paragraph was already edited. Re-run analysis to index text coordinates.");
    }
  };

  // Reject an anti-slop issue
  const handleRejectIssue = (issueId: string) => {
    if (!activeAnalysis) return;
    const updatedIssues = activeAnalysis.issues.map(iss => {
      if (iss.id === issueId) {
        return { ...iss, status: IssueActionStatus.Rejected };
      }
      return iss;
    });
    const updatedAnalysis = { ...activeAnalysis, issues: updatedIssues };
    setActiveAnalysis(updatedAnalysis);
    dbStore.updateChapter(activeChapter.id, { latestAnalysis: updatedAnalysis });
    setSelectedIssueId(null);
    onRefreshChapters();
  };

  // Run full structural Vocabulary simplicity analyzer
  const handleRunVocabAnalysis = async () => {
    setIsAnalyzingVocab(true);
    try {
      const result = await dbStore.analyzeVocab(editorContent);
      
      const mappedIssues: VocabIssue[] = (result.issues || []).map((issue: any, index: number) => ({
        ...issue,
        id: `local-vocab-${index}-${Date.now()}`,
        status: IssueActionStatus.Pending
      }));

      const fullAnalysis: VocabAnalysis = {
        issues: mappedIssues,
        analyzedAt: new Date().toISOString()
      };

      setActiveVocabAnalysis(fullAnalysis);
      dbStore.updateChapter(activeChapter.id, {
        latestVocabAnalysis: fullAnalysis
      });

      onRefreshChapters();
    } catch (err: any) {
      console.error(err);
      alert("Error scanning vocabulary: " + err.message);
    } finally {
      setIsAnalyzingVocab(false);
    }
  };

  // Accept specific simplified vocabulary suggestion
  const handleAcceptVocabSuggestion = (issueId: string, suggestion: string) => {
    if (!activeVocabAnalysis) return;
    const targetIssue = activeVocabAnalysis.issues.find(i => i.id === issueId);
    if (!targetIssue) return;

    if (editorContent.includes(targetIssue.originalText)) {
      const updatedText = editorContent.replace(targetIssue.originalText, suggestion);
      setEditorContent(updatedText);

      const updatedIssues = activeVocabAnalysis.issues.map(iss => {
        if (iss.id === issueId) {
          return { ...iss, status: IssueActionStatus.Accepted, originalText: suggestion };
        }
        return iss;
      });

      const updatedAnalysis = { ...activeVocabAnalysis, issues: updatedIssues };
      setActiveVocabAnalysis(updatedAnalysis);
      dbStore.updateChapter(activeChapter.id, { latestVocabAnalysis: updatedAnalysis });
      onRefreshChapters();
    } else {
      alert("Matched paragraph was already edited. Re-run simplicity scan to index text coordinates.");
    }
  };

  // Reject/dismiss a vocabulary suggestion
  const handleRejectVocabIssue = (issueId: string) => {
    if (!activeVocabAnalysis) return;
    const updatedIssues = activeVocabAnalysis.issues.map(iss => {
      if (iss.id === issueId) {
        return { ...iss, status: IssueActionStatus.Rejected };
      }
      return iss;
    });
    const updatedAnalysis = { ...activeVocabAnalysis, issues: updatedIssues };
    setActiveVocabAnalysis(updatedAnalysis);
    dbStore.updateChapter(activeChapter.id, { latestVocabAnalysis: updatedAnalysis });
    onRefreshChapters();
  };

  // Create snapshotted manual backup version
  const handleSaveVersionSnapshot = () => {
    const label = newVersionLabel.trim() || `Manual Snapshot ${(activeChapter.versions || []).length + 1}`;
    const newVer: ChapterVersion = {
      id: `ver-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label,
      content: editorContent,
      wordCount
    };

    const updatedVersions = [...(activeChapter.versions || []), newVer];
    dbStore.updateChapter(activeChapter.id, { versions: updatedVersions });
    setNewVersionLabel("");
    onRefreshChapters();
    alert("Chapter snapshot successfully archived!");
  };

  // Capture text selection for custom polishing tool
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedStr = selection.toString().trim();
      if (selectedStr.length > 5 && selectedStr.length < 500) {
        setSelectedTextToPolish(selectedStr);
      }
    }
  };

  // Format and highlight proofreader content preview
  const renderProofreaderPreview = () => {
    if (!editorContent) return "<p class='text-white/30 italic font-mono'>Manuscript typist workspace is completely empty</p>";
    if (!activeAnalysis || activeAnalysis.issues.filter(i => i.status === IssueActionStatus.Pending).length === 0) {
      return editorContent;
    }

    let renderedHTML = editorContent;
    activeAnalysis.issues
      .filter(iss => iss.status === IssueActionStatus.Pending)
      .forEach(iss => {
        const escapedText = iss.originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        try {
          const colorClass = 
            iss.category === "PurpleProse" ? "border-b-2 border-indigo-400 dark:border-indigo-500 bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 font-bold cursor-pointer rounded px-1 py-0.5" :
            iss.category === "Adverb" ? "border-b-2 border-rose-400 dark:border-rose-500 bg-rose-500/15 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 font-bold cursor-pointer rounded px-1 py-0.5" :
            iss.category === "Cliché" ? "border-b-2 border-amber-400 dark:border-amber-500 bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold cursor-pointer rounded px-1 py-0.5" :
            "border-b-2 border-emerald-600 dark:border-[#00FF88] bg-emerald-500/15 dark:bg-[#00FF88]/25 text-emerald-800 dark:text-[#00FF88] font-bold cursor-pointer rounded px-1 py-0.5";

          const replacement = `<span class="${colorClass}" data-issue-id="${iss.id}" title="Anti-Slop: Click to fix ${iss.category}">${iss.originalText}</span>`;
          renderedHTML = renderedHTML.replace(new RegExp(escapedText, "i"), replacement);
        } catch (e) {
          console.warn("Highlighter mismatch escape:", e);
        }
      });

    return renderedHTML;
  };

  // Event listener to capture clicks from highlights
  const handlePreviewPanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const issueId = target.getAttribute("data-issue-id");
    if (issueId) {
      setSelectedIssueId(issueId);
      setActiveTab("issues");
      setTimeout(() => {
        const el = document.getElementById(`issue-card-${issueId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  const pendingIssues = activeAnalysis
    ? activeAnalysis.issues.filter(i => i.status === IssueActionStatus.Pending)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="editor-root" onMouseUp={handleTextSelection}>
      
      {/* 1. Header Segment Ribbon (Sub-navbar) spanning full width */}
      <div className="lg:col-span-12">
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xl">
          <div className="text-left flex items-center gap-3">
            <div className="p-2.5 bg-[#00FF88]/10 rounded-xl border border-[#00FF88]/15">
              <Edit size={16} className="text-[#00FF88]" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-white/40 font-bold uppercase tracking-widest block font-mono">ACTIVE CHAPTER MANUSCRIPT</span>
              <h3 className="font-extrabold text-xs text-white tracking-tight mt-0.5">
                Editing: <span className="text-[#00FF88]">Chap {activeChapter.chapterNumber}: {activeChapter.title}</span>
              </h3>
            </div>
          </div>

          {/* Elegant top tabs dividing features inside Chapter Editor */}
          <div className="flex flex-wrap border border-white/10 bg-[#0A0A0A] rounded-xl p-1 text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 ${
                activeTab === "write"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Edit size={13} />
              <span>Drafting Area</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 ${
                activeTab === "audit"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Eye size={13} />
              <span>Proofreader Highlights</span>
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 ${
                activeTab === "issues"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <ShieldCheck size={13} />
              <span>Anti-Slop Audit</span>
              {pendingIssues.length > 0 && (
                <span className={`text-[9.5px] rounded-full px-1.5 py-0.5 font-bold font-mono ${
                  activeTab === "issues" ? "bg-black/15 text-black" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {pendingIssues.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("vocabulary")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 ${
                activeTab === "vocabulary"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <BookOpen size={13} />
              <span>Vocab Simplifier</span>
              {activeVocabAnalysis && activeVocabAnalysis.issues.filter(i => i.status === IssueActionStatus.Pending).length > 0 && (
                <span className={`text-[9.5px] rounded-full px-1.5 py-0.5 font-bold font-mono ${
                  activeTab === "vocabulary" ? "bg-black/15 text-black" : "bg-[#00D1FF]/10 text-[#00D1FF]"
                }`}>
                  {activeVocabAnalysis.issues.filter(i => i.status === IssueActionStatus.Pending).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("snapshots")}
              className={`px-3 py-1.5 font-bold uppercase rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-0 ${
                activeTab === "snapshots"
                  ? "bg-[#00FF88] text-black font-black shadow-[0_2px_8px_rgba(0,255,136,0.15)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <History size={13} />
              <span>Snapshots & Backups</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Workspace Body */}
      <div className="lg:col-span-12">
        <div className="space-y-6">

          {/* TAB CONTENT: ✍️ Drafting Area */}
          {activeTab === "write" && (
            <ChapterDraftingArea
              activeChapter={activeChapter}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              wordCount={wordCount}
            />
          )}

          {/* TAB CONTENT: 🔍 Proofreader Highlights */}
          {activeTab === "audit" && (
            <ChapterProofreader
              editorContent={editorContent}
              pendingIssuesCount={pendingIssues.length}
              renderProofreaderPreview={renderProofreaderPreview}
              handlePreviewPanelClick={handlePreviewPanelClick}
              selectedTextToPolish={selectedTextToPolish}
              setSelectedTextToPolish={setSelectedTextToPolish}
              polishQuery={polishQuery}
              setPolishQuery={setPolishQuery}
              isPolishing={isPolishing}
              polishedDiffResult={polishedDiffResult}
              setPolishedDiffResult={setPolishedDiffResult}
              handlePolishPassage={handlePolishPassage}
              handleAcceptPolishDiff={handleAcceptPolishDiff}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB CONTENT: 📋 Anti-Slop Audit */}
          {activeTab === "issues" && (
            <ChapterAntiSlopAudit
              activeAnalysis={activeAnalysis}
              isAnalyzing={isAnalyzing}
              pendingIssues={pendingIssues}
              selectedIssueId={selectedIssueId}
              setSelectedIssueId={setSelectedIssueId}
              handleRunSlopAnalysis={handleRunSlopAnalysis}
              handleRejectIssue={handleRejectIssue}
              handleAcceptIssueSuggestion={handleAcceptIssueSuggestion}
            />
          )}

          {/* TAB CONTENT: 📖 Vocab Simplifier */}
          {activeTab === "vocabulary" && (
            <ChapterVocabChecker
              activeVocabAnalysis={activeVocabAnalysis}
              isAnalyzingVocab={isAnalyzingVocab}
              handleRunVocabAnalysis={handleRunVocabAnalysis}
              handleRejectVocabIssue={handleRejectVocabIssue}
              handleAcceptVocabSuggestion={handleAcceptVocabSuggestion}
              editorContent={editorContent}
            />
          )}

          {/* TAB CONTENT: ⚙️ Version Snapshots */}
          {activeTab === "snapshots" && (
            <ChapterSnapshotsPanel
              activeChapter={activeChapter}
              newVersionLabel={newVersionLabel}
              setNewVersionLabel={setNewVersionLabel}
              rollbackVersionId={rollbackVersionId}
              setRollbackVersionId={setRollbackVersionId}
              handleSaveVersionSnapshot={handleSaveVersionSnapshot}
              setEditorContent={setEditorContent}
              onRefreshChapters={onRefreshChapters}
              findText={findText}
              setFindText={setFindText}
              replaceText={replaceText}
              setReplaceText={setReplaceText}
              handleFindReplace={handleFindReplace}
            />
          )}

        </div>
      </div>

    </div>
  );
}
