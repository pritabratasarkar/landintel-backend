/**
 * LandIntel Main Top Navigation Bar
 * Decision-Support Dashboard Header for Smart India Hackathon Problem 26017
 */

import React from 'react';
import {
  Layers,
  Sparkles,
  GitCompare,
  BarChart3,
  BellRing,
  Sun,
  Moon,
  Info,
  Database,
  Compass,
  AlertTriangle,
  Flame,
  Scale,
  Trees,
  Activity,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  summary: DashboardSummary;
  activeView: 'map' | 'comparison' | 'methodology' | 'analytics';
  onViewChange: (view: 'map' | 'comparison' | 'methodology' | 'analytics') => void;
  isDemoMode: boolean;
  totalAttentionCount: number;
  onOpenAttentionDrawer?: () => void;
  onOpenAiAssistant?: () => void;
  isAiAssistantOpen?: boolean;
  onOpenRiskPredictor?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  summary,
  activeView,
  onViewChange,
  isDemoMode,
  totalAttentionCount,
  onOpenAttentionDrawer,
  onOpenAiAssistant,
  isAiAssistantOpen = false,
  onOpenRiskPredictor,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30 shrink-0 select-none shadow-sm transition-colors">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                LandIntel
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                SIH 26017
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none hidden sm:block">
              Land Acquisition Delay Intelligence & Early Risk Warning System
            </p>
          </div>
        </div>
      </div>

      {/* Center Operational Pulse KPIs (Desktop Only) */}
      <div className="hidden xl:flex items-center gap-4 px-3 py-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Monitored Corridors */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <div className="text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Corridors: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {summary.totalProjects}
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

        {/* Critical & High Risk */}
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <div className="text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">High/Critical: </span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {summary.highRiskProjects + summary.criticalRiskProjects}
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

        {/* Environmental Roadblocks */}
        <div className="flex items-center gap-2">
          <Trees className="w-3.5 h-3.5 text-amber-500" />
          <div className="text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Forest Lags: </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {summary.environmentalAlerts}
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

        {/* Legal Injunctions */}
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-red-500" />
          <div className="text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Court Stays: </span>
            <span className="font-bold text-red-600 dark:text-red-400 font-mono">
              {summary.legalAlerts}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Navigation */}
      <div className="flex items-center gap-2">
        {/* Primary View Switchers */}
        <nav className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            id="nav-btn-dashboard"
            onClick={() => onViewChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'map'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>GIS Map</span>
          </button>

          <button
            id="nav-btn-compare"
            onClick={() => onViewChange('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'comparison'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            id="nav-btn-analytics"
            onClick={() => onViewChange('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'analytics'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Trends</span>
          </button>

          <button
            id="nav-btn-methodology"
            onClick={() => onViewChange('methodology')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'methodology'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Methodology</span>
          </button>
        </nav>

        {/* Attention Alerts Drawer Trigger Button */}
        {onOpenAttentionDrawer && (
          <button
            id="nav-btn-attention-alerts"
            onClick={onOpenAttentionDrawer}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="View Projects Needing Immediate Attention"
          >
            <BellRing className="w-4 h-4 text-amber-500" />
            <span className="hidden lg:inline">Attention</span>
            {totalAttentionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                {totalAttentionCount}
              </span>
            )}
          </button>
        )}

        {/* Live ML Risk Predictor Trigger Button */}
        {onOpenRiskPredictor && (
          <button
            id="nav-btn-risk-predictor"
            onClick={onOpenRiskPredictor}
            className="p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-slate-700"
            title="Run a live delay-risk prediction using the trained ML model"
          >
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">Predict Risk</span>
          </button>
        )}

        {/* AI Decision Assistant Toggle Button */}
        {onOpenAiAssistant && (
          <button
            id="nav-btn-ai-assistant"
            onClick={onOpenAiAssistant}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              isAiAssistantOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-slate-700'
            }`}
            title="AI Land Acquisition Decision Support Assistant"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden lg:inline">AI Copilot</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-600" />
          )}
        </button>

        {/* Backend / Demo Mode Badge */}
        <div
          id="badge-api-mode"
          title={
            isDemoMode
              ? 'Serving local SIH mock intelligence dataset'
              : 'Connected to live FastAPI backend'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
            isDemoMode
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
          }`}
        >
          <Database className="w-3 h-3" />
          <span>{isDemoMode ? 'DEMO DATA' : 'FASTAPI'}</span>
        </div>
      </div>
    </header>
  );
};
