// ============ Input ============

export type Sex = 'male' | 'female';

export type CKDStage =
  | 'none'
  | 'stage_1'
  | 'stage_2'
  | 'stage_3'
  | 'stage_4'
  | 'stage_5'
  | 'dialysis'
  | 'transplant';

export type BPCategory =
  | 'normal'
  | 'high_normal'
  | 'grade_1'
  | 'grade_2'
  | 'isolated_systolic'
  | 'hypertensive_crisis';

export type RiskLevel = 'low' | 'intermediate' | 'high';

export type DrugClassCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'MRA'
  | 'SGLT2i'
  | 'GLP1RA'
  | 'ARNI'
  | 'loop'
  | 'alpha';

export type CompellingIndication =
  | 'none'
  | 'coronary_artery_disease'
  | 'post_myocardial_infarction'
  | 'heart_failure_reduced_ef'
  | 'heart_failure_preserved_ef'
  | 'left_ventricular_hypertrophy'
  | 'post_stroke'
  | 'chronic_kidney_disease'
  | 'type2_diabetes_high_risk'
  | 'atrial_fibrillation'
  | 'angina';

export interface PatientContext {
  // Demographics
  patientId: string;
  ageYears: number;
  sex: Sex;

  // BP (most recent confirmed office reading)
  officeSBP: number;
  officeDBP: number;

  // Risk factors (Bảng 2)
  heartRateBpm?: number;
  isOverweight?: boolean;
  isSmoker?: boolean;
  hasFamilyHistoryCVD?: boolean;
  hasFamilyHistoryHTN?: boolean;
  hasEarlyMenopause?: boolean;
  hasElevatedLDLOrTriglycerides?: boolean;

  // Comorbidities and conditions
  hasDiabetesType2?: boolean;
  hasASCVD?: boolean;
  hasCAD?: boolean;
  hasPostMI?: boolean;
  ckdStage?: CKDStage;
  egfrMlMin?: number;
  potassiumMmolL?: number;
  hasHeartFailure?: boolean;
  hfrefEjectionFraction?: number;
  hasLVH?: boolean;
  hasPostStroke?: boolean;
  hasAtrialFibrillation?: boolean;
  hasAngina?: boolean;

  // Target organ damage
  hasTargetOrganDamage?: boolean;

  // Special states
  isPregnant?: boolean;
  isFrail?: boolean;
  isPostRenalTransplant?: boolean;

  // Contraindication-relevant
  hasGout?: boolean;
  hasAsthma?: boolean;
  hasAVBlock?: boolean;
  hasBilateralRenalArteryStenosis?: boolean;
  hasAngioedemaHistory?: boolean;
  hasBicuspidAorticValve?: boolean;
  hasRevascularization?: boolean;

  // Treatment history
  currentMedications?: Array<{
    classCode: DrugClassCode;
    drugName: string;
    doseLevel: 'low' | 'usual' | 'max';
  }>;
  monthsOnLifestyleChange?: number;
  monthsOnCurrentRegimen?: number;
  bpAtTargetCurrentRegimen?: boolean;

  // Site config
  siteConfig: {
    pathwayMode: 'essential' | 'optimal';
  };
}

// ============ Output ============

export interface RuleTrace {
  ruleId: string;
  ruleDescription: string;
  source: {
    document: 'VSH/VNHA 2022';
    reference: string;
    page: number;
    verbatimQuote: string;  // Required: exact text from the document supporting this rule
  };
  evidenceClass?: 'I' | 'IIa' | 'IIb' | 'III';
  evidenceLevel?: 'A' | 'B' | 'C';
  inputs: Record<string, unknown>;
  output: unknown;
  reasoning: string;
}

export interface DrugRecommendation {
  classCodes: DrugClassCode[];
  preferredCombination?: DrugClassCode[][];
  doseLevel: 'low' | 'usual' | 'max';
  pillForm?: 'single_pill' | 'loose';
  notes: string[];
}

export interface SafetyAlert {
  severity: 'info' | 'warning' | 'contraindication';
  drugClass?: DrugClassCode;
  reason: string;
  source: { reference: string; page: number };
}

export type RecommendationStatus =
  | 'PRESCRIBE'
  | 'LIFESTYLE_ONLY'
  | 'ESCALATE'
  | 'REFER_SPECIALIST'
  | 'SAFETY_HALT'
  | 'OUT_OF_SCOPE';

export interface Recommendation {
  status: RecommendationStatus;
  bpCategory: BPCategory;
  cvRiskLevel: RiskLevel;
  treatmentThreshold?: { sbp: number; dbp: number; reasoning: string };
  treatmentTarget?: { sbpMin: number; sbpMax: number; dbpMax: number; reasoning: string };
  pathwayUsed: 'essential' | 'optimal';
  currentStep?: string;
  drugRecommendation?: DrugRecommendation;
  safetyAlerts: SafetyAlert[];
  trace: RuleTrace[];
  guidanceMessages: string[];
  nextEvaluationWeeks?: number;
}

// ============ Knowledge Base types ============

export interface BPCategoryEntry {
  name: BPCategory;
  sbpMin: number | null;
  sbpMax: number | null;
  dbpMin: number | null;
  dbpMax: number | null;
  source: { reference: string; page: number };
}

export type RiskTier = 'tier0' | 'tier1_2' | 'tier3plus';

export interface RiskMatrixEntry {
  tier: RiskTier;
  bpCategory: 'high_normal' | 'grade_1' | 'grade_2';
  riskLevel: RiskLevel;
}

export interface ThresholdEntry {
  ageGroup: '18-69' | '70-79' | '>=80';
  sbpThresholdNoComorbidity: number;
  sbpThresholdWithComorbidity: number;
  dbpThreshold: number;
  dbpThresholdHighRisk?: number;
  source: { reference: string; page: number };
}

export interface TargetEntry {
  ageGroup: '18-69' | '>=70';
  sbpMinNoComorbidity: number;
  sbpMaxNoComorbidity: number;
  sbpMinWithComorbidity: number;
  sbpMaxWithComorbidity: number;
  dbpMax: number;
  source: { reference: string; page: number };
}

export interface ContraindicationEntry {
  drugClass: string;
  absolute: string[];
  relative: string[];
  source: { reference: string; page: number };
}

export interface PathwayRule {
  ruleId: string;
  description: string;
  source: { reference: string; page: number };
  evidenceClass?: string;
  evidenceLevel?: string;
}

export interface CompellingIndicationEntry {
  indication: CompellingIndication;
  thresholdSBP?: number;
  targetSBPMax?: number;
  targetSBPMin?: number;
  targetDBPMax?: number;
  preferredClasses: DrugClassCode[][];
  notes: string[];
  source: { reference: string; page: number };
}

export interface KnowledgeBase {
  bpCategories: BPCategoryEntry[];
  riskMatrix: RiskMatrixEntry[];
  thresholds: ThresholdEntry[];
  targets: TargetEntry[];
  contraindications: ContraindicationEntry[];
  essentialPathwayRules: PathwayRule[];
  optimalPathwayRules: PathwayRule[];
  compellingIndications: CompellingIndicationEntry[];
}
