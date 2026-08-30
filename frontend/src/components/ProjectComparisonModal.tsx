/**
 * LandIntel Multi-Project Comparative Risk Analyzer
 * Features:
 * - 7-Axis Interactive Radar Chart (Recharts) for multi-factor risk benchmark
 * - Delay Factor Contribution Donut/Pie Chart (Recharts)
 * - Multi-Project Selection (up to 4 infrastructure corridors)
 * - Side-by-side Statutory, Land & Financial Benchmark Matrix
 * - Consistent 5-tier Risk Palette
 */

import React, { useState } from 'react';
import {
  GitCompare,
  X,
  Plus,
  Trash2,
  MapPin,
  TrendingUp,
  Scale,
  Trees,
  FileText,
  Users,
  AlertTriangle,
  Building2,
  PieChart as PieIcon,
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
  Tooltip,
  Legend,
} from 'recharts';
import { Project, RiskFactors } from '../types';
import { getRiskTheme, getFactorSeverityColor } from '../config/riskConfig';

interface ProjectComparisonModalProps {
  projects: Project[];
  initialProjectA: Project | null;
  onClose: () => void;
}

const COMPARISON_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export const ProjectComparisonModal: React.FC<ProjectComparisonModalProps> = ({
  projects,
  initialProjectA,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    initialProjectA?.id || projects[0]?.id || '',
    projects.find(p => p.id !== (initialProjectA?.id || projects[0]?.id))?.id || projects[1]?.id || '',
  ]);

  const selectedProjects = selectedIds
    .map(id => projects.find(p => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const handleAddProject = () => {
    if (selectedIds.length >= 4) return;
    const nextAvailable = projects.find(p => !selectedIds.includes(p.id));
    if (nextAvailable) {
      setSelectedIds([...selectedIds, nextAvailable.id]);
    }
  };

  const handleRemoveProject = (idToRemove: string) => {
    if (selectedIds.length <= 2) return;
    setSelectedIds(selectedIds.filter(id => id !== idToRemove));
  };

  const handleProjectChange = (index: number, newId: string) => {
    const updated = [...selectedIds];
    updated[index] = newId;
    setSelectedIds(updated);
  };

  // Build 7-Axis Radar Chart Data
  const radarData = [
    { factor: 'Legal Disputes', key: 'legal' },
    { factor: 'Compensation & Valuation', key: 'compensation' },
    { factor: 'R&R / Resettlement', key: 'rehabilitation' },
    { factor: 'Environmental & Forest', key: 'environment' },
    { factor: 'Revenue Cadastral Title', key: 'documentation' },
    { factor: 'Social Agitation', key: 'social' },
    { factor: 'Historical Precedent Delay', key: 'historicalDelay' },
  ].map(axis => {
    const row: Record<string, any> = { factor: axis.factor };
    selectedProjects.forEach((proj, idx) => {
      row[`proj_${idx}`] = proj.risk.factors[axis.key as keyof RiskFactors] || 0;
    });
    return row;
  });

  // Build Pie Chart Data for Primary Project
  const primaryProj = selectedProjects[0];
  const pieData = primaryProj
    ? [
        { name: 'Legal Risk', value: primaryProj.risk.factors.legal, color: '#ef4444' },
        { name: 'Compensation', value: primaryProj.risk.factors.compensation, color: '#f59e0b' },
        { name: 'R&R Package', value: primaryProj.risk.factors.rehabilitation, color: '#8b5cf6' },
        { name: 'Environmental', value: primaryProj.risk.factors.environment, color: '#10b981' },
        { name: 'Revenue Title', value: primaryProj.risk.factors.documentation, color: '#3b82f6' },
        { name: 'Social Friction', value: primaryProj.risk.factors.social, color: '#ec4899' },
        { name: 'Historical Reg.', value: primaryProj.risk.factors.historicalDelay, color: '#64748b' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Comparative Risk & Delay Analyzer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-axis spatial, statutory & legal risk benchmarking (SIH 26017)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length < 4 && (
              <button
                onClick={handleAddProject}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project ({selectedIds.length}/4)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-6">
          {/* Project Selectors Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${selectedProjects.length} gap-3`}>
            {selectedProjects.map((proj, idx) => {
              const theme = getRiskTheme(proj.risk.level);
              const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: color }}
                    >
                      Project {String.fromCharCode(65 + idx)}
                    </span>
                    {selectedIds.length > 2 && (
                      <button
                        onClick={() => handleRemoveProject(proj.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={proj.id}
                    onChange={e => handleProjectChange(idx, e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs rounded-lg p-2 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.district}) - Risk: {p.risk.score}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {proj.district}, {proj.state}
                    </span>
                    <span
                      className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: `${theme.hex}20`,
                        color: theme.hex,
                        borderColor: `${theme.hex}40`,
                      }}
                    >
                      {proj.risk.score} / 100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Analytics Row: Radar Chart + Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 7-Axis Radar Chart */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  7-Axis Risk Profile Benchmark (LARI Model)
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Normalized 0-100 Score</span>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="#94a3b844" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="factor"
                      tick={{ fontSize: 10, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 9 }}
                    />
                    {selectedProjects.map((proj, idx) => (
                      <Radar
                        key={proj.id}
                        name={`${proj.name.slice(0, 20)}...`}
                        dataKey={`proj_${idx}`}
                        stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
                        fill={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
                        fillOpacity={0.25}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delay Factor Contribution Donut Chart */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  Delay Factor Share: {primaryProj.name.slice(0, 18)}...
                </h4>
                <PieIcon className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Key Metrics Comparison Table */}
          <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-3">
              Corridor Parameter Benchmarks
            </h4>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-2 font-semibold">Parameter</th>
                    {selectedProjects.map((p, idx) => (
                      <th
                        key={p.id}
                        className="pb-2 font-semibold"
                        style={{ color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }}
                      >
                        Project {String.fromCharCode(65 + idx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Estimated Schedule Delay</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono font-bold text-amber-600 dark:text-amber-400">
                        ~{p.risk?.estimatedDelayMonths || 0} mo ({Math.round((p.risk?.delayProbability || 0) * 100)}%)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Land Required</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono font-bold text-slate-900 dark:text-white">
                        {p.landRequiredAcres} acres
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Acquisition Progress %</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.acquisitionProgressPct}% ({p.landAcquiredAcres} ac)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Project Budget</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹ {p.budgetCr} Cr
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Compensation Disbursed</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono text-slate-700 dark:text-slate-200">
                        {p.compensation?.disbursedPct || 0}% (₹{p.compensation?.disbursedCr || 0} Cr)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Active High Court Stays</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {(p.legalIssues || []).filter(l => l.status === 'STAY_ORDER_ACTIVE').length} active stays
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Affected Households</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 font-mono text-slate-900 dark:text-white">
                        {p.affectedFamiliesCount} families
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500 dark:text-slate-400 font-medium">Primary Delay Driver</td>
                    {selectedProjects.map(p => (
                      <td key={p.id} className="py-2 text-[11px] text-slate-600 dark:text-slate-300 max-w-[200px]">
                        {p.risk?.keyReasons?.[0] || 'Pending revenue awards'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
