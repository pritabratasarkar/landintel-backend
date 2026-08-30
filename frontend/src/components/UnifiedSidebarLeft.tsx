/**
 * Unified Left Navigation & Decision Support Sidebar
 * Smart India Hackathon Problem Statement 26017:
 * "Predictive Analytics System for Early Detection of Land Acquisition Delays"
 * 
 * Features:
 * - Single cohesive left navigation (320px expanded, 56px collapsed rail)
 * - Mode 1: Corridor Directory & GIS Spatial Layers (Search, Filters, Layers, List)
 * - Mode 2: AI Decision Support Copilot (Recent history sessions, context chip, grounded risk intelligence chat)
 * - Persistent session history in localStorage
 * - Automatic map resize triggering on expand/collapse transitions
 * - Full Light/Dark theme compatibility
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Layers,
  MapPin,
  Building2,
  Trees,
  Droplets,
  ShieldAlert,
  Scale,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
  Sparkles,
  Send,
  PlusCircle,
  MessageSquare,
  Trash2,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  FileText,
  Activity,
  Compass,
} from 'lucide-react';
import { Project, GISLayerConfig, RiskLevel, ChatMessage, AISession } from '../types';
import { getRiskTheme } from '../config/riskConfig';
import { queryAIAssistant, INITIAL_AI_SESSIONS } from '../services/aiAssistantService';
import { AiMessageRenderer } from './AiMessageRenderer';

interface UnifiedSidebarLeftProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  activeTab: 'directory' | 'ai';
  onSelectTab: (tab: 'directory' | 'ai') => void;
  projects: Project[];
  allProjects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  layers: GISLayerConfig[];
  onToggleLayer: (layerId: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  riskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const LOCAL_STORAGE_AI_KEY = 'landintel_ai_sessions_v1';

export const UnifiedSidebarLeft: React.FC<UnifiedSidebarLeftProps> = ({
  isExpanded,
  onToggleExpand,
  activeTab,
  onSelectTab,
  projects,
  allProjects,
  selectedProject,
  onSelectProject,
  layers,
  onToggleLayer,
  statusFilter,
  onStatusFilterChange,
  riskFilter,
  onRiskFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  // Collapsible sections state
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(true);
  const [isLayersExpanded, setIsLayersExpanded] = useState<boolean>(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);

  // AI Assistant states with localStorage persistence
  const [sessions, setSessions] = useState<AISession[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_AI_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_AI_SESSIONS;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(
    sessions[0]?.id || INITIAL_AI_SESSIONS[0].id
  );
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_AI_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Active AI Session
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId) || sessions[0];
  }, [sessions, currentSessionId]);

  // Auto-scroll chat stream
  useEffect(() => {
    if (isExpanded && activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isTyping, isExpanded, activeTab]);

  // Dispatch window resize event on transition so Leaflet resizes canvas smoothly
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 220);
    return () => clearTimeout(timer);
  }, [isExpanded, activeTab]);

  // Start a new analysis session
  const handleStartNewSession = () => {
    const newSession: AISession = {
      id: `session-${Date.now()}`,
      title: selectedProject
        ? `${selectedProject.name.slice(0, 22)}... Analysis`
        : 'New Risk Investigation',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projectId: selectedProject?.id,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          role: 'assistant',
          content: selectedProject
            ? `Targeted decision session initiated for **${selectedProject.name}** (${selectedProject.district}, ${selectedProject.state}).\n\n- **Composite Risk Score**: ${selectedProject.risk.score}/100 (${selectedProject.risk.level})\n- **Estimated Delay**: ~${selectedProject.risk.estimatedDelayMonths} Months\n- **Acquisition Physical Progress**: ${selectedProject.acquisitionProgressPct}%\n\nHow can I help you evaluate statutory roadblocks or prioritize mitigation?`
            : `Welcome to the **LandIntel AI Decision Support Copilot**. Ask me to analyze corridor delay risks, examine statutory roadblocks (3A/3C/3G milestones), or compare regional acquisition difficulties.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            'Why is this project at risk?',
            'What are the primary delay factors?',
            'What intervention should be prioritized?',
            'Which project needs immediate attention?',
          ],
        },
      ],
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleStartNewSession();
      return;
    }
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(remaining[0].id);
    }
  };

  // Send AI message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedProjectId: selectedProject?.id,
    };

    // Append user message
    setSessions(prev =>
      prev.map(s =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              title: s.messages.length === 1 ? text.slice(0, 26) + '...' : s.title,
            }
          : s
      )
    );

    setIsTyping(true);

    try {
      const assistantReply = await queryAIAssistant(text, selectedProject, allProjects);

      setSessions(prev =>
        prev.map(s =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, assistantReply] }
            : s
        )
      );
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content:
          'Unable to synthesize response at this moment. Please verify corridor selection or retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions(prev =>
        prev.map(s =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // -------------------------------------------------------------
  // COLLAPSED RAIL MODE
  // -------------------------------------------------------------
  if (!isExpanded) {
    return (
      <aside className="w-14 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 shrink-0 h-full select-none z-20 transition-all shadow-sm">
        {/* Toggle Expand */}
        <button
          onClick={onToggleExpand}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          title="Expand Left Navigation Sidebar"
        >
          <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>

        {/* Directory & Layers Tab */}
        <button
          onClick={() => {
            onSelectTab('directory');
            onToggleExpand();
          }}
          className={`p-2.5 rounded-xl transition-all mb-2 relative ${
            activeTab === 'directory'
              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700/50'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Corridor Directory & GIS Layers"
        >
          <Layers className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* AI Decision Copilot Tab */}
        <button
          onClick={() => {
            onSelectTab('ai');
            onToggleExpand();
          }}
          className={`p-2.5 rounded-xl transition-all mb-2 relative ${
            activeTab === 'ai'
              ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-700/50'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="AI Decision Support Copilot"
        >
          <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        {/* Search Shortcut */}
        <button
          onClick={() => {
            onSelectTab('directory');
            onToggleExpand();
          }}
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          title="Search Corridors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Project Count Pill */}
        <div className="mt-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {projects.length}
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // EXPANDED SIDEBAR MODE
  // -------------------------------------------------------------
  return (
    <aside className="w-80 md:w-[340px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-full overflow-hidden select-none z-20 shadow-sm transition-all">
      {/* Top Header & Collapse Button */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-xs tracking-tight text-slate-900 dark:text-white">
              LandIntel Navigation
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              SIH Problem 26017
            </span>
          </div>
        </div>

        <button
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Collapse Left Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher Segmented Tabs */}
      <div className="px-3 pt-2.5 pb-2 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => onSelectTab('directory')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Directory & GIS</span>
          </button>

          <button
            onClick={() => onSelectTab('ai')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: DIRECTORY & GIS LAYERS                            */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-unified-search"
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search corridor, district, state..."
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Directory Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Collapsible Section: Filters */}
            <div className="bg-white dark:bg-slate-900">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Filters & Classification</span>
                </span>
                {isFilterExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isFilterExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 text-xs">
                  {/* Status Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['ALL', 'ACTIVE', 'DELAYED', 'COMPLETED'].map(status => (
                        <button
                          key={status}
                          onClick={() => onStatusFilterChange(status)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                            statusFilter === status
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {status === 'ALL'
                            ? 'All'
                            : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Risk Level Filter */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Risk Tier
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW_MEDIUM', 'LOW'].map(risk => {
                        const isSelected = riskFilter === risk;
                        return (
                          <button
                            key={risk}
                            onClick={() => onRiskFilterChange(risk)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                              isSelected
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {risk.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Section: GIS Layers */}
            <div className="bg-white dark:bg-slate-900">
              <button
                onClick={() => setIsLayersExpanded(!isLayersExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Spatial GIS Layers</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {layers.filter(l => l.visible).length}/{layers.length}
                  </span>
                  {isLayersExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </button>

              {isLayersExpanded && (
                <div className="px-3 pb-3 space-y-1">
                  {layers.map(layer => (
                    <label
                      key={layer.id}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={() => onToggleLayer(layer.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                        />
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {layer.name}
                        </span>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Project Directory List */}
            <div className="p-3 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Corridor Directory
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                  {projects.length} Corridors
                </span>
              </div>

              <div className="space-y-1.5">
                {projects.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No corridors match active filter criteria.
                  </div>
                ) : (
                  projects.map(project => {
                    const isSelected = selectedProject?.id === project.id;
                    const theme = getRiskTheme(project.risk?.level || 'MEDIUM');
                    const score = project.risk?.score ?? 50;

                    return (
                      <div
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm'
                            : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isSelected
                                    ? 'text-blue-700 dark:text-blue-300 font-bold'
                                    : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                }`}
                              >
                                {project.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {project.district}, {project.state}
                              </span>
                            </div>
                          </div>

                          {/* Risk Score Badge */}
                          <div
                            className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: theme.hex }}
                          >
                            {score}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${project.acquisitionProgressPct}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold">
                            {project.acquisitionProgressPct}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: AI DECISION SUPPORT COPILOT                       */}
      {/* ========================================================= */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* New Analysis Trigger & History Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0 space-y-2">
            <button
              onClick={handleStartNewSession}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Analysis Session</span>
            </button>

            {/* Collapsible Recent Sessions Drawer */}
            <div>
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 pt-1"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Recent Analysis Sessions ({sessions.length})</span>
                </span>
                {isHistoryExpanded ? (
                  <ChevronUp className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {isHistoryExpanded && (
                <div className="mt-1.5 max-h-28 overflow-y-auto custom-scrollbar space-y-1">
                  {sessions.map(s => {
                    const isCurrent = s.id === currentSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setCurrentSessionId(s.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate flex-1 pr-1">{s.title}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {s.timestamp.split(' ')[0]}
                          </span>
                          {sessions.length > 1 && (
                            <button
                              onClick={e => handleDeleteSession(s.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Target Project Context Chip */}
          {selectedProject && (
            <div className="px-3 py-1.5 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/50 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  Target:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {selectedProject.name}
                  </strong>
                </span>
              </div>
              <span
                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-white shrink-0"
                style={{ backgroundColor: getRiskTheme(selectedProject.risk.level).hex }}
              >
                {selectedProject.risk.score}/100
              </span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {(currentSession?.messages || []).map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <AiMessageRenderer content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-line font-sans">{msg.content}</div>
                  )}

                  {/* Suggested Rapid Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Suggested Inquiries:
                      </span>
                      <div className="flex flex-col gap-1">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(action)}
                            className="text-left px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] transition-colors"
                          >
                            &rarr; {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-1 text-[9px] text-right opacity-60 font-mono">
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-fit">
                <Bot className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span className="font-mono text-[11px]">Evaluating statutory indicators...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Ask about delays, milestones, or risks..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-sm"
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
