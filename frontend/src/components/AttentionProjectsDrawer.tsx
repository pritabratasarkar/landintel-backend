/**
 * Projects Needing Immediate Attention Drawer / Modal
 * Identifies projects experiencing risk escalations, newly filed litigations,
 * Stage-II forest rejections, or sudden compensation disputes.
 * Smart India Hackathon Problem Statement 26017
 */

import React from 'react';
import {
  AlertTriangle,
  X,
  ArrowRight,
  TrendingUp,
  Scale,
  Trees,
  ShieldAlert,
  Clock,
  ExternalLink,
  MapPin,
  Flame,
} from 'lucide-react';
import { Project, RiskShiftAlert } from '../types';
import { getRiskTheme } from '../config/riskConfig';

interface AttentionProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RiskShiftAlert[];
  onSelectProject: (projectId: string) => void;
}

export const AttentionProjectsDrawer: React.FC<AttentionProjectsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex justify-end animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Projects Needing Attention
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
                  {alerts.length} Flagged
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Corridors with escalated risk status or active statutory bottlenecks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No projects currently flagged with escalated risk status.
            </div>
          ) : (
            alerts.map(alert => {
              const currentTheme = getRiskTheme(alert.currentRiskLevel);
              const prevTheme = getRiskTheme(alert.previousRiskLevel);

              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    onSelectProject(alert.projectId);
                    onClose();
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 transition-all cursor-pointer space-y-3 group shadow-sm"
                >
                  {/* Title & Risk Shift Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {alert.projectName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {alert.district}, {alert.state}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 line-through">
                        {alert.previousScore}
                      </span>
                      <TrendingUp className="w-3 h-3 text-rose-500" />
                      <span
                        className="text-xs font-mono font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${currentTheme.hex}20`,
                          color: currentTheme.hex,
                          borderColor: `${currentTheme.hex}50`,
                        }}
                      >
                        {alert.currentScore} / 100
                      </span>
                    </div>
                  </div>

                  {/* Transition Indicator */}
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Risk Shift:
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${prevTheme.hex}20`,
                          color: prevTheme.hex,
                        }}
                      >
                        {alert.previousRiskLevel}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${currentTheme.hex}25`,
                          color: currentTheme.hex,
                        }}
                      >
                        {alert.currentRiskLevel}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/50">
                      +{alert.changePoints} pts
                    </span>
                  </div>

                  {/* Root Escalation Cause */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.reason}
                  </p>

                  {/* Priority Recommended Action */}
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] space-y-1">
                    <span className="font-bold text-blue-700 dark:text-blue-300 block">
                      Recommended Immediate Intervention:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {alert.actionRequired}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
