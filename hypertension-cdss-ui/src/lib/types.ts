// Re-export types from the prototype for use in the UI
export type {
  PatientContext,
  Recommendation,
  RecommendationStatus,
  BPCategory,
  RiskLevel,
  DrugClassCode,
  CompellingIndication,
  SafetyAlert,
  DrugRecommendation,
  RuleTrace,
  KnowledgeBase,
  CKDStage,
} from '../../../hypertension-cdss-prototype/src/types.js';

export type {
  LocalizedRecommendation,
  LocalizedSafetyAlert,
  LocalizedTraceEntry,
} from '../../../hypertension-cdss-prototype/src/i18n/localize.js';
