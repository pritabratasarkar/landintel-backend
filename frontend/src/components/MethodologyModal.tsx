/**
 * LandIntel Methodology & SIH Product Architecture Modal
 * Provides transparency to evaluators on the risk scoring methodology,
 * statutory frameworks, and clean API integration contracts.
 */

import React from 'react';
import {
  Info,
  X,
  Scale,
  Trees,
  Database,
  Code2,
  CheckCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface MethodologyModalProps {
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">LandIntel Intelligence Architecture</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">SIH 2026 Land Acquisition Risk Index (LARI) Framework</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Core Philosophy */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 space-y-2">
            <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300">Product Principle</h3>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              Land acquisition in major Indian infrastructure accounts for over <strong>65% of all project time overruns</strong> and billions in cost escalations. LandIntel acts as an explainable decision-support system that reveals:
              <br />
              <span className="text-slate-900 dark:text-white font-semibold">
                WHERE the risk exists &bull; WHY it exists &bull; WHAT historical precedents support it &bull; WHAT specific statutory actions will unlock the corridor.
              </span>
            </p>
          </div>

          {/* 7-Factor Weighted Index */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>The 7-Factor Land Acquisition Risk Index (LARI)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">1. Legal & Stay Order Risk (25% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Active High Court & Supreme Court writ petitions, status quo orders, and circle-rate multiplier challenges under RFCTLARR Act 2013 Section 26.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">2. Compensation & Valuation Disparity (20% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Solatium gap, non-agricultural valuation objections, un-disbursed award funds, and tribal tenure heirship disputes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">3. Rehabilitation & Resettlement (R&R) (15% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Physical delivery rate of resettlement colonies, alternative homestead plot handovers, and community acceptance.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">4. Environmental & Forest Clearance (15% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Intersections with Reserve Forests (Stage-I/II FCA 1980), Eco-Sensitive Zones (ESZ 10km buffer), CRZ coastal belts, and wildlife corridors.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">5. Historical Delay Precedents (10% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Empirical acquisition durations and dispute outcomes of similar infrastructure projects within a 25 km radius.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">6. Cadastral & Revenue Documentation (8% weight)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Digitized land records (RoR), mutation gaps, joint property fractional shares, and un-surveyed village tracts.
                </p>
              </div>
            </div>
          </div>

          {/* Clean REST API Interface */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>FastAPI REST Backend Contract</span>
            </h3>

            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects <span className="text-slate-400 dark:text-slate-500"># Query parameters: ?status=ACTIVE&amp;risk_level=HIGH&amp;q=Purulia</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125; <span className="text-slate-400 dark:text-slate-500"># Full project payload &amp; boundary GeoJSON</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125;/risk <span className="text-slate-400 dark:text-slate-500"># 7-factor composite score &amp; drivers</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125;/history <span className="text-slate-400 dark:text-slate-500"># Historical milestone events &amp; precedents</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125;/environment <span className="text-slate-400 dark:text-slate-500"># Environmental overlay clearances</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125;/recommendations <span className="text-slate-400 dark:text-slate-500"># Prioritized action plan</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/&#123;id&#125;/sources <span className="text-slate-400 dark:text-slate-500"># Evidentiary citations</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /projects/nearby?lat=...&amp;lng=...&amp;radius=25 <span className="text-slate-400 dark:text-slate-500"># Spatial radius query</span></div>
              <div><span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span> /gis/layers <span className="text-slate-400 dark:text-slate-500"># Available vector &amp; raster GIS layers</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
