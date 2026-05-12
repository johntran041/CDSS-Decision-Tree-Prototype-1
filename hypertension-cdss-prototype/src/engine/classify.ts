import type { PatientContext, BPCategory, KnowledgeBase, RuleTrace } from '../types.js';

export function classifyBP(
  patient: PatientContext,
  _kb: KnowledgeBase,
  trace: RuleTrace[]
): BPCategory {
  const { officeSBP: sbp, officeDBP: dbp } = patient;

  // Crisis takes precedence — checked before calling this function, but guard here too
  if (sbp >= 180 || dbp >= 120) {
    return record(trace, 'hypertensive_crisis', sbp, dbp, 'SBP ≥180 or DBP ≥120 [Bảng 14, p.28]');
  }

  // Grade 2: SBP ≥160 OR DBP ≥100 — checked before isolated_systolic; SBP ≥160 takes priority
  if (sbp >= 160 || dbp >= 100) {
    return record(trace, 'grade_2', sbp, dbp, 'SBP ≥160 OR DBP ≥100 [Bảng 1, p.7]');
  }

  // Isolated systolic: SBP 140-159 AND DBP <90
  if (sbp >= 140 && dbp < 90) {
    return record(trace, 'isolated_systolic', sbp, dbp, 'SBP 140-159 AND DBP <90 defines isolated systolic HTN [Bảng 1, p.7]');
  }

  // Grade 1: SBP 140-159 AND/OR DBP 90-99
  if (sbp >= 140 || dbp >= 90) {
    return record(trace, 'grade_1', sbp, dbp, 'SBP 140-159 AND/OR DBP 90-99 [Bảng 1, p.7]');
  }

  // High-normal (HABTC): SBP 130-139 AND/OR DBP 85-89
  if (sbp >= 130 || dbp >= 85) {
    return record(trace, 'high_normal', sbp, dbp, 'SBP 130-139 AND/OR DBP 85-89 (HABTC) [Bảng 1, p.7]');
  }

  return record(trace, 'normal', sbp, dbp, 'SBP <130 AND DBP <85 [Bảng 1, p.7]');
}

function record(
  trace: RuleTrace[],
  category: BPCategory,
  sbp: number,
  dbp: number,
  reasoning: string
): BPCategory {
  trace.push({
    ruleId: 'classify_bp',
    ruleDescription: 'Classify blood pressure category per Bảng 1',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 1', page: 7, verbatimQuote: 'Bảng 1. Chẩn đoán tăng huyết áp theo ngưỡng huyết áp đo tại phòng khám' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs: { officeSBP: sbp, officeDBP: dbp },
    output: category,
    reasoning,
  });
  return category;
}
