import type { PatientContext, KnowledgeBase, RuleTrace } from '../types.js';

export interface ThresholdResult {
  sbp: number;
  dbp: number;
  reasoning: string;
}

export function computeThreshold(
  patient: PatientContext,
  kb: KnowledgeBase,
  trace: RuleTrace[]
): ThresholdResult {
  const hasComorbidity = detectComorbidity(patient);
  const ageGroup = getAgeGroup(patient.ageYears);
  const entry = kb.thresholds.find(t => t.ageGroup === ageGroup);

  if (!entry) throw new Error(`No threshold entry for age group: ${ageGroup}`);

  const sbp = hasComorbidity
    ? entry.sbpThresholdWithComorbidity
    : entry.sbpThresholdNoComorbidity;

  // DBP: high-risk patients in 18-69 get 85 if available
  const isHighRisk = hasComorbidity && patient.ageYears < 70;
  const dbp = (isHighRisk && entry.dbpThresholdHighRisk !== undefined)
    ? entry.dbpThresholdHighRisk
    : entry.dbpThreshold;

  const comorbidityList = buildComorbidityList(patient);
  const reasoning = hasComorbidity
    ? `Age ${patient.ageYears} (${ageGroup}), comorbidities: ${comorbidityList} → SBP threshold ≥${sbp}, DBP ≥${dbp} [${entry.source.reference}, p.${entry.source.page}]`
    : `Age ${patient.ageYears} (${ageGroup}), no qualifying comorbidity → SBP threshold ≥${sbp}, DBP ≥${dbp} [${entry.source.reference}, p.${entry.source.page}]`;

  trace.push({
    ruleId: 'compute_threshold',
    ruleDescription: 'Determine treatment threshold by age group and comorbidity [Bảng 6]',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 6', page: 15, verbatimQuote: 'Bảng 6. Ngưỡng huyết áp phòng khám cho điều trị tăng huyết áp theo nhóm tuổi' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs: {
      ageYears: patient.ageYears,
      ageGroup,
      hasComorbidity,
      comorbidityList,
    },
    output: { sbp, dbp },
    reasoning,
  });

  return { sbp, dbp, reasoning };
}

export function detectComorbidity(patient: PatientContext): boolean {
  return !!(
    patient.hasDiabetesType2 ||
    patient.hasCAD ||
    patient.hasASCVD ||
    patient.hasPostStroke ||
    patient.hasHeartFailure ||   // Bảng 20, p. 34
    // AMBIGUITY: Bảng 6 footnote enumerates T2D/CKD/CAD/stroke but not HF/LVH explicitly. Using DBP ≥85 by analogy with Bảng 20 HF treatment guidelines. Dr. Huy should confirm.
    patient.hasLVH ||             // Section 3.7.3, p. 31
    // AMBIGUITY: Bảng 6 footnote enumerates T2D/CKD/CAD/stroke but not HF/LVH explicitly. Using DBP ≥85 by analogy with Bảng 20 HF treatment guidelines. Dr. Huy should confirm.
    patient.hasPostMI ||          // Bảng 19, p. 33
    (patient.ckdStage && patient.ckdStage !== 'none')
  );
}

function buildComorbidityList(patient: PatientContext): string {
  const list: string[] = [];
  if (patient.hasDiabetesType2) list.push('T2D');
  if (patient.hasCAD) list.push('CAD');
  if (patient.hasASCVD) list.push('ASCVD');
  if (patient.hasPostStroke) list.push('post-stroke');
  if (patient.hasPostMI) list.push('post-MI');
  if (patient.hasHeartFailure) list.push('HF');
  if (patient.hasLVH) list.push('LVH');
  if (patient.ckdStage && patient.ckdStage !== 'none') list.push(`CKD(${patient.ckdStage})`);
  return list.join(', ') || 'none';
}

export function getAgeGroup(age: number): '18-69' | '70-79' | '>=80' {
  if (age >= 80) return '>=80';
  if (age >= 70) return '70-79';
  return '18-69';
}
