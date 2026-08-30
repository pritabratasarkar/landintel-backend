/**
 * Live AI Risk Predictor
 * -------------------------------------------------------------
 * Bridges the LandIntel UI to the standalone `land-delay-prediction`
 * XGBoost + SHAP model (see backend/api.py, POST /predict). Unlike the
 * rest of the app this panel does NOT fall back to demo data - if the
 * backend isn't running or the model hasn't been trained yet, it shows
 * that honestly instead of a fabricated score.
 */

import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MLPredictionInput, MLPredictionResult } from '../types';
import { predictProjectDelayRisk } from '../services/api';
import { getRiskTheme } from '../config/riskConfig';

interface RiskPredictorModalProps {
  onClose: () => void;
}

const DISTRICTS = ['Hooghly', 'Howrah', 'Kolkata', 'North 24 Parganas', 'South 24 Parganas'];
const PROJECT_TYPES = ['HIGHWAY', 'INDUSTRIAL', 'INDUSTRIAL_PARK', 'INFRASTRUCTURE', 'OTHER', 'POWER', 'RAILWAY', 'URBAN_DEVELOPMENT'];
const LAND_TYPES = ['Agricultural', 'Mixed', 'Urban', 'Wetland'];
const COMPENSATION_STATUSES = ['Completed', 'Disputed', 'In Progress', 'Not Started'];
const REHAB_STATUSES = ['Completed', 'Delayed', 'In Progress', 'Not Started'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_INPUT: MLPredictionInput = {
  state: 'West Bengal',
  district: 'Howrah',
  project_type: 'HIGHWAY',
  land_type: 'Agricultural',
  land_area_hectares: 25.4,
  affected_families: 60,
  approval_expected_days: 90,
  approval_actual_days: 140,
  compensation_status: 'Disputed',
  compensation_delay_days: 80,
  legal_disputes_count: 2,
  documentation_completeness_pct: 55,
  rehab_status: 'In Progress',
  rehab_progress_pct: 20,
  stakeholder_responsiveness_score: 3.5,
  notification_month: 6,
  notification_year: 2025,
};

/** Turns a raw model feature name (e.g. "compensation_status_Disputed") into
 * something readable ("Compensation status: Disputed"). */
function humanizeFactor(feature: string): string {
  const knownPrefixes = [
    'project_type', 'land_type', 'compensation_status', 'rehab_status', 'district', 'state',
  ];
  for (const prefix of knownPrefixes) {
    if (feature.startsWith(prefix + '_')) {
      const rest = feature.slice(prefix.length + 1).replace(/_/g, ' ');
      const label = prefix.replace(/_/g, ' ');
      return `${label[0].toUpperCase()}${label.slice(1)}: ${rest}`;
    }
  }
  const spaced = feature.replace(/_/g, ' ');
  return spaced[0].toUpperCase() + spaced.slice(1);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export const RiskPredictorModal: React.FC<RiskPredictorModalProps> = ({ onClose }) => {
  const [input, setInput] = useState<MLPredictionInput>(DEFAULT_INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MLPredictionResult | null>(null);

  const update = <K extends keyof MLPredictionInput>(key: K, value: MLPredictionInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const prediction = await predictProjectDelayRisk(input);
      setResult(prediction);
    } catch (err: any) {
      setError(err?.message || 'Prediction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const theme = result ? getRiskTheme(Math.round(result.risk_score * 100)) : null;
  const maxImpact = result ? Math.max(...result.top_factors.map(f => Math.abs(f.impact_strength)), 0.001) : 1;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Live AI Delay Risk Predictor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Runs a real XGBoost model prediction (not demo data) via the FastAPI backend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 p-5 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <Field label="State">
                <input className={inputClass} value={input.state} onChange={e => update('state', e.target.value)} required />
              </Field>
              <Field label="District">
                <select className={inputClass} value={input.district} onChange={e => update('district', e.target.value)}>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Project Type">
                <select className={inputClass} value={input.project_type} onChange={e => update('project_type', e.target.value)}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
              <Field label="Land Type">
                <select className={inputClass} value={input.land_type} onChange={e => update('land_type', e.target.value)}>
                  {LAND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Land Area (hectares)">
                <input type="number" step="0.01" min="0" className={inputClass} value={input.land_area_hectares}
                  onChange={e => update('land_area_hectares', parseFloat(e.target.value) || 0)} required />
              </Field>
              <Field label="Affected Families">
                <input type="number" min="0" className={inputClass} value={input.affected_families}
                  onChange={e => update('affected_families', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Approval Expected (days)">
                <input type="number" min="0" className={inputClass} value={input.approval_expected_days}
                  onChange={e => update('approval_expected_days', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Approval Actual (days)">
                <input type="number" min="0" className={inputClass} value={input.approval_actual_days}
                  onChange={e => update('approval_actual_days', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Compensation Status">
                <select className={inputClass} value={input.compensation_status} onChange={e => update('compensation_status', e.target.value)}>
                  {COMPENSATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Compensation Delay (days)">
                <input type="number" min="0" className={inputClass} value={input.compensation_delay_days}
                  onChange={e => update('compensation_delay_days', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Legal Disputes Count">
                <input type="number" min="0" className={inputClass} value={input.legal_disputes_count}
                  onChange={e => update('legal_disputes_count', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Documentation Completeness (%)">
                <input type="number" min="0" max="100" step="0.1" className={inputClass} value={input.documentation_completeness_pct}
                  onChange={e => update('documentation_completeness_pct', parseFloat(e.target.value) || 0)} required />
              </Field>
              <Field label="Rehab & Resettlement Status">
                <select className={inputClass} value={input.rehab_status} onChange={e => update('rehab_status', e.target.value)}>
                  {REHAB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Rehab Progress (%)">
                <input type="number" min="0" max="100" className={inputClass} value={input.rehab_progress_pct}
                  onChange={e => update('rehab_progress_pct', parseInt(e.target.value) || 0)} required />
              </Field>
              <Field label="Stakeholder Responsiveness (0-10)">
                <input type="number" min="0" max="10" step="0.1" className={inputClass} value={input.stakeholder_responsiveness_score}
                  onChange={e => update('stakeholder_responsiveness_score', parseFloat(e.target.value) || 0)} required />
              </Field>
              <Field label="Notification Month">
                <select className={inputClass} value={input.notification_month} onChange={e => update('notification_month', parseInt(e.target.value))}>
                  {MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                </select>
              </Field>
              <Field label="Notification Year">
                <input type="number" min="2000" max="2100" className={inputClass} value={input.notification_year}
                  onChange={e => update('notification_year', parseInt(e.target.value) || 0)} required />
              </Field>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{isLoading ? 'Running model...' : 'Run Prediction'}</span>
            </button>
          </form>

          {/* Results */}
          <div className="lg:col-span-2 p-5 space-y-4 bg-slate-50 dark:bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Model Output</h3>

            {!result && !error && !isLoading && (
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                Fill in the project features and run the model to get a live delay-risk probability with SHAP-based
                explanations. This calls your local FastAPI backend at <code className="font-mono">/predict</code> -
                make sure it's running (<code className="font-mono">uvicorn api:app --reload</code>) and that
                <code className="font-mono"> models/xgboost_model.pkl</code> has been trained.
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result && theme && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${theme.borderClass} ${theme.bgClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Delay Probability</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badgeClass}`}>
                      {theme.shortLabel} Risk
                    </span>
                  </div>
                  <div className={`text-3xl font-black mt-1 ${theme.textClass}`}>
                    {(result.risk_score * 100).toFixed(1)}%
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${result.risk_score * 100}%`, backgroundColor: theme.hex }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    Model category: <strong>{result.risk_category}</strong> &middot; Prediction ID:{' '}
                    <span className="font-mono">{result.prediction_id}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Top Contributing Factors (SHAP)
                  </h4>
                  {result.top_factors.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No active factors returned.</p>
                  )}
                  {result.top_factors.map((f, idx) => {
                    const pct = (Math.abs(f.impact_strength) / maxImpact) * 100;
                    const isRisk = f.effect === 'increases';
                    return (
                      <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {isRisk ? (
                              <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            {humanizeFactor(f.factor)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                            {f.impact_strength > 0 ? '+' : ''}{f.impact_strength.toFixed(3)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
