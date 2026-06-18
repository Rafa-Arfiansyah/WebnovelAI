import React, { useState, useEffect } from "react";
import { Project, Chapter, Character, Location } from "./types";
import { dbStore } from "./dbStore";

import { Dashboard } from "./components/dashboard";
import { ChapterPlanner } from "./components/chapter-planner";
import { WorldBible } from "./components/world-bible";
import { ChapterGenerator } from "./components/chapter-generator";
import { ChapterEditor } from "./components/chapter-editor";
import SettingsPanel from "./components/SettingsPanel";
import { AuthControl } from "./components/AuthControl";


import { 
  Plus, BookOpen, Clock, BarChart2, ShieldAlert, Archive, 
  Trash2, Layers, Sparkles, Edit, Settings, Users, ArrowRightLeft, 
  ShieldCheck, HelpCircle, FileText, LayoutDashboard, Terminal,
  Sun, Moon, Menu, X, Wifi, WifiOff
} from "lucide-react";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Active UI module tab
  const [activeModule, setActiveModule] = useState<string>("dashboard");

  // Mobile sidebar visible status
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Shared selected chapter reference
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Filtered manuscript items
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Health check API indicators
  const [hasApiKey, setHasApiKey] = useState(false);

  // Light / Dark Theme toggle support
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem("novel-forge-theme") === "light";
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add("light");
      localStorage.setItem("novel-forge-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("novel-forge-theme", "dark");
    }
  }, [isLightMode]);

  const checkApiKeyStatus = () => {
    fetch("/api/health", {
      headers: {
        "x-custom-gemini-key": localStorage.getItem("novelforge_custom_gemini_key") || ""
      }
    })
      .then(res => res.json())
      .then(data => {
        setHasApiKey(data.hasApiKey);
      })
      .catch(() => {
        setHasApiKey(false);
      });
  };

  useEffect(() => {
    refreshAllData();
    checkApiKeyStatus();
  }, []);

  const refreshAllData = () => {
    const list = dbStore.getProjects();
    setProjects(list);

    // Default to first active project if none selected
    if (list.length > 0 && !selectedProjectId) {
      setSelectedProjectId(list[0].id);
    }
  };

  // Sync related items when project selector sweeps
  useEffect(() => {
    if (selectedProjectId) {
      const activeChapters = dbStore.getChapters(selectedProjectId);
      setChapters(activeChapters);
      setCharacters(dbStore.getCharacters(selectedProjectId));
      setLocations(dbStore.getLocations(selectedProjectId));
      
      if (activeChapters.length > 0) {
        setSelectedChapterId(activeChapters[0].id);
      } else {
        setSelectedChapterId(null);
      }
    } else {
      setChapters([]);
      setCharacters([]);
      setLocations([]);
      setSelectedChapterId(null);
    }
  }, [selectedProjectId]);

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Navigation callbacks
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
  };

  const handleNavigateToModule = (module: string) => {
    setActiveModule(module);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-full bg-[#050505] text-[#E0E0E0] font-sans overflow-hidden relative" id="suite-app-root">
      
      {/* Background Graphic Decor */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#00FF88] opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-blue-600 opacity-5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Mobile Sidebar backdrop overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity"
          id="sidebar-overlay"
        />
      )}

      {/* 1. Left Navigation Menu Rail */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-60 bg-[#0A0A0A]/95 lg:bg-[#0A0A0A]/90 backdrop-blur-md border-r border-white/10 p-4.5 flex flex-col justify-between text-white select-none z-40 transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`} id="suite-sidebar">
        <div className="space-y-6">
          {/* Logo element branding with Close toggle for Mobile */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5 justify-start">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#00FF88] to-blue-500 rounded-lg shadow-lg shadow-emerald-500/20"></div>
              <div className="text-left leading-tight">
                <h1 className="font-black text-base font-sans tracking-tight uppercase italic">NOVELFORGE<span className="text-[#00FF88]">.</span>AI</h1>
                <p className="text-[9px] text-[#00FF88] font-mono tracking-[0.15em] font-bold uppercase">QC WRITING SUITE</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core navigational menu block */}
          <nav className="space-y-2 text-left">
            <button
              onClick={() => {
                setActiveModule("dashboard");
                setIsSidebarOpen(false);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                activeModule === "dashboard" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard Core</span>
            </button>

            <button
              onClick={() => {
                if (selectedProjectId) {
                  setActiveModule("planner");
                  setIsSidebarOpen(false);
                }
              }}
              disabled={!selectedProjectId}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                !selectedProjectId ? "opacity-35 cursor-not-allowed" : ""
              } ${
                activeModule === "planner" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <BookOpen size={14} />
              <span>Chapter Planner</span>
            </button>

            <button
              onClick={() => {
                if (selectedProjectId) {
                  setActiveModule("bible");
                  setIsSidebarOpen(false);
                }
              }}
              disabled={!selectedProjectId}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                !selectedProjectId ? "opacity-35 cursor-not-allowed" : ""
              } ${
                activeModule === "bible" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <Users size={14} />
              <span>World Bible Index</span>
            </button>

            <button
              onClick={() => {
                if (selectedProjectId) {
                  setActiveModule("generator");
                  setIsSidebarOpen(false);
                }
              }}
              disabled={!selectedProjectId}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                !selectedProjectId ? "opacity-35 cursor-not-allowed" : ""
              } ${
                activeModule === "generator" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <Sparkles size={14} />
              <span>Chapter Generator</span>
            </button>

            <button
              onClick={() => {
                if (selectedProjectId) {
                  setActiveModule("editor");
                  setIsSidebarOpen(false);
                }
              }}
              disabled={!selectedProjectId}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                !selectedProjectId ? "opacity-35 cursor-not-allowed" : ""
              } ${
                activeModule === "editor" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <Edit size={14} />
              <span>Manuscript Editor</span>
            </button>

            <button
              onClick={() => {
                if (selectedProjectId) {
                  setActiveModule("settings");
                  setIsSidebarOpen(false);
                }
              }}
              disabled={!selectedProjectId}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-3 transition-all duration-300 cursor-pointer ${
                !selectedProjectId ? "opacity-35 cursor-not-allowed" : ""
              } ${
                activeModule === "settings" 
                  ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] font-black" 
                  : "text-white/60 hover:bg-white/5 hover:text-[#00FF88]"
              }`}
            >
              <Settings size={14} />
              <span>Suite Configurations</span>
            </button>
          </nav>
        </div>

        {/* Footer info showing API availability status */}
        <div className="pt-4 border-t border-white/5 space-y-3.5 text-left">
          <AuthControl 
            onRefreshAllData={refreshAllData} 
            onSelectProjectId={handleSelectProject} 
          />
          
          <div className="flex gap-2 items-center text-[10px] font-bold text-white/40 uppercase tracking-wider pt-1">
            {hasApiKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] inline-block animate-pulse shadow-[0_0_8px_#00FF88]"></span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
            )}
            <span className="font-mono text-white/60">{hasApiKey ? "Gemini 3.5 Ready" : "Keys not set"}</span>
          </div>
          <p className="text-[10px] text-white/30 leading-normal font-sans font-medium">
            Designed as a high-fidelity Webnovel writing assistant.
          </p>
        </div>
      </aside>

      {/* 2. Main Center Body Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Global Toolbar Header */}
        <header className="bg-[#0A0A0A]/50 backdrop-blur-md border-b border-white/10 h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 z-15 select-none animate-in fade-in duration-200">
          <div className="flex gap-2 sm:gap-4 items-center flex-wrap min-w-0">
            {/* Hamburger button for small screens */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer mr-1"
              title="Open Navigation"
              id="sidebar-toggle-btn"
            >
              <Menu size={20} />
            </button>
            <span className="text-white/50 text-xs font-bold uppercase tracking-wider font-mono hidden sm:inline">Manuscript:</span>
            {projects.length > 0 ? (
              <select
                value={selectedProjectId || ""}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-[#121212] border border-white/15 hover:border-[#00FF88] p-1.5 px-3 rounded-lg text-xs font-bold text-white focus:outline-none cursor-pointer transition-colors font-mono max-w-[160px] sm:max-w-xs truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            ) : (
              <span className="text-white/40 text-xs italic font-semibold">No Projects Found</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Network Status Badge */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider bg-[#121212] transition-all duration-300 ${
                isOnline 
                  ? "border-[#00FF88]/25 text-[#00FF88]" 
                  : "border-amber-500/25 text-amber-500 animate-pulse"
              }`}
              title={isOnline ? "Koneksi Cloud Aktif" : "Mode Offline (Penyimpanan Lokal Aktif)"}
              id="header-network-status"
            >
              {isOnline ? (
                <>
                  <Wifi size={12} className="text-[#00FF88]" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-amber-500" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="px-3 py-1.5 border border-white/10 rounded-lg bg-[#121212] hover:bg-white/5 hover:border-[#00FF88] text-white cursor-pointer transition-colors flex items-center gap-1.5"
              title="Toggle Theme Mode"
              id="theme-toggle-btn"
            >
              {isLightMode ? (
                <>
                  <Moon size={13} className="text-purple-400" />
                  <span className="text-[10px] uppercase font-mono font-bold text-white/70">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun size={13} className="text-[#00FF88]" />
                  <span className="text-[10px] uppercase font-mono font-bold text-white/70">Light Mode</span>
                </>
              )}
            </button>

            {activeProject && (
              <div className="hidden sm:flex gap-6 text-[10px] font-mono uppercase tracking-wider text-white/40">
                <div>
                  Genre: <strong className="text-white font-bold text-xs">{activeProject.genre}</strong>
                </div>
                <div>
                  Active Chapters: <strong className="text-[#00FF88] font-bold text-xs">{chapters.length}</strong>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Core dynamic content chassis */}
        <section className="flex-1 p-4 sm:p-6 overflow-y-auto relative bg-transparent z-10">
          {activeModule === "dashboard" && (
            <Dashboard
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProjectId}
              projects={projects}
              onRefreshProjects={refreshAllData}
              onNavigateToModule={handleNavigateToModule}
            />
          )}

          {activeModule === "planner" && selectedProjectId && (
            <ChapterPlanner
              projectId={selectedProjectId}
              chapters={chapters}
              characters={characters}
              locations={locations}
              onRefreshChapters={() => setChapters(dbStore.getChapters(selectedProjectId))}
            />
          )}

          {activeModule === "bible" && selectedProjectId && (
            <WorldBible
              projectId={selectedProjectId}
              characters={characters}
              locations={locations}
              onRefreshBible={() => {
                setCharacters(dbStore.getCharacters(selectedProjectId));
                setLocations(dbStore.getLocations(selectedProjectId));
              }}
            />
          )}

          {activeModule === "generator" && selectedProjectId && (
            <ChapterGenerator
              projectId={selectedProjectId}
              chapters={chapters}
              characters={characters}
              locations={locations}
              selectedChapterId={selectedChapterId}
              onSelectChapterId={(id) => setSelectedChapterId(id)}
              onRefreshChapters={() => setChapters(dbStore.getChapters(selectedProjectId))}
              onNavigateToModule={handleNavigateToModule}
            />
          )}

          {activeModule === "editor" && selectedProjectId && (
            <ChapterEditor
              projectId={selectedProjectId}
              chapters={chapters}
              selectedChapterId={selectedChapterId}
              onRefreshChapters={() => setChapters(dbStore.getChapters(selectedProjectId))}
              onNavigateToModule={handleNavigateToModule}
            />
          )}

          {activeModule === "settings" && selectedProjectId && (
            <SettingsPanel
              activeProject={activeProject}
              chapters={chapters}
              onRefreshProject={refreshAllData}
              onApiKeyChange={checkApiKeyStatus}
            />
          )}
        </section>
      </main>

    </div>
  );
}
