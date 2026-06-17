import { useState, useEffect } from "react";
import { Chapter } from "../types";
import { dbStore } from "../dbStore";

export function useChapterDrafting(
  activeChapter: Chapter | undefined,
  onRefreshChapters: () => void
) {
  const [editorContent, setEditorContent] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Sync state initially when active chapter loads
  useEffect(() => {
    if (activeChapter) {
      setEditorContent(activeChapter.content || "");
    } else {
      setEditorContent("");
    }
  }, [activeChapter?.id]);

  // Auto-save logic
  useEffect(() => {
    if (!activeChapter || editorContent === activeChapter.content) return;
    
    const timeout = setTimeout(() => {
      dbStore.updateChapter(activeChapter.id, { content: editorContent });
      onRefreshChapters();
    }, 1500); // 1.5 seconds draft debounce

    return () => clearTimeout(timeout);
  }, [editorContent, activeChapter?.id, onRefreshChapters]);

  const getCleanWordCount = (text: string): number => {
    const plain = text.replace(/<[^>]*>/g, " ").trim();
    return plain ? plain.split(/\s+/).length : 0;
  };

  const wordCount = getCleanWordCount(editorContent);

  const handleFindReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText, "gi");
    const replaced = editorContent.replace(regex, replaceText);
    setEditorContent(replaced);
    setFindText("");
    setReplaceText("");
  };

  return {
    editorContent,
    setEditorContent,
    wordCount,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    handleFindReplace
  };
}
