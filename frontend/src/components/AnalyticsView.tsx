/**
 * LandIntel District & State Delay Trends Analytics Dashboard
 * Features:
 * - District-wise delay duration & risk index bar charts (Recharts)
 * - Compensation disbursement vs acquisition completion correlation
 * - State-wise comparison highlighting West Bengal prototype dataset
 * - High-risk corridor concentration hot-spots
 */

import React, { useState } from 'react';
import {
  BarChart3,
  X,
  MapPin,
  TrendingUp,
  Scale,
  Building2,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Project, DistrictDelayTrend, StateDelayTrend } from '../types';
import { getDistrictDelayTrends, getStateDelayTrends } from '../services/api';

interface AnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProjectById?: (id: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  isOpen,
  onClose,
  projects,
  onSelectProjectById,
}) => {
  const [activeTab, setActiveTab] = useState<'district' | 'state'>('district');

  if (!isOpen) return null;

  const districtTrends: DistrictDelayTrend[] = getDistrictDelayTrends(projects);
  const stateTrends: StateDelayTrend[] = getStateDelayTrends(projects);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto custom-scrollbar animate-fadeIn">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Spatial & Regional Delay Trend Analytics</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                  SIH 26017 Precedents
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                District and state-level historical acquisition bottlenecks & litigation hotspots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('district')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'district'
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                District-Wise Trends
              </button>
              <button
                onClick={() => setActiveTab('state')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'state'
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                State-Wise Overview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-6">
          {activeTab === 'district' ? (
            <>
              {/* Top KPI Cards for Districts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monitored Districts</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{districtTrends.length}</div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">Active regional jurisdictions</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Highest Delay District</span>
                  <div className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400 truncate">
                    {districtTrends[0]?.district || 'Purulia'}
                  </div>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    Avg ~{districtTrends[0]?.avgDelayMonths} mo slippage
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Active Litigations</span>
                  <div className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {districtTrends.reduce((a, d) => a + d.totalLitigations, 0)}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">High Court & Tribunal stays</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Compensation Disbursed</span>
                  <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round(
                      districtTrends.reduce((a, d) => a + d.avgCompensationPct, 0) /
                        (districtTrends.length || 1)
                    )}%
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Solatium & award awards</span>
                </div>
              </div>

              {/* Chart 1: Average Estimated Delay per District */}
              <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      District-Wise Average Land Acquisition Delay (Months)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Comparison of historical and predicted project schedule slippages
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Higher = Slower</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtTrends} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                      <XAxis
                        dataKey="district"
                        tick={{ fontSize: 11 }}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="avgDelayMonths" name="Avg Delay (Months)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgRiskScore" name="Avg Risk Index (0-100)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Table */}
              <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-3">
                  District Delay & Litigation Matrix
                </h4>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="pb-2">District</th>
                        <th className="pb-2">State</th>
                        <th className="pb-2">Projects</th>
                        <th className="pb-2">Avg Delay</th>
                        <th className="pb-2">Avg Risk</th>
                        <th className="pb-2">Compensation Disbursed</th>
                        <th className="pb-2">High Court Stays</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-700 dark:text-slate-200">
                      {districtTrends.map(d => (
                        <tr key={d.district} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{d.district}</td>
                          <td className="py-2.5 text-slate-500 dark:text-slate-400">{d.state}</td>
                          <td className="py-2.5 font-mono">{d.projectCount}</td>
                          <td className="py-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">~{d.avgDelayMonths} mo</td>
                          <td className="py-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">{d.avgRiskScore}/100</td>
                          <td className="py-2.5 font-mono text-emerald-600 dark:text-emerald-400">{d.avgCompensationPct}%</td>
                          <td className="py-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">{d.totalLitigations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* State Level View */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div className="font-bold text-blue-900 dark:text-blue-200">State-Level Delay Trend Architecture:</div>
                <p className="text-slate-600 dark:text-slate-300">
                  The primary verified research dataset focuses on <strong>West Bengal</strong> (Kolkata, North 24 Parganas, South 24 Parganas, Howrah, Hooghly, Purulia). The multi-state architecture is engineered to ingest NHAI, MoRTH, and PM GatiShakti feeds nationwide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stateTrends.map(st => (
                  <div
                    key={st.state}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{st.state}</h4>
                        {st.isPrototypeDataset && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40">
                            Verified Prototype Dataset
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        Avg ~{st.avgDelayMonths} mo delay
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Projects</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-base">{st.projectCount}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Avg Risk</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">{st.avgRiskScore}/100</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Land Required</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {st.totalLandRequiredAcres} ac
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
