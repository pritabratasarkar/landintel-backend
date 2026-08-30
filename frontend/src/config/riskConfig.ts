/**
 * Centralized Risk Color & Classification Configuration
 * Implements the unified 5-tier risk classification for SIH 26017:
 * - GREEN: On schedule / progressing well (0-24)
 * - BLUE: Lower delay risk ~20-40% (25-45)
 * - YELLOW/ORANGE: Moderate risk (46-69)
 * - RED: High delay risk (70-84)
 * - BRIGHT/DEEP CRIMSON: Critical delay risk (85-100)
 */

import { RiskLevel } from '../types';

export interface RiskTheme {
  level: RiskLevel;
  minScore: number;
  maxScore: number;
  label: string;
  shortLabel: string;
  hex: string;              // Primary marker / bar color
  fillHex: string;          // Polygon fill color (rgba)
  strokeHex: string;        // Border stroke color
  bgClass: string;          // Tailwind background
  textClass: string;        // Tailwind text color
  borderClass: string;      // Tailwind border
  badgeClass: string;       // Pill badge classes
  pulseClass: string;       // Radar ping effect
  description: string;
}

export const RISK_CONFIG: Record<RiskLevel, RiskTheme> = {
  LOW: {
    level: 'LOW',
    minScore: 0,
    maxScore: 24,
    label: 'Low Delay Risk (On Schedule)',
    shortLabel: 'Low',
    hex: '#10b981',         // Emerald Green
    fillHex: 'rgba(16, 185, 129, 0.28)',
    strokeHex: '#059669',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    pulseClass: '',
    description: 'Acquisition on schedule. Title verification and survey notices proceeding smoothly.',
  },
  LOW_MEDIUM: {
    level: 'LOW_MEDIUM',
    minScore: 25,
    maxScore: 45,
    label: 'Lower Delay Risk (20–40% Delay Prob.)',
    shortLabel: 'Lower',
    hex: '#3b82f6',         // Vibrant Blue
    fillHex: 'rgba(59, 130, 246, 0.28)',
    strokeHex: '#2563eb',
    bgClass: 'bg-blue-500/10 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-500/30',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    pulseClass: '',
    description: 'Lower delay risk. Minor administrative or revenue boundary clarifications required.',
  },
  MEDIUM: {
    level: 'MEDIUM',
    minScore: 46,
    maxScore: 69,
    label: 'Moderate Delay Risk',
    shortLabel: 'Moderate',
    hex: '#f59e0b',         // Warm Amber/Orange
    fillHex: 'rgba(245, 158, 11, 0.28)',
    strokeHex: '#d97706',
    bgClass: 'bg-amber-500/10 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    pulseClass: 'bg-amber-400',
    description: 'Moderate friction in compensation valuation or survey objections. Close monitoring advised.',
  },
  HIGH: {
    level: 'HIGH',
    minScore: 70,
    maxScore: 84,
    label: 'High Delay Risk',
    shortLabel: 'High',
    hex: '#ef4444',         // Red
    fillHex: 'rgba(239, 68, 68, 0.32)',
    strokeHex: '#dc2626',
    bgClass: 'bg-rose-500/10 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300 font-semibold',
    borderClass: 'border-rose-500/30',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
    pulseClass: 'bg-rose-500',
    description: 'Significant legal stay orders, compensation disputes, or pending Stage-II forest clearances.',
  },
  CRITICAL: {
    level: 'CRITICAL',
    minScore: 85,
    maxScore: 100,
    label: 'Critical Delay Risk (Immediate Intervention)',
    shortLabel: 'Critical',
    hex: '#dc2626',         // Intense Crimson / Deep Red
    fillHex: 'rgba(220, 38, 38, 0.40)',
    strokeHex: '#991b1b',
    bgClass: 'bg-red-950/20 dark:bg-red-950/70',
    textClass: 'text-red-900 dark:text-red-300 font-bold',
    borderClass: 'border-red-600/50',
    badgeClass: 'bg-red-100 text-red-900 border border-red-300 font-bold dark:bg-red-950 dark:text-red-200 dark:border-red-700',
    pulseClass: 'bg-red-600 animate-ping',
    description: 'Severe project stalling (>18 months delay expected). Multi-village resistance or active High Court stay.',
  },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 46) return 'MEDIUM';
  if (score >= 25) return 'LOW_MEDIUM';
  return 'LOW';
}

export function getRiskTheme(scoreOrLevel: number | RiskLevel | undefined): RiskTheme {
  if (scoreOrLevel === undefined) return RISK_CONFIG.MEDIUM;
  const level = typeof scoreOrLevel === 'number' ? getRiskLevel(scoreOrLevel) : scoreOrLevel;
  return RISK_CONFIG[level] || RISK_CONFIG.MEDIUM;
}

export function getFactorSeverityColor(score: number): { text: string; bg: string; border: string; hex: string } {
  if (score >= 80) {
    return { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-500', border: 'border-red-200 dark:border-red-800', hex: '#ef4444' };
  }
  if (score >= 65) {
    return { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800', hex: '#f59e0b' };
  }
  if (score >= 45) {
    return { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800', hex: '#3b82f6' };
  }
  return { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', hex: '#10b981' };
}

export const CATEGORY_ICONS: Record<string, string> = {
  HIGHWAY: 'Road',
  RAILWAY: 'Train',
  INDUSTRIAL: 'Factory',
  ENERGY: 'Zap',
  URBAN_INFRA: 'Building2',
  WATER: 'Droplets',
};
