/**
 * LandIntel GIS Feature Inspector
 * Pop-up inspection sheet when user clicks any spatial environmental, forest, or legal polygon.
 */

import React from 'react';
import { X, Trees, Droplets, ShieldAlert, Scale, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface FeatureInspectorModalProps {
  feature: any;
  onClose: () => void;
}

export const FeatureInspectorModal: React.FC<FeatureInspectorModalProps> = ({ feature, onClose }) => {
  if (!feature || !feature.properties) return null;

  const { name, type, sensitivityLevel, areaAcres, regulation, clearanceStatus, description } = feature.properties;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md p-4 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 text-xs text-slate-700 dark:text-slate-200">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              {type === 'FOREST' ? (
                <Trees className="w-4 h-4" />
              ) : type === 'WETLAND' || type === 'RIVER_BASIN' ? (
                <Droplets className="w-4 h-4" />
              ) : type === 'LEGAL_DISPUTE' ? (
                <Scale className="w-4 h-4 text-red-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Spatial GIS Feature &bull; {type}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed my-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {description}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-400">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Sensitivity Level:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{sensitivityLevel}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Covered Area:</span>
            <span className="font-bold text-slate-900 dark:text-white">{areaAcres} Acres</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Statutory Clearance:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{clearanceStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block">Statutory Act:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 truncate block">{regulation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
