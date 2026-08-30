/**
 * LandIntel Left Sidebar
 * Features:
 * - Real-time Project Search & Autocomplete
 * - Status & Risk Filter Toggles
 * - GIS Layer Visibility Manager
 * - Interactive Project Directory with live risk badges
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
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
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Project, GISLayerConfig, RiskLevel, ProjectStatus } from '../types';
import { getRiskTheme, RISK_CONFIG } from '../config/riskConfig';

interface SidebarLeftProps {
  projects: Project[];
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

const LAYER_ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  Clock,
  Trees,
  Droplets,
  ShieldAlert,
  Scale,
  Flame,
};

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  projects,
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
  const [activeTab, setActiveTab] = useState<'layers' | 'directory'>('layers');
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(true);

  // Autocomplete matching
  const matchingProjects = useMemo(() => {
    return projects;
  }, [projects]);

  return (
    <aside className="w-80 md:w-96 bg-slate-900/95 backdrop-blur-md text-slate-200 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-hidden select-none z-20">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 shrink-0 bg-slate-950/60">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-project-search"
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search project, district, state..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Header & Collapsible Drawer */}
      <div className="border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="px-3 py-2 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Filters & Classification</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            {projects.length} matching
          </span>
        </div>

        {isFilterExpanded && (
          <div className="px-3 pb-3 space-y-2 text-xs">
            {/* Status Filter Pills */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Project Status
              </label>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'ACTIVE', 'DELAYED', 'COMPLETED'].map(status => (
                  <button
                    key={status}
                    id={`filter-status-${status.toLowerCase()}`}
                    onClick={() => onStatusFilterChange(status)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Risk Classification
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'All Risks' },
                  { id: 'LOW', label: 'Low', color: 'text-emerald-400' },
                  { id: 'MEDIUM', label: 'Medium', color: 'text-amber-400' },
                  { id: 'HIGH', label: 'High', color: 'text-rose-400' },
                  { id: 'CRITICAL', label: 'Critical', color: 'text-red-500 font-bold' },
                ].map(item => (
                  <button
                    key={item.id}
                    id={`filter-risk-${item.id.toLowerCase()}`}
                    onClick={() => onRiskFilterChange(item.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      riskFilter === item.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: GIS Layers vs Project Directory */}
      <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
        <button
          id="tab-gis-layers"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'layers'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GIS Data Layers</span>
        </button>

        <button
          id="tab-project-directory"
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-blue-500 text-blue-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Project List ({matchingProjects.length})</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'layers' ? (
          /* GIS Layer Manager */
          <div className="space-y-2.5">
            <div className="text-[11px] text-slate-400 font-medium px-1">
              Toggle spatial layers and environmental intelligence overlays on the interactive map:
            </div>

            {layers.map(layer => {
              const IconComponent = LAYER_ICON_MAP[layer.iconName] || Layers;
              return (
                <div
                  key={layer.id}
                  id={`layer-item-${layer.id}`}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    layer.visible
                      ? 'bg-slate-800/80 border-slate-700 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: layer.visible ? `${layer.color}25` : '#1e293b',
                        color: layer.color,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">{layer.name}</span>
                        {layer.featureCount !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                            {layer.featureCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{layer.description}</p>
                    </div>
                  </div>

                  {/* Toggle Checkbox */}
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => {}} // Handled by container click
                    className="mt-1 w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Project Directory List */
          <div className="space-y-2">
            {matchingProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500/70" />
                <p>No projects match the selected filters.</p>
                <button
                  onClick={() => {
                    onStatusFilterChange('ALL');
                    onRiskFilterChange('ALL');
                    onSearchChange('');
                  }}
                  className="mt-2 text-blue-400 underline text-[11px]"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              matchingProjects.map(proj => {
                const theme = getRiskTheme(proj.risk.level);
                const isSelected = selectedProject?.id === proj.id;

                return (
                  <div
                    key={proj.id}
                    id={`project-card-${proj.id}`}
                    onClick={() => onSelectProject(proj)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-800/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {proj.category} &bull; {proj.district}, {proj.state}
                        </span>
                        <h4 className="font-semibold text-xs text-white line-clamp-1 mt-0.5">{proj.name}</h4>
                      </div>

                      {/* Risk Badge */}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 border"
                        style={{
                          backgroundColor: `${theme.hex}20`,
                          color: theme.hex,
                          borderColor: `${theme.hex}40`,
                        }}
                      >
                        {proj.risk.score} / 100
                      </span>
                    </div>

                    {/* Progress & Delay info */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        <span>Acquired: </span>
                        <span className="font-bold text-white font-mono">{proj.acquisitionProgressPct}%</span>
                        <span className="text-[10px] text-slate-500"> ({proj.landAcquiredAcres}/{proj.landRequiredAcres} ac)</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>~{proj.risk.estimatedDelayMonths}mo delay</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
