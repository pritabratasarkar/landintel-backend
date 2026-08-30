/**
 * Core Data Models & Schemas for LandIntel
 * Land Acquisition Intelligence & Project Risk Assessment Platform
 * Smart India Hackathon - Problem Statement 26017:
 * "Predictive Analytics System for Early Detection of Land Acquisition Delays"
 */

export type RiskLevel = 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProjectStatus = 'ACTIVE' | 'DELAYED' | 'COMPLETED' | 'PLANNING';

export type LayerCategory =
  | 'projects'
  | 'boundaries'
  | 'administrative'
  | 'environmental'
  | 'infrastructure'
  | 'legal'
  | 'heatmap'
  | 'historical'
  | 'clusters';

export interface RiskFactors {
  legal: number;            // 0 - 100
  compensation: number;     // 0 - 100
  rehabilitation: number;   // 0 - 100 (R&R)
  environment: number;      // 0 - 100
  documentation: number;    // 0 - 100
  social: number;           // 0 - 100
  historicalDelay: number;  // 0 - 100
}

export interface RiskAssessment {
  score: number;                   // Composite 0 - 100
  level: RiskLevel;
  delayProbability: number;        // e.g. 0.84 (84%)
  estimatedDelayMonths: number;    // e.g. 18
  factors: RiskFactors;
  keyReasons: string[];            // Explainable list: "Why is this project high risk?"
  mitigationUrgency: 'IMMEDIATE' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface HistoricalEvent {
  year: number | string;
  title: string;
  description: string;
  type: 'ANNOUNCEMENT' | 'ACQUISITION_START' | 'DISPUTE' | 'LEGAL_STAY' | 'COMPENSATION_SETTLEMENT' | 'POSSESSION' | 'MILESTONE';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface NearbyHistoricalProject {
  id: string;
  name: string;
  distanceKm: number;
  finalDelayMonths: number;
  riskScore: number;
  status: 'COMPLETED' | 'DELAYED' | 'ABANDONED';
  type: string;
  similarityScore: number; // percentage similarity
  acquisitionChallenge: string;
}

export interface EnvironmentalFactor {
  id: string;
  name: string;
  type: 'FOREST' | 'WETLAND' | 'RIVER_BASIN' | 'PROTECTED_AREA' | 'ECO_SENSITIVE' | 'FLOOD_ZONE';
  areaAcres: number;
  sensitivityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  clearanceStatus: 'PENDING_STAGE_1' | 'PENDING_STAGE_2' | 'GRANTED' | 'REJECTED' | 'NOT_REQUIRED';
  description: string;
  distanceToProjectKm: number;
  statutoryAct: string; // e.g. "Forest Conservation Act, 1980"
}

export interface LegalIssue {
  id: string;
  caseNumber: string;
  court: string;
  status: 'STAY_ORDER_ACTIVE' | 'HEARING_SCHEDULED' | 'PENDING_AWARD' | 'SETTLED';
  affectedParcelsCount: number;
  affectedAreaAcres: number;
  petitioner: string;
  subject: string;
  filingDate: string;
  riskImpact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CompensationMetrics {
  totalRequiredCr: number;      // Total in ₹ Crores
  disbursedCr: number;          // Disbursed in ₹ Crores
  disbursedPct: number;         // 0 - 100%
  totalDisputedCases: number;
  affectedFamilies: number;
  resettlementColoniesPlanned: number;
  resettlementColoniesBuilt: number;
  rrPackageStatus: 'UNDER_REVISION' | 'PARTIALLY_DELIVERED' | 'SATISFACTORY' | 'STALLED';
}

export interface Recommendation {
  id: string;
  priority: number; // 1 = Highest
  title: string;
  reason: string;
  expectedImpact: string;
  category: 'LEGAL' | 'COMPENSATION' | 'RR' | 'ENVIRONMENT' | 'ADMINISTRATIVE';
  responsibleAuthority: string;
  actionTimeline: string;
}

export interface SourceEvidence {
  id: string;
  title: string;
  type: 'OFFICIAL_GAZETTE' | 'COURT_JUDGMENT' | 'MOEFCC_CLEARANCE' | 'DISTRICT_REVENUE_REPORT' | 'SURVEY_OF_INDIA';
  issuingAuthority: string;
  date: string;
  referenceNo: string;
  documentUrl?: string;
  excerpt: string;
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'PROTOTYPE_DEMO' | 'DEMO_SOURCE' | 'UNVERIFIED';
}

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  coordinates: any;
}

export interface ProjectGeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: {
    id: string;
    name: string;
    risk: number;
    riskLevel: RiskLevel;
    status: ProjectStatus;
    category: string;
    landAcres: number;
  };
}

export interface StatutoryStage {
  id: string;
  stageName: string;
  statutorySection: string;
  plannedDate: string;
  actualDate?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'DELAYED' | 'PENDING';
  delayMonths: number;
  responsibleAuthority: string;
  isBottleneck: boolean;
  notes?: string;
}

export interface DistrictDifficultyProfile {
  district: string;
  state: string;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  landRequiredAcres: number;
  landAcquiredAcres: number;
  acquisitionPct: number;
  litigationCount: number;
  compensationDisputePct: number;
  historicalAvgDelayMonths: number;
  sequenceOrder: number;
  keyChallenge: string;
}

export interface CommunitySentiment {
  status: 'SUPPORTIVE' | 'MIXED' | 'CONCERNED' | 'OPPOSED' | 'INSUFFICIENT_DATA';
  confidence: 'VERIFIED' | 'SAMPLE_SURVEY' | 'INSUFFICIENT_VERIFIED_DATA';
  positiveThemes: string[];
  concerns: string[];
  notes: string;
  surveySampleSize?: number;
}

export interface RiskShiftAlert {
  id: string;
  projectId: string;
  projectName: string;
  district: string;
  state: string;
  previousRiskLevel: RiskLevel;
  currentRiskLevel: RiskLevel;
  previousScore: number;
  currentScore: number;
  changePoints: number;
  reason: string;
  timestamp: string;
  actionRequired: string;
  category: 'COMPENSATION_DISPUTE' | 'NEW_LITIGATION' | 'APPROVAL_DELAY' | 'ENVIRONMENTAL_HOLD' | 'PROTEST_ESCALATION';
}

export interface Project {
  id: string;
  name: string;
  category: 'HIGHWAY' | 'RAILWAY' | 'INDUSTRIAL' | 'ENERGY' | 'URBAN_INFRA' | 'WATER';
  state: string;
  states?: string[];
  district: string;
  districts?: string[];
  taluka?: string;
  latitude: number;
  longitude: number;
  status: ProjectStatus;
  previousStatus?: ProjectStatus;
  landRequiredAcres: number;
  landAcquiredAcres: number;
  acquisitionProgressPct: number;
  affectedVillagesCount: number;
  affectedFamiliesCount: number;
  budgetCr: number;
  executingAgency: string;
  targetCompletionYear: number;
  
  // Intelligence modules
  risk: RiskAssessment;
  previousRisk?: {
    score: number;
    level: RiskLevel;
  };
  riskChangeReason?: string;
  needsAttention?: boolean;
  
  timeline: HistoricalEvent[];
  statutoryTimeline?: StatutoryStage[];
  nearbyProjects: NearbyHistoricalProject[];
  historicalPatternInsight: string;
  environmentalFactors: EnvironmentalFactor[];
  legalIssues: LegalIssue[];
  compensation: CompensationMetrics;
  recommendations: Recommendation[];
  sources: SourceEvidence[];
  
  // Advanced Multi-Region & Sentiment Intelligence
  multiDistrictProfiles?: DistrictDifficultyProfile[];
  communitySentiment?: CommunitySentiment;
  
  // Boundary GeoJSON (polygon / linestring)
  boundaryGeoJson?: {
    type: 'Feature';
    geometry: GeoJSONGeometry;
    properties: Record<string, any>;
  };
}

export interface GISLayerConfig {
  id: string;
  name: string;
  category: LayerCategory;
  visible: boolean;
  color: string;
  fillColor?: string;
  iconName: string;
  description: string;
  featureCount?: number;
  opacity?: number;
  isAvailable?: boolean;
  sourceLabel?: string;
}

export interface DashboardSummary {
  totalProjects: number;
  projectsOnSchedule: number;
  projectsNeedingAttention: number;
  highRiskProjects: number;
  criticalRiskProjects: number;
  delayedProjects: number;
  environmentalAlerts: number;
  legalAlerts: number;
  totalLandRequiredAcres: number;
  totalLandAcquiredAcres: number;
  avgAcquisitionPct: number;
  avgDelayMonths: number;
  totalCompensationDisbursedPct: number;
  totalLitigationCount: number;
}

// AI Assistant Data Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedProjectId?: string;
  suggestedActions?: string[];
  structuredData?: any;
}

export interface AISession {
  id: string;
  title: string;
  timestamp: string;
  projectId?: string;
  messages: ChatMessage[];
}

export interface AttentionProjectItem {
  project: Project;
  attentionReason: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  primaryIssue: string;
  triggerCategory: 'LEGAL' | 'ENVIRONMENT' | 'COMPENSATION' | 'SLOW_PACE';
}

// Live ML Risk Predictor (land-delay-prediction XGBoost model integration)
export interface MLPredictionInput {
  state: string;
  district: string;
  project_type: string;
  land_type: string;
  land_area_hectares: number;
  affected_families: number;
  approval_expected_days: number;
  approval_actual_days: number;
  compensation_status: string;
  compensation_delay_days: number;
  legal_disputes_count: number;
  documentation_completeness_pct: number;
  rehab_status: string;
  rehab_progress_pct: number;
  stakeholder_responsiveness_score: number;
  notification_month: number;
  notification_year: number;
}

export interface MLTopFactor {
  factor: string;
  value: number | string;
  effect: 'increases' | 'decreases';
  impact_strength: number;
}

export interface MLPredictionResult {
  prediction_id: string;
  risk_score: number; // 0-1 probability of delay
  risk_category: 'Low' | 'Medium' | 'High';
  top_factors: MLTopFactor[];
}

export interface DistrictDelayTrend {
  district: string;
  state: string;
  projectCount: number;
  avgDelayMonths: number;
  avgRiskScore: number;
  highRiskCount: number;
  avgCompensationPct: number;
  avgRRPct: number;
  totalLitigations: number;
}

export interface StateDelayTrend {
  state: string;
  projectCount: number;
  avgDelayMonths: number;
  avgRiskScore: number;
  totalLandRequiredAcres: number;
  totalLandAcquiredAcres: number;
  highRiskCount: number;
  districtsCount: number;
  isPrototypeDataset: boolean;
}
