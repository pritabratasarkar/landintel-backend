/**
 * LandIntel - Land Acquisition Intelligence & Project Risk Assessment Platform
 * Smart India Hackathon (SIH) Problem Statement 26017
 * "Predictive Analytics System for Early Detection of Land Acquisition Delays"
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { UnifiedSidebarLeft } from './components/UnifiedSidebarLeft';
import { MapContainer } from './components/MapContainer';
import { ProjectDetailPanel } from './components/ProjectDetailPanel';
import { ProjectComparisonModal } from './components/ProjectComparisonModal';
import { MethodologyModal } from './components/MethodologyModal';
import { FeatureInspectorModal } from './components/FeatureInspectorModal';
import { AttentionProjectsDrawer } from './components/AttentionProjectsDrawer';
import { AnalyticsView } from './components/AnalyticsView';
import { RiskPredictorModal } from './components/RiskPredictorModal';
import {
  getProjects,
  getGisLayers,
  getDashboardSummary,
  checkBackendHealth,
  getApiStatus,
  detectProjectsNeedingAttention,
} from './services/api';
import { Project, GISLayerConfig, DashboardSummary, RiskShiftAlert } from './types';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';

function LandIntelDashboard() {
  // Application Data States
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [layers, setLayers] = useState<GISLayerConfig[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Selection & UI States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [inspectedFeature, setInspectedFeature] = useState<any | null>(null);
  const [compareProjectA, setCompareProjectA] = useState<Project | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isAttentionDrawerOpen, setIsAttentionDrawerOpen] = useState<boolean>(false);
  const [isRiskPredictorOpen, setIsRiskPredictorOpen] = useState<boolean>(false);
  const [activeNavView, setActiveNavView] = useState<'map' | 'comparison' | 'methodology' | 'analytics'>('map');

  // Unified Left Sidebar State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'directory' | 'ai'>('directory');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [bufferRadiusKm, setBufferRadiusKm] = useState<number>(15);

  // Status & Connectivity States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Initial Data Fetch
  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await checkBackendHealth();
      const status = getApiStatus();
      setIsDemoMode(status.isDemoMode);

      const [fetchedProjects, fetchedLayers, fetchedSummary] = await Promise.all([
        getProjects(),
        getGisLayers(),
        getDashboardSummary(),
      ]);

      setAllProjects(fetchedProjects);
      setLayers(fetchedLayers);
      setSummary(fetchedSummary);

      // Auto-select initial featured project (P001 Purulia NH Expansion)
      if (fetchedProjects.length > 0) {
        const initial = fetchedProjects.find(p => p.id === 'P001') || fetchedProjects[0];
        setSelectedProject(initial);
      }
    } catch (err) {
      console.error('Failed to load application data', err);
      setErrorMessage('Unable to load project intelligence data. Please check connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    let list = [...allProjects];

    if (statusFilter !== 'ALL') {
      list = list.filter(p => p.status === statusFilter);
    }

    if (riskFilter !== 'ALL') {
      list = list.filter(p => p.risk.level === riskFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.taluka?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allProjects, statusFilter, riskFilter, searchQuery]);

  // Compute items needing immediate attention
  const attentionItems: RiskShiftAlert[] = useMemo(() => {
    return detectProjectsNeedingAttention(allProjects);
  }, [allProjects]);

  // Handle Layer Toggle
  const handleToggleLayer = React.useCallback((layerId: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  // Handle Nearby Project Click from inside Detail Panel
  const handleSelectNearbyProject = (projectId: string) => {
    const found = allProjects.find(p => p.id === projectId);
    if (found) {
      setSelectedProject(found);
    }
  };

  // Handle View Change from Top Navigation
  const handleNavViewChange = (view: 'map' | 'comparison' | 'methodology' | 'analytics') => {
    setActiveNavView(view);
    if (view === 'comparison') {
      setIsCompareModalOpen(true);
      setIsMethodologyModalOpen(false);
      setIsAnalyticsModalOpen(false);
    } else if (view === 'methodology') {
      setIsMethodologyModalOpen(true);
      setIsCompareModalOpen(false);
      setIsAnalyticsModalOpen(false);
    } else if (view === 'analytics') {
      setIsAnalyticsModalOpen(true);
      setIsCompareModalOpen(false);
      setIsMethodologyModalOpen(false);
    } else {
      setIsCompareModalOpen(false);
      setIsMethodologyModalOpen(false);
      setIsAnalyticsModalOpen(false);
    }
  };

  // Toggle AI Copilot from Header button
  const handleToggleAiCopilot = () => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true);
      setActiveSidebarTab('ai');
    } else {
      if (activeSidebarTab === 'ai') {
        setIsSidebarExpanded(false);
      } else {
        setActiveSidebarTab('ai');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 select-none">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-pulse shadow-lg shadow-blue-500/20">
          <Layers className="w-7 h-7 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-lg text-white font-sans">LandIntel</h2>
          <p className="text-xs text-slate-400 mt-1">Loading land acquisition intelligence & GIS layers...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && allProjects.length === 0) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 select-none">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-md text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-base text-white">Data Service Interruption</h3>
          <p className="text-xs text-slate-400">{errorMessage}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 mx-auto transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        summary={
          summary || {
            totalProjects: allProjects.length,
            highRiskProjects: 3,
            criticalRiskProjects: 2,
            delayedProjects: 2,
            environmentalAlerts: 4,
            legalAlerts: 3,
            totalLandRequiredAcres: 3560,
            avgDelayMonths: 18,
          }
        }
        activeView={activeNavView}
        onViewChange={handleNavViewChange}
        isDemoMode={isDemoMode}
        totalAttentionCount={attentionItems.length}
        onOpenAttentionDrawer={() => setIsAttentionDrawerOpen(true)}
        onOpenAiAssistant={handleToggleAiCopilot}
        isAiAssistantOpen={isSidebarExpanded && activeSidebarTab === 'ai'}
        onOpenRiskPredictor={() => setIsRiskPredictorOpen(true)}
      />

      {/* Main Multi-Pane GIS Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* Unified Left Navigation Rail / Sidebar */}
        <UnifiedSidebarLeft
          isExpanded={isSidebarExpanded}
          onToggleExpand={() => setIsSidebarExpanded(prev => !prev)}
          activeTab={activeSidebarTab}
          onSelectTab={tab => setActiveSidebarTab(tab)}
          projects={filteredProjects}
          allProjects={allProjects}
          selectedProject={selectedProject}
          onSelectProject={proj => setSelectedProject(proj)}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Center: Full-Scale Interactive GIS Map */}
        <section className="flex-1 h-[50vh] md:h-full relative overflow-hidden bg-slate-100 dark:bg-slate-950 min-w-0 min-h-0 isolate z-0">
          <MapContainer
            projects={filteredProjects}
            selectedProject={selectedProject}
            onSelectProject={proj => setSelectedProject(proj)}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            bufferRadiusKm={bufferRadiusKm}
            onInspectFeature={feat => setInspectedFeature(feat)}
          />
        </section>

        {/* Right: Decision Intelligence & Risk Breakdown Panel */}
        <ProjectDetailPanel
          project={selectedProject}
          allProjects={allProjects}
          onClose={() => setSelectedProject(null)}
          onSelectNearbyProject={handleSelectNearbyProject}
          onSelectProject={proj => setSelectedProject(proj)}
        />
      </main>

      {/* Modals, Drawers & Inspection Sheets */}
      {isRiskPredictorOpen && (
        <RiskPredictorModal onClose={() => setIsRiskPredictorOpen(false)} />
      )}

      {isCompareModalOpen && (
        <ProjectComparisonModal
          projects={allProjects}
          initialProjectA={compareProjectA || selectedProject}
          onClose={() => {
            setIsCompareModalOpen(false);
            setActiveNavView('map');
          }}
        />
      )}

      {isMethodologyModalOpen && (
        <MethodologyModal
          onClose={() => {
            setIsMethodologyModalOpen(false);
            setActiveNavView('map');
          }}
        />
      )}

      {isAnalyticsModalOpen && (
        <AnalyticsView
          isOpen={isAnalyticsModalOpen}
          onClose={() => {
            setIsAnalyticsModalOpen(false);
            setActiveNavView('map');
          }}
          projects={allProjects}
          onSelectProjectById={id => {
            const p = allProjects.find(item => item.id === id);
            if (p) setSelectedProject(p);
            setIsAnalyticsModalOpen(false);
            setActiveNavView('map');
          }}
        />
      )}

      <AttentionProjectsDrawer
        isOpen={isAttentionDrawerOpen}
        onClose={() => setIsAttentionDrawerOpen(false)}
        alerts={attentionItems}
        onSelectProject={projectId => {
          const found = allProjects.find(p => p.id === projectId);
          if (found) setSelectedProject(found);
          setIsAttentionDrawerOpen(false);
        }}
      />

      {inspectedFeature && (
        <FeatureInspectorModal
          feature={inspectedFeature}
          onClose={() => setInspectedFeature(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LandIntelDashboard />
    </ThemeProvider>
  );
}
