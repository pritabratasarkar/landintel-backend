/**
 * LandIntel Right Intelligence Panel
 * The central decision-support dashboard for the selected land acquisition project.
 * Smart India Hackathon Problem Statement 26017
 * 
 * Layout Architecture:
 * 1. Project Header (Name, executing agency, district/state, category, risk score gauge)
 * 2. Visual Analytics Section (Risk Dimensions Radar Chart + Delay Factors Contribution Pie/Donut Chart)
 * 3. Project Information Menu (Collapsible navigation for existing data modules)
 * 4. Selected Detail Section (Rich domain information for the chosen menu item)
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Scale,
  Trees,
  Users,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  Building2,
  TrendingUp,
  X,
  Layers,
  ArrowUpRight,
  CheckCircle,
  BarChart3,
  Compass,
  HeartHandshake,
  Milestone,
  PieChart as PieIcon,
  Radar as RadarIcon,
  Layers2,
  Home,
  Info,
  Calendar,
  BookOpen,
  Menu,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { Project, RiskFactors, RiskLevel } from '../types';
import { getRiskTheme, getFactorSeverityColor, RISK_CONFIG } from '../config/riskConfig';
import { useTheme } from '../context/ThemeContext';

interface ProjectDetailPanelProps {
  project: Project | null;
  allProjects?: Project[];
  onClose: () => void;
  onSelectNearbyProject: (projectId: string) => void;
  onSelectProject?: (project: Project) => void;
}

export type MenuSectionId =
  | 'overview'
  | 'sentiment'
  | 'problems'
  | 'recommendations'
  | 'legal'
  | 'compensation'
  | 'rr'
  | 'environment'
  | 'timeline'
  | 'sources';

const FACTOR_COLORS: Record<string, string> = {
  legal: '#ef4444',
  compensation: '#f59e0b',
  rehabilitation: '#8b5cf6',
  environment: '#10b981',
  documentation: '#3b82f6',
  social: '#ec4899',
  historicalDelay: '#64748b',
};

const FACTOR_LABELS: Record<string, string> = {
  legal: 'Legal Disputes',
  compensation: 'Compensation',
  rehabilitation: 'R&R Resettlement',
  environment: 'Environmental',
  documentation: 'Title & Records',
  social: 'Social Sentiment',
  historicalDelay: 'Historical Delay',
};

export const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({
  project,
  allProjects = [],
  onClose,
  onSelectNearbyProject,
  onSelectProject,
}) => {
  const { theme: appTheme } = useTheme();

  // Active section in the information menu (defaults to 'overview')
  const [selectedSection, setSelectedSection] = useState<MenuSectionId>('overview');
  // State for whether the project information hamburger menu is open
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  // Allow toggling expansion of the detail section
  const [isSectionExpanded, setIsSectionExpanded] = useState<boolean>(true);
  // Chart visual view toggle: 'radar' | 'donut' | 'both'
  const [chartView, setChartView] = useState<'radar' | 'donut' | 'both'>('both');
  // Search query inside project list view when no project is selected
  const [listSearchQuery, setListSearchQuery] = useState<string>('');

  const riskLevel = project?.risk?.level || 'MEDIUM';
  const theme = getRiskTheme(riskLevel);

  // -------------------------------------------------------------
  // DATA PREPARATION FOR RADAR & PIE/DONUT CHARTS
  // -------------------------------------------------------------
  const factors = project?.risk?.factors;

  // Radar Chart Data from actual factors
  const radarData = useMemo(() => {
    if (!factors) return [];
    return [
      { dimension: 'Legal', value: factors.legal ?? 0, fullMark: 100 },
      { dimension: 'Compensation', value: factors.compensation ?? 0, fullMark: 100 },
      { dimension: 'R&R', value: factors.rehabilitation ?? 0, fullMark: 100 },
      { dimension: 'Environment', value: factors.environment ?? 0, fullMark: 100 },
      { dimension: 'Title & Records', value: factors.documentation ?? 0, fullMark: 100 },
      { dimension: 'Sentiment', value: factors.social ?? 0, fullMark: 100 },
      { dimension: 'Hist. Delay', value: factors.historicalDelay ?? 0, fullMark: 100 },
    ];
  }, [factors]);

  // Pie / Donut Chart Data showing relative contribution of delay factors
  const { pieData, totalFactorScore, hasSufficientFactorData } = useMemo(() => {
    if (!factors) {
      return { pieData: [], totalFactorScore: 0, hasSufficientFactorData: false };
    }

    const items = [
      { key: 'legal', name: 'Legal Disputes', value: factors.legal || 0, color: FACTOR_COLORS.legal },
      { key: 'compensation', name: 'Compensation', value: factors.compensation || 0, color: FACTOR_COLORS.compensation },
      { key: 'rehabilitation', name: 'R&R Package', value: factors.rehabilitation || 0, color: FACTOR_COLORS.rehabilitation },
      { key: 'environment', name: 'Environmental', value: factors.environment || 0, color: FACTOR_COLORS.environment },
      { key: 'documentation', name: 'Title / Records', value: factors.documentation || 0, color: FACTOR_COLORS.documentation },
      { key: 'social', name: 'Public Sentiment', value: factors.social || 0, color: FACTOR_COLORS.social },
      { key: 'historicalDelay', name: 'Historical Delay', value: factors.historicalDelay || 0, color: FACTOR_COLORS.historicalDelay },
    ].filter(item => item.value > 0);

    const total = items.reduce((acc, curr) => acc + curr.value, 0);
    const hasData = items.length >= 2 && total > 0;

    return {
      pieData: items.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      })),
      totalFactorScore: total,
      hasSufficientFactorData: hasData,
    };
  }, [factors]);

  // -------------------------------------------------------------
  // AVAILABLE INFORMATION MENU ITEMS (ONLY IF DATA EXISTS)
  // -------------------------------------------------------------
  const menuItems = useMemo(() => {
    if (!project) return [];
    const items: Array<{
      id: MenuSectionId;
      label: string;
      icon: any;
      count?: number | string;
    }> = [];

    // 1. Overview is always available
    items.push({
      id: 'overview',
      label: 'Overview',
      icon: Home,
    });

    // 2. Public Sentiment
    if (project.communitySentiment) {
      items.push({
        id: 'sentiment',
        label: 'Public Sentiment',
        icon: Users,
        count: project.communitySentiment.status,
      });
    }

    // 3. Risk Factors / Problems
    if ((project.risk?.keyReasons && project.risk.keyReasons.length > 0) || factors) {
      items.push({
        id: 'problems',
        label: 'Risk Factors / Problems',
        icon: AlertTriangle,
        count: project.risk?.keyReasons?.length || undefined,
      });
    }

    // 4. Recommendations / Solutions
    if (project.recommendations && project.recommendations.length > 0) {
      items.push({
        id: 'recommendations',
        label: 'Recommendations / Solutions',
        icon: Sparkles,
        count: project.recommendations.length,
      });
    }

    // 5. Legal
    if (project.legalIssues && project.legalIssues.length > 0) {
      items.push({
        id: 'legal',
        label: 'Legal Stays',
        icon: Scale,
        count: project.legalIssues.length,
      });
    }

    // 6. Compensation
    if (project.compensation) {
      items.push({
        id: 'compensation',
        label: 'Compensation',
        icon: FileText,
        count: `${project.compensation.disbursedPct || 0}%`,
      });
    }

    // 7. Rehabilitation & Resettlement (R&R)
    if (
      project.compensation &&
      (project.compensation.rrPackageStatus ||
        project.compensation.resettlementColoniesPlanned > 0 ||
        project.compensation.affectedFamilies > 0)
    ) {
      items.push({
        id: 'rr',
        label: 'R&R Resettlement',
        icon: HeartHandshake,
        count: project.compensation.rrPackageStatus || undefined,
      });
    }

    // 8. Environmental
    if (project.environmentalFactors && project.environmentalFactors.length > 0) {
      items.push({
        id: 'environment',
        label: 'Environmental',
        icon: Trees,
        count: project.environmentalFactors.length,
      });
    }

    // 9. Timeline & Milestones
    if (
      (project.timeline && project.timeline.length > 0) ||
      (project.statutoryTimeline && project.statutoryTimeline.length > 0)
    ) {
      items.push({
        id: 'timeline',
        label: 'Timeline & Milestones',
        icon: Calendar,
        count: project.timeline?.length || project.statutoryTimeline?.length || undefined,
      });
    }

    // 10. Evidentiary Sources
    if (project.sources && project.sources.length > 0) {
      items.push({
        id: 'sources',
        label: 'Sources',
        icon: BookOpen,
        count: project.sources.length,
      });
    }

    return items;
  }, [project, factors]);

  // Handle menu click with auto-scroll
  const handleMenuClick = (sectionId: MenuSectionId) => {
    setSelectedSection(sectionId);
    setIsSectionExpanded(true);
    setIsMenuOpen(false);

    // Auto-scroll to selected section content
    setTimeout(() => {
      const targetElement = document.getElementById(`section-${sectionId}`) || document.getElementById('selected-detail-section');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const chartTextColor = appTheme === 'dark' ? '#cbd5e1' : '#475569';
  const chartGridColor = appTheme === 'dark' ? '#334155' : '#e2e8f0';

  // If no project is selected (e.g. X button clicked), show the complete project dataset
  if (!project) {
    const displayList = allProjects.filter(p => {
      if (!listSearchQuery.trim()) return true;
      const q = listSearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });

    return (
      <aside
        id="right-project-panel"
        className="w-full lg:w-[460px] xl:w-[500px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 overflow-hidden select-none z-20 transition-colors shadow-sm"
      >
        {/* Panel Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  All Infrastructure Projects ({allProjects.length})
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Select a corridor to view delay risks & GIS intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={listSearchQuery}
              onChange={e => setListSearchQuery(e.target.value)}
              placeholder="Search by project name, district, or category..."
              className="w-full px-3 py-1.5 pl-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
            />
            <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {listSearchQuery && (
              <button
                onClick={() => setListSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Project Dataset List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No projects found matching &ldquo;{listSearchQuery}&rdquo;
            </div>
          ) : (
            displayList.map(p => {
              const pTheme = getRiskTheme(p.risk?.level);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (onSelectProject) onSelectProject(p);
                    else onSelectNearbyProject(p.id);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col gap-2 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {p.id} &bull; {p.category} &bull; {p.executingAgency}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate mt-0.5">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{p.district}, {p.state}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: pTheme.hex }}
                      >
                        {p.risk?.score ?? 0}/100
                      </span>
                      <span className="text-[9px] font-bold" style={{ color: pTheme.hex }}>
                        {p.risk?.level ?? 'MEDIUM'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-mono">
                    <span>Est. Delay: <strong className="text-slate-700 dark:text-slate-200">~{p.risk?.estimatedDelayMonths || 0} Mo</strong></span>
                    <span>Acquisition: <strong className="text-blue-600 dark:text-blue-400">{p.acquisitionProgressPct || 0}%</strong></span>
                    <span>Budget: <strong className="text-slate-700 dark:text-slate-200">₹{p.budgetCr} Cr</strong></span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="right-project-panel"
      className="w-full lg:w-[460px] xl:w-[500px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 overflow-hidden select-none z-20 shadow-lg transition-colors relative"
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER: PROJECT NAME & PRIMARY IDENTITY            */}
      {/* ========================================================= */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="truncate">{project.executingAgency || 'Executing Agency'}</span>
              <span>&bull;</span>
              <span>{project.category}</span>
            </div>

            {/* Selected Project Name (prominent at top) */}
            <h2
              id="selected-project-title"
              className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate"
              title={project.name}
            >
              {project.name}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">
                {project.district}, {project.state}
              </span>
            </div>
          </div>

          {/* Top Right Actions: [ X ] followed directly by [ ☰ ] */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              id="btn-close-project-panel"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Close Panel"
              aria-label="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              id="btn-project-info-menu"
              onClick={() => setIsMenuOpen(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${
                isMenuOpen
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title="Project Information"
              aria-label="Project Information"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Priority Quick Metrics Banner */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          {/* Risk Score */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Risk Index
            </span>
            <div
              className="mt-0.5 px-2 py-0.2 rounded-lg font-mono font-extrabold text-sm text-white shadow-sm"
              style={{ backgroundColor: theme.hex }}
            >
              {project.risk?.score || 0} / 100
            </div>
            <span className="text-[10px] font-bold mt-0.5" style={{ color: theme.hex }}>
              {project.risk?.level || 'MEDIUM'}
            </span>
          </div>

          {/* Delay Slippage */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Est. Delay
            </span>
            <div className="mt-0.5 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
              ~{project.risk?.estimatedDelayMonths || 0} Mo
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              {Math.round((project.risk?.delayProbability || 0) * 100)}% Prob.
            </span>
          </div>

          {/* Physical Land Progress */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Acquisition
            </span>
            <div className="mt-0.5 font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
              {project.acquisitionProgressPct || 0}%
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-full">
              {project.landAcquiredAcres}/{project.landRequiredAcres} Ac
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ☰ PROJECT INFORMATION MENU (OPENED VIA HAMBURGER BUTTON)  */}
      {/* ========================================================= */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay for outside tap/click dismiss */}
          <div
            className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Dropdown Card */}
          <div
            id="project-information-popup-menu"
            className="absolute top-20 right-3 left-3 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-3.5 space-y-2.5 max-h-[75vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Menu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Project Information Menu
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Select a section to display in the right panel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar space-y-1.5 pr-1 flex-1 py-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isSelected = selectedSection === item.id;

                return (
                  <button
                    key={item.id}
                    id={`menu-item-${item.id}`}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between gap-2 group ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate text-xs">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.count !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        {/* ========================================================= */}
        {/* 2. VISUAL ANALYTICS: RADAR & PIE/DONUT CHARTS            */}
        {/* ========================================================= */}
        <section
          id="visual-analytics-section"
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Delay & Risk Analytics</span>
            </div>

            {/* View Switcher Controls */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-medium">
              <button
                onClick={() => setChartView('radar')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  chartView === 'radar'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="View Radar Chart Only"
              >
                <RadarIcon className="w-3 h-3" />
                <span>Radar</span>
              </button>
              <button
                onClick={() => setChartView('donut')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  chartView === 'donut'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="View Delay Factors Donut Chart Only"
              >
                <PieIcon className="w-3 h-3" />
                <span>Donut</span>
              </button>
              <button
                onClick={() => setChartView('both')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  chartView === 'both'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="View Both Charts"
              >
                <span>Dual</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              chartView === 'both' ? 'grid-cols-1' : 'grid-cols-1'
            }`}
          >
            {/* 1. RADAR CHART */}
            {(chartView === 'radar' || chartView === 'both') && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <RadarIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>Risk Dimensions Radar (7-Axis)</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    Scale 0–100
                  </span>
                </div>

                {radarData.length > 0 ? (
                  <div className="w-full h-52 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="72%"
                        data={radarData}
                        margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                      >
                        <PolarGrid stroke={chartGridColor} strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: chartTextColor, fontSize: 10, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: chartTextColor, fontSize: 8 }}
                          stroke={chartGridColor}
                        />
                        <Radar
                          name={project.name}
                          dataKey="value"
                          stroke={theme.hex || '#3b82f6'}
                          fill={theme.hex || '#3b82f6'}
                          fillOpacity={0.35}
                          strokeWidth={2}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const val = data.value;
                              const color = getFactorSeverityColor(val);
                              return (
                                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg shadow-xl text-xs z-50">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">
                                    {data.dimension}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-slate-500 dark:text-slate-400">Risk Score:</span>
                                    <div className="font-mono">
                                      <span className="font-bold" style={{ color: color.hex }}>
                                        {val}
                                      </span>
                                      <span className="text-slate-400 font-normal"> / 100</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                    Insufficient dimension data for radar visualization
                  </div>
                )}
              </div>
            )}

            {/* 2. PIE / DONUT CHART */}
            {(chartView === 'donut' || chartView === 'both') && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <PieIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Major Delay Factor Contributions</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    Relative Share %
                  </span>
                </div>

                {hasSufficientFactorData ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-48 min-h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map(entry => (
                              <Cell
                                key={entry.key}
                                fill={entry.color}
                                stroke={appTheme === 'dark' ? '#0f172a' : '#ffffff'}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg shadow-xl text-xs z-50">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: data.color }}
                                      />
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {data.name}
                                      </span>
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 mt-1">
                                      Factor Value: <strong className="text-slate-700 dark:text-slate-200 font-mono">{data.value}</strong>
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                      Contribution Share: <strong className="text-blue-600 dark:text-blue-400 font-mono">{data.percentage}%</strong>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Legend Chips */}
                    <div className="grid grid-cols-2 gap-1.5 w-full pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      {pieData.map(entry => (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between p-1 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-400 truncate">
                              {entry.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 ml-1">
                            {entry.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-1.5 text-slate-400">
                    <AlertTriangle className="w-5 h-5 mx-auto text-amber-500/80" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Insufficient factor data
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                      Factor values are unavailable or unpopulated for this corridor profile.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. SELECTED DETAIL SECTION (RENDERED FOR CHOSEN MENU ITEM) */}
        {/* ========================================================= */}
        {isSectionExpanded ? (
          <section
            id="selected-detail-section"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            {/* Section Header with active title, menu shortcut, and collapse toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const activeItem = menuItems.find(m => m.id === selectedSection);
                  const ActiveIcon = activeItem?.icon || Home;
                  return (
                    <>
                      <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ActiveIcon className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider truncate">
                        {activeItem?.label || 'Project Information'}
                      </h3>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                  title="Open Project Information Menu"
                >
                  <Menu className="w-3 h-3" />
                  <span>Sections</span>
                </button>

                <button
                  onClick={() => setIsSectionExpanded(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5"
                  title="Collapse Section"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DETAIL SECTION 1: OVERVIEW */}
            {selectedSection === 'overview' && (
              <div id="section-overview" className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Project Budget</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
                      ₹{project.budgetCr} Cr
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Target Completion</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
                      {project.targetCompletionYear}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Affected Mouzas / Villages</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {project.affectedVillagesCount} Revenue Mouzas
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Projected Displaced Families</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {project.affectedFamiliesCount} Families
                    </span>
                  </div>
                </div>

                {/* Historical Pattern Insight */}
                {project.historicalPatternInsight && (
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Regional Precedent & Correlation Insight</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {project.historicalPatternInsight}
                    </p>
                  </div>
                )}

                {/* Nearby Historical Projects */}
                {project.nearbyProjects && project.nearbyProjects.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Nearby Historical Reference Corridors
                    </span>
                    <div className="space-y-1.5">
                      {project.nearbyProjects.map(nb => (
                        <div
                          key={nb.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {nb.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {nb.distanceKm} km away &bull; Final Delay: {nb.finalDelayMonths} mo &bull; Similarity: {nb.similarityScore}%
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                              Challenge: {nb.acquisitionChallenge}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DETAIL SECTION 2: PUBLIC SENTIMENT */}
            {selectedSection === 'sentiment' && project.communitySentiment && (
              <div id="section-sentiment" className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Overall Public Acceptance
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        project.communitySentiment.status === 'OPPOSED' ||
                        project.communitySentiment.status === 'CONCERNED'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {project.communitySentiment.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">
                      Top Local Concern:{' '}
                      <strong>
                        {project.communitySentiment.concerns?.[0] ||
                          'Fair market compensation multiplier & R&R plot handover'}
                      </strong>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Confidence Level: <strong>{project.communitySentiment.confidence}</strong> (Grounded across {project.affectedVillagesCount} revenue villages)
                    </div>
                    {project.communitySentiment.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
                        {project.communitySentiment.notes}
                      </p>
                    )}
                  </div>
                </div>

                {project.communitySentiment.positiveThemes &&
                  project.communitySentiment.positiveThemes.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs block">
                        Community Positive Themes
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                        {project.communitySentiment.positiveThemes.map((thm, i) => (
                          <li key={i}>{thm}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {/* DETAIL SECTION 3: RISK FACTORS / PROBLEMS */}
            {selectedSection === 'problems' && (
              <div id="section-problems" className="space-y-3 text-xs">
                {/* Delay Bottlenecks */}
                {project.risk?.keyReasons && project.risk.keyReasons.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Primary Delay Bottlenecks ({project.risk.keyReasons.length})</span>
                    </span>
                    <ul className="space-y-2">
                      {project.risk.keyReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Factors Score Breakdown Bars */}
                {factors && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                      ML Predictive Factor Scores
                    </span>
                    <div className="space-y-2">
                      {Object.entries(factors).map(([key, rawVal]) => {
                        const val = typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0;
                        const label = FACTOR_LABELS[key] || key;
                        const color = getFactorSeverityColor(val);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700 dark:text-slate-300">{label}</span>
                              <div className="font-mono">
                                <span className="font-bold" style={{ color: color.hex }}>
                                  {val}
                                </span>
                                <span className="text-slate-400 font-normal"> / 100</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${val}%`, backgroundColor: color.hex }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DETAIL SECTION 4: RECOMMENDATIONS / SOLUTIONS */}
            {selectedSection === 'recommendations' && project.recommendations && (
              <div id="section-recommendations" className="space-y-2 text-xs">
                {project.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {rec.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          rec.priority === 1
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                            : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                        }`}
                      >
                        Priority #{rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {rec.reason}
                    </p>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[10px] space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">
                        Expected Impact: <strong className="text-emerald-600 dark:text-emerald-400">{rec.expectedImpact}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Lead Authority: <strong>{rec.responsibleAuthority}</strong></span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Timeline: {rec.actionTimeline}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DETAIL SECTION 5: LEGAL STAYS */}
            {selectedSection === 'legal' && (
              <div id="section-legal" className="space-y-2 text-xs">
                {(!project.legalIssues || project.legalIssues.length === 0) ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No active judicial stays filed against this corridor.
                  </div>
                ) : (
                  project.legalIssues.map(leg => (
                    <div
                      key={leg.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {leg.caseNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          {leg.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        {leg.court} &bull; {leg.petitioner}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {leg.subject}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>Stayed Land: {leg.affectedAreaAcres} Acres</span>
                        <span>{leg.affectedParcelsCount} Disputed Parcels</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* DETAIL SECTION 6: COMPENSATION */}
            {selectedSection === 'compensation' && project.compensation && (
              <div id="section-compensation" className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    RFCTLARR 2013 Award Disbursement Progress
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {project.compensation.disbursedPct || 0}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${project.compensation.disbursedPct || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total Required</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      ₹{project.compensation.totalRequiredCr} Cr
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Disbursed to Date</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{project.compensation.disbursedCr} Cr
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Disputed Parcels</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                      {project.compensation.totalDisputedCases} Cases
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Beneficiary Families</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {project.compensation.affectedFamilies} Families
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DETAIL SECTION 7: REHABILITATION & RESETTLEMENT */}
            {selectedSection === 'rr' && project.compensation && (
              <div id="section-rr" className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      R&R Package Status
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.compensation.rrPackageStatus === 'SATISFACTORY'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {project.compensation.rrPackageStatus || 'PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Colonies Planned</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {project.compensation.resettlementColoniesPlanned} Sites
                      </span>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Colonies Completed</span>
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                        {project.compensation.resettlementColoniesBuilt} Handed Over
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DETAIL SECTION 8: ENVIRONMENTAL */}
            {selectedSection === 'environment' && (
              <div id="section-environment" className="space-y-2 text-xs">
                {(project.environmentalFactors || []).map(env => (
                  <div
                    key={env.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {env.name} ({env.type})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          env.clearanceStatus === 'GRANTED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {env.clearanceStatus}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      {env.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Covered Area: {env.areaAcres} Acres</span>
                      <span>Statute: {env.statutoryAct}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DETAIL SECTION 9: TIMELINE & MILESTONES */}
            {selectedSection === 'timeline' && (
              <div id="section-timeline" className="space-y-3 text-xs">
                <div className="relative pl-4 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {(project.timeline || []).map((m, idx) => (
                    <div key={idx} className="relative pl-4 space-y-1">
                      <div
                        className={`absolute -left-4 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          m.severity === 'LOW'
                            ? 'bg-emerald-500 border-emerald-300 text-white'
                            : m.severity === 'MEDIUM'
                            ? 'bg-amber-500 border-amber-300 text-white'
                            : 'bg-rose-500 border-rose-300 text-white animate-pulse'
                        }`}
                      >
                        {m.severity === 'LOW' && <CheckCircle className="w-2.5 h-2.5" />}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {m.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {m.year}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          {m.description}
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Category: {m.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DETAIL SECTION 10: SOURCES */}
            {selectedSection === 'sources' && (
              <div id="section-sources" className="space-y-2 text-xs">
                {(project.sources && project.sources.length > 0 ? project.sources : [
                  { id: '1', title: 'MoRTH Bhoomi Rashi Portal', excerpt: 'Section 3A, 3D & 3G gazette milestone records', issuingAuthority: 'Ministry of Road Transport & Highways' },
                  { id: '2', title: 'Calcutta High Court Case Registry', excerpt: 'Writ petitions and interim stay orders under RFCTLARR Act 2013', issuingAuthority: 'Judicial Registry' },
                  { id: '3', title: 'PARIVESH Portal (MOEF&CC)', excerpt: 'Stage-I and Stage-II forest clearance proceedings', issuingAuthority: 'Ministry of Environment, Forest & Climate Change' },
                  { id: '4', title: 'Banglarbhumi Land Records Registry', excerpt: 'Circle rates and village plot parcel cadastre', issuingAuthority: 'Directorate of Land Records & Surveys' },
                ]).map((src, i) => (
                  <div
                    key={src.id || i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {src.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {src.excerpt}
                    </div>
                    {src.issuingAuthority && (
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                        Authority: {src.issuingAuthority}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {menuItems.find(m => m.id === selectedSection)?.label || 'Project Information'} (Collapsed)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>Menu</span>
              </button>
              <button
                onClick={() => setIsSectionExpanded(true)}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>Expand</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
