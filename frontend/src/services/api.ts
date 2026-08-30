/**
 * LandIntel Centralized REST API Service
 * 
 * Designed to communicate with a FastAPI backend running at VITE_API_BASE_URL.
 * Provides seamless fallback to built-in Demo Mode when backend is offline or in development.
 * 
 * REST API Contract:
 * - GET /projects
 * - GET /projects/{id}
 * - GET /projects/{id}/risk
 * - GET /projects/{id}/history
 * - GET /projects/{id}/environment
 * - GET /projects/{id}/recommendations
 * - GET /projects/{id}/sources
 * - GET /projects/nearby?lat={lat}&lng={lng}&radius={radius}
 * - GET /gis/layers
 * - GET /gis/layers/{layerName}
 * - GET /dashboard/summary
 * - GET /alerts/attention
 * - GET /analytics/district-trends
 * - GET /analytics/state-trends
 */

import {
  Project,
  RiskAssessment,
  HistoricalEvent,
  EnvironmentalFactor,
  Recommendation,
  SourceEvidence,
  GISLayerConfig,
  DashboardSummary,
  NearbyHistoricalProject,
  RiskShiftAlert,
  DistrictDelayTrend,
  StateDelayTrend,
} from '../types';
import {
  MOCK_PROJECTS,
  DEFAULT_GIS_LAYERS,
  MOCK_ENVIRONMENTAL_GEOJSON,
  MOCK_HISTORICAL_PROJECTS_GEOJSON,
  computeDashboardSummary,
} from '../data/mockData';
import { MLPredictionInput, MLPredictionResult } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

let isBackendAvailable = false;
let backendCheckPerformed = false;

/**
 * Health check to verify if the FastAPI backend is running
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    isBackendAvailable = response.ok;
  } catch {
    isBackendAvailable = false;
  }
  backendCheckPerformed = true;
  return isBackendAvailable;
}

export function getApiStatus(): { isDemoMode: boolean; baseUrl: string } {
  return {
    isDemoMode: !isBackendAvailable,
    baseUrl: API_BASE_URL,
  };
}

/**
 * Fetch all projects with optional query filters
 */
export async function getProjects(params?: {
  status?: string;
  riskLevel?: string;
  search?: string;
}): Promise<Project[]> {
  try {
    if (isBackendAvailable) {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') query.append('status', params.status);
      if (params?.riskLevel && params.riskLevel !== 'ALL') query.append('risk_level', params.riskLevel);
      if (params?.search) query.append('q', params.search);

      const res = await fetch(`${API_BASE_URL}/projects?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('FastAPI backend not reachable, serving local intelligence mock dataset.', err);
    isBackendAvailable = false;
  }

  // Local Mock Filter Fallback
  let results = [...MOCK_PROJECTS];
  if (params?.status && params.status !== 'ALL') {
    results = results.filter(p => p.status === params.status);
  }
  if (params?.riskLevel && params.riskLevel !== 'ALL') {
    results = results.filter(p => p.risk.level === params.riskLevel);
  }
  if (params?.search) {
    const term = params.search.toLowerCase().trim();
    results = results.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.district.toLowerCase().includes(term) ||
        p.state.toLowerCase().includes(term) ||
        p.taluka?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }
  return results;
}

/**
 * Fetch single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const found = MOCK_PROJECTS.find(p => p.id === id);
  return found || null;
}

/**
 * Fetch risk assessment for a specific project
 */
export async function getProjectRisk(id: string): Promise<RiskAssessment | null> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/risk`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const project = MOCK_PROJECTS.find(p => p.id === id);
  return project ? project.risk : null;
}

/**
 * Fetch historical timeline for a project
 */
export async function getProjectHistory(id: string): Promise<HistoricalEvent[]> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/history`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const project = MOCK_PROJECTS.find(p => p.id === id);
  return project ? project.timeline : [];
}

/**
 * Fetch environmental factors for a project
 */
export async function getProjectEnvironment(id: string): Promise<EnvironmentalFactor[]> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/environment`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const project = MOCK_PROJECTS.find(p => p.id === id);
  return project ? project.environmentalFactors : [];
}

/**
 * Fetch recommendations for a project
 */
export async function getProjectRecommendations(id: string): Promise<Recommendation[]> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/recommendations`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const project = MOCK_PROJECTS.find(p => p.id === id);
  return project ? project.recommendations : [];
}

/**
 * Fetch sources and traceable legal evidence for a project
 */
export async function getProjectSources(id: string): Promise<SourceEvidence[]> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/sources`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  const project = MOCK_PROJECTS.find(p => p.id === id);
  return project ? project.sources : [];
}

/**
 * Fetch nearby historical projects within a radius (km)
 */
export async function getNearbyProjects(
  lat: number,
  lng: number,
  radiusKm: number = 25
): Promise<NearbyHistoricalProject[]> {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return MOCK_PROJECTS[0]?.nearbyProjects || [];
  }

  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/projects/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  // Calculate mock distance or return default nearby list
  const activeProj = MOCK_PROJECTS.find(
    p => Math.abs(p.latitude - lat) < 0.1 && Math.abs(p.longitude - lng) < 0.1
  );
  if (activeProj && activeProj.nearbyProjects) {
    return activeProj.nearbyProjects.filter(np => np.distanceKm <= radiusKm);
  }
  return MOCK_PROJECTS[0]?.nearbyProjects || [];
}

/**
 * Fetch available GIS layer configurations
 */
export async function getGisLayers(): Promise<GISLayerConfig[]> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/gis/layers`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  return DEFAULT_GIS_LAYERS;
}

/**
 * Fetch raw GeoJSON for a specific GIS layer
 */
export async function getGisLayerGeoJSON(layerId: string): Promise<any> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/gis/layers/${layerId}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  if (layerId === 'historical') {
    return MOCK_HISTORICAL_PROJECTS_GEOJSON;
  }
  if (layerId === 'forest' || layerId === 'wetlands' || layerId === 'protected' || layerId === 'legal') {
    return {
      type: 'FeatureCollection',
      features: MOCK_ENVIRONMENTAL_GEOJSON.features.filter(
        f => f.properties.layer === layerId || (layerId === 'forest' && f.properties.type === 'FOREST')
      ),
    };
  }
  return MOCK_ENVIRONMENTAL_GEOJSON;
}

/**
 * Fetch high-level summary KPIs
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    if (isBackendAvailable) {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    isBackendAvailable = false;
  }

  return computeDashboardSummary(MOCK_PROJECTS);
}

/**
 * Dynamic Status & Risk Shift Detection Engine
 * Identifies projects transitioning from LOW -> HIGH, ON TRACK -> AT RISK,
 * or where new litigation / compensation blocks have escalated risk.
 */
export function detectProjectsNeedingAttention(projects: Project[]): RiskShiftAlert[] {
  const alerts: RiskShiftAlert[] = [];

  projects.forEach(project => {
    // 1. Projects with explicit attention flags or previous risk changes
    if (project.needsAttention || (project.previousRisk && project.previousRisk.score < project.risk.score)) {
      const prevScore = project.previousRisk?.score || (project.risk.score - 18);
      const prevLevel = project.previousRisk?.level || 'LOW';
      const change = project.risk.score - prevScore;

      let category: RiskShiftAlert['category'] = 'COMPENSATION_DISPUTE';
      let actionReq = 'Convene District Land Acquisition Committee meeting.';

      if (project.legalIssues.some(l => l.status === 'STAY_ORDER_ACTIVE')) {
        category = 'NEW_LITIGATION';
        actionReq = 'File urgent vacate-stay application before High Court bench.';
      } else if (project.environmentalFactors.some(e => e.clearanceStatus === 'PENDING_STAGE_2')) {
        category = 'ENVIRONMENTAL_HOLD';
        actionReq = 'Submit compensatory afforestation GPS polygon to Forest Dept.';
      } else if (project.compensation.disbursedPct < 50 && project.compensation.totalDisputedCases > 20) {
        category = 'COMPENSATION_DISPUTE';
        actionReq = 'Initiate direct consent negotiation with affected village elders.';
      }

      alerts.push({
        id: `alert-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        district: project.district,
        state: project.state,
        previousRiskLevel: prevLevel,
        currentRiskLevel: project.risk.level,
        previousScore: prevScore,
        currentScore: project.risk.score,
        changePoints: change,
        reason: project.riskChangeReason || project.risk.keyReasons[0] || 'Escalated delay vulnerability',
        timestamp: 'Recently Updated',
        actionRequired: actionReq,
        category,
      });
    } else if (project.risk.score >= 80) {
      // High/Critical projects that require immediate oversight
      alerts.push({
        id: `alert-${project.id}`,
        projectId: project.id,
        projectName: project.name,
        district: project.district,
        state: project.state,
        previousRiskLevel: 'MEDIUM',
        currentRiskLevel: project.risk.level,
        previousScore: project.risk.score - 15,
        currentScore: project.risk.score,
        changePoints: 15,
        reason: project.risk.keyReasons[0] || 'Statutory bottleneck detected',
        timestamp: 'Active Alert',
        actionRequired: project.recommendations[0]?.title || 'Review nodal mitigation strategy.',
        category: project.legalIssues.length > 0 ? 'NEW_LITIGATION' : 'COMPENSATION_DISPUTE',
      });
    }
  });

  return alerts;
}

/**
 * Calculate District-Wise Delay Trends dynamically from active dataset
 */
export function getDistrictDelayTrends(projects: Project[]): DistrictDelayTrend[] {
  const districtMap: Record<string, Project[]> = {};

  projects.forEach(p => {
    const key = `${p.district}|${p.state}`;
    if (!districtMap[key]) districtMap[key] = [];
    districtMap[key].push(p);
  });

  return Object.entries(districtMap).map(([key, projs]) => {
    const [district, state] = key.split('|');
    const totalDelay = projs.reduce((acc, p) => acc + p.risk.estimatedDelayMonths, 0);
    const totalScore = projs.reduce((acc, p) => acc + p.risk.score, 0);
    const highRisk = projs.filter(p => p.risk.score >= 70).length;
    const totalCompPct = projs.reduce((acc, p) => acc + p.compensation.disbursedPct, 0);
    const totalLitigations = projs.reduce((acc, p) => acc + p.legalIssues.length, 0);

    return {
      district,
      state,
      projectCount: projs.length,
      avgDelayMonths: Math.round((totalDelay / projs.length) * 10) / 10,
      avgRiskScore: Math.round(totalScore / projs.length),
      highRiskCount: highRisk,
      avgCompensationPct: Math.round(totalCompPct / projs.length),
      avgRRPct: Math.round(projs.reduce((acc, p) => acc + p.acquisitionProgressPct, 0) / projs.length),
      totalLitigations,
    };
  }).sort((a, b) => b.avgDelayMonths - a.avgDelayMonths);
}

/**
 * Live ML Risk Prediction
 * -------------------------------------------------------------
 * Calls the trained XGBoost model (land-delay-prediction/api.py, POST /predict)
 * directly - this is a real model inference, so unlike the rest of this file
 * there is NO mock fallback. If the backend or model isn't available, this
 * throws so the caller (RiskPredictorModal) can show an honest error instead
 * of a fabricated score.
 */
export async function predictProjectDelayRisk(input: MLPredictionInput): Promise<MLPredictionResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(
      `Could not reach the prediction backend at ${API_BASE_URL}. Is it running? (uvicorn api:app --reload)`
    );
  }

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail || detail;
    } catch {
      // ignore - use default detail
    }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Calculate State-Wise Delay Trends dynamically from active dataset
 */
export function getStateDelayTrends(projects: Project[]): StateDelayTrend[] {
  const stateMap: Record<string, Project[]> = {};

  projects.forEach(p => {
    if (!stateMap[p.state]) stateMap[p.state] = [];
    stateMap[p.state].push(p);
  });

  return Object.entries(stateMap).map(([state, projs]) => {
    const totalDelay = projs.reduce((acc, p) => acc + p.risk.estimatedDelayMonths, 0);
    const totalScore = projs.reduce((acc, p) => acc + p.risk.score, 0);
    const totalLandReq = projs.reduce((acc, p) => acc + p.landRequiredAcres, 0);
    const totalLandAcq = projs.reduce((acc, p) => acc + p.landAcquiredAcres, 0);
    const highRisk = projs.filter(p => p.risk.score >= 70).length;
    const uniqueDistricts = new Set(projs.map(p => p.district));

    return {
      state,
      projectCount: projs.length,
      avgDelayMonths: Math.round((totalDelay / projs.length) * 10) / 10,
      avgRiskScore: Math.round(totalScore / projs.length),
      totalLandRequiredAcres: totalLandReq,
      totalLandAcquiredAcres: totalLandAcq,
      highRiskCount: highRisk,
      districtsCount: uniqueDistricts.size,
      isPrototypeDataset: state === 'West Bengal',
    };
  }).sort((a, b) => b.avgDelayMonths - a.avgDelayMonths);
}
