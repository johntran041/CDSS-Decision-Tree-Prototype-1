import { runEngine } from '../../../hypertension-cdss-prototype/src/engine/index.js';
import { validateKB } from '../../../hypertension-cdss-prototype/src/kb/validate.js';
import { localizeRecommendation } from '../../../hypertension-cdss-prototype/src/i18n/localize.js';
import type { PatientContext, Recommendation, KnowledgeBase } from '../../../hypertension-cdss-prototype/src/types.js';
import type { LocalizedRecommendation } from '../../../hypertension-cdss-prototype/src/i18n/localize.js';
import kbData from '../../../hypertension-cdss-prototype/src/kb/vsh_vnha_2022.json';

// Initialize KB directly from bundled JSON (avoids import.meta.url for Next.js compat)
function initKB(): KnowledgeBase {
  const kb = kbData as unknown as KnowledgeBase;
  validateKB(kb);
  return kb;
}

const kb = initKB();

export function recommend(patient: PatientContext): {
  raw: Recommendation;
  localized: LocalizedRecommendation;
} {
  const raw = runEngine(patient, kb);
  const localized = localizeRecommendation(raw);
  return { raw, localized };
}
