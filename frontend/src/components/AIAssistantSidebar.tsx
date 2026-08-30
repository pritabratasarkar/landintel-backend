/**
 * LandIntel Collapsible AI Decision-Support Assistant
 * Smart India Hackathon Problem Statement 26017:
 * "Predictive Analytics System for Early Detection of Land Acquisition Delays"
 * 
 * Features:
 * - Collapsible / Expandable left drawer (ChatGPT / Gemini interaction style)
 * - Grounded decision-support for selected project & cross-corridor risk analytics
 * - Session history management & New Analysis trigger
 * - Suggested rapid prompt chips
 * - Auto map resize event dispatching on expand/collapse
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  PlusCircle,
  Clock,
  Bot,
  User,
  AlertTriangle,
  Scale,
  FileText,
  BarChart3,
  CheckCircle2,
  Trash2,
  Maximize2,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Project, ChatMessage, AISession } from '../types';
import { queryAIAssistant, INITIAL_AI_SESSIONS } from '../services/aiAssistantService';
import { getRiskTheme } from '../config/riskConfig';

interface AIAssistantSidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedProject: Project | null;
  allProjects: Project[];
  onSelectProjectById: (id: string) => void;
}

export const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({
  isExpanded,
  onToggleExpand,
  selectedProject,
  allProjects,
  onSelectProjectById,
}) => {
  const [sessions, setSessions] = useState<AISession[]>(INITIAL_AI_SESSIONS);
  const [currentSessionId, setCurrentSessionId] = useState<string>(INITIAL_AI_SESSIONS[0].id);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  // Auto-scroll messages
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages, isTyping, isExpanded]);

  // Dispatch resize event so Leaflet updates canvas seamlessly on expand/collapse
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Start a new analysis session
  const handleStartNewSession = () => {
    const newSession: AISession = {
      id: `session-${Date.now()}`,
      title: selectedProject ? `${selectedProject.name.slice(0, 24)}... Analysis` : 'New Acquisition Risk Analysis',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      projectId: selectedProject?.id,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          role: 'assistant',
          content: selectedProject
            ? `I have initialized a targeted decision-support session for **${selectedProject.name}** (${selectedProject.district}, ${selectedProject.state}).\n\n- **Risk Score**: ${selectedProject.risk.score}/100 (${selectedProject.risk.level})\n- **Estimated Delay**: ~${selectedProject.risk.estimatedDelayMonths} Months\n- **Acquisition Progress**: ${selectedProject.acquisitionProgressPct}%\n\nHow can I assist your evaluation?`
            : `Welcome to the **LandIntel AI Decision Support Specialist**. How can I help you analyze infrastructure land acquisition delays across our monitored corridors?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: [
            'Why is this project at risk?',
            'What are the major delay factors?',
            'What should the authority prioritize?',
            'Which project needs immediate attention?',
          ],
        },
      ],
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // Send message
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

    // Update active session with user message
    setSessions(prev =>
      prev.map(s =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              title: s.messages.length === 1 ? text.slice(0, 30) + '...' : s.title,
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
            ? {
                ...s,
                messages: [...s.messages, assistantReply],
              }
            : s
        )
      );
    } catch (err) {
      console.error('AI query error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const currentTheme = selectedProject ? getRiskTheme(selectedProject.risk.level) : null;

  // Render Collapsed Slim Rail
  if (!isExpanded) {
    return (
      <aside className="w-12 bg-slate-900/98 dark:bg-slate-950/98 text-slate-200 border-r border-slate-800 flex flex-col items-center py-3 shrink-0 select-none z-30 transition-all">
        <button
          id="btn-expand-ai-sidebar"
          onClick={onToggleExpand}
          title="Open AI Decision Assistant"
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-800 my-3" />

        <button
          onClick={handleStartNewSession}
          title="New Risk Analysis"
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            onToggleExpand();
            setShowHistoryModal(true);
          }}
          title="Analysis History"
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors mt-1"
        >
          <Clock className="w-4 h-4" />
        </button>

        <div className="mt-auto">
          <button
            onClick={onToggleExpand}
            title="Expand Sidebar"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Render Full Expanded AI Sidebar
  return (
    <aside className="w-80 md:w-[380px] lg:w-[400px] bg-slate-900 dark:bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col h-full shrink-0 overflow-hidden select-none z-30 shadow-2xl transition-all">
      {/* Top Header Bar */}
      <div className="p-3 bg-slate-950 dark:bg-slate-900 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">Land Acquisition AI</span>
              <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Decision Support
              </span>
            </div>
            <span className="text-[10px] text-slate-400">SIH 26017 Predictive Model</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStartNewSession}
            title="Start New Analysis"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleExpand}
            title="Collapse Sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Banner: Active Selected Project */}
      {selectedProject ? (
        <div className="px-3 py-2 bg-slate-900/90 dark:bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: currentTheme?.hex || '#3b82f6' }}
            />
            <span className="text-xs font-semibold text-white truncate">
              {selectedProject.name}
            </span>
          </div>
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 border"
            style={{
              backgroundColor: `${currentTheme?.hex}20`,
              color: currentTheme?.hex,
              borderColor: `${currentTheme?.hex}40`,
            }}
          >
            {selectedProject.risk.score} / 100
          </span>
        </div>
      ) : (
        <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/60 text-[11px] text-slate-400 shrink-0">
          Global Portfolio Context ({allProjects.length} corridors)
        </div>
      )}

      {/* Previous Sessions Dropdown / History Bar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="font-medium text-slate-300 truncate max-w-[200px]">
            {currentSession.title}
          </span>
        </div>
        <button
          onClick={() => setShowHistoryModal(!showHistoryModal)}
          className="text-blue-400 hover:text-blue-300 font-semibold"
        >
          {showHistoryModal ? 'Close' : 'Sessions (' + sessions.length + ')'}
        </button>
      </div>

      {/* History Session List Drawer (Conditional) */}
      {showHistoryModal && (
        <div className="p-2 bg-slate-950 border-b border-slate-800 shrink-0 max-h-48 overflow-y-auto custom-scrollbar space-y-1">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                setShowHistoryModal(false);
              }}
              className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                s.id === currentSessionId
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="truncate flex-1 pr-2">
                <div>{s.title}</div>
                <div className="text-[10px] text-slate-500">{s.timestamp}</div>
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSessions(prev => prev.filter(x => x.id !== s.id));
                    if (currentSessionId === s.id) {
                      setCurrentSessionId(sessions.find(x => x.id !== s.id)?.id || '');
                    }
                  }}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {currentSession.messages.map(msg => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white mt-0.5 ${
                  isAssistant
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-900/90 dark:bg-slate-900/80 border border-slate-800 text-slate-200 shadow-sm'
                    : 'bg-blue-600 text-white shadow-md'
                }`}
              >
                {/* Content formatting */}
                <div className="space-y-1.5 whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                <div className="mt-1 text-[9px] text-slate-400 dark:text-slate-500 text-right">
                  {msg.timestamp}
                </div>

                {/* Suggested Follow-up Action Chips */}
                {isAssistant && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(action)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700/80 transition-all text-left"
                      >
                        &rarr; {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <Bot className="w-4 h-4 text-blue-400 animate-spin" />
            <span>Analyzing project risk parameters & statutory precedent records...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Starter Chips */}
      <div className="px-3 pt-2 pb-1 bg-slate-950 dark:bg-slate-900/90 border-t border-slate-800/60 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
          <button
            onClick={() => handleSendMessage('Why is this project at risk?')}
            className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 whitespace-nowrap text-[10px] font-medium shrink-0"
          >
            ❓ Why is it at risk?
          </button>
          <button
            onClick={() => handleSendMessage('What should the authority prioritize?')}
            className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 whitespace-nowrap text-[10px] font-medium shrink-0"
          >
            ⚡ Action Priority
          </button>
          <button
            onClick={() => handleSendMessage('Which project needs immediate attention?')}
            className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 whitespace-nowrap text-[10px] font-medium shrink-0"
          >
            🚨 Urgent Projects
          </button>
          <button
            onClick={() => handleSendMessage('Compare top projects')}
            className="px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 whitespace-nowrap text-[10px] font-medium shrink-0"
          >
            ⚖️ Compare
          </button>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 dark:bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              selectedProject
                ? `Ask about ${selectedProject.name.slice(0, 18)}...`
                : 'Ask AI decision-support specialist...'
            }
            className="flex-1 bg-slate-900 dark:bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
