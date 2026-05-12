import type { PatientContext, BPCategory, RiskLevel, KnowledgeBase, RuleTrace, RiskTier } from '../types.js';

export function stratifyRisk(
  patient: PatientContext,
  bpCategory: BPCategory,
  _kb: KnowledgeBase,
  trace: RuleTrace[]
): RiskLevel {
  // normal BP — risk stratification not applicable for treatment decisions
  if (bpCategory === 'normal') {
    return record(trace, patient, bpCategory, 'low', 'Normal BP — no elevated CV risk from HTN perspective [Bảng 2, p.9]');
  }

  // For isolated_systolic and hypertensive_crisis, treat as grade_2 for risk stratification
  const matrixCategory = bpCategory === 'isolated_systolic' ? 'grade_1'
    : bpCategory === 'hypertensive_crisis' ? 'grade_2'
    : bpCategory as 'high_normal' | 'grade_1' | 'grade_2';

  const tier = computeRiskTier(patient);

  // Tier 3+ is always high risk regardless of BP category
  if (tier === 'tier3plus') {
    return record(trace, patient, bpCategory, 'high', buildTier3Reason(patient));
  }

  // Matrix lookup
  const riskMap: Record<RiskTier, Record<'high_normal' | 'grade_1' | 'grade_2', RiskLevel>> = {
    tier0:    { high_normal: 'low',          grade_1: 'low',          grade_2: 'intermediate' },
    tier1_2:  { high_normal: 'low',          grade_1: 'intermediate', grade_2: 'high'         },
    tier3plus:{ high_normal: 'high',         grade_1: 'high',         grade_2: 'high'         },
  };

  const risk = riskMap[tier][matrixCategory];
  const rfCount = countRiskFactors(patient);
  return record(trace, patient, bpCategory, risk,
    `${rfCount} risk factor(s) → ${tier}; BP category ${matrixCategory} → ${risk} [Bảng 2, p.9]`);
}

export function computeRiskTier(patient: PatientContext): RiskTier {
  // Tier 3+: ≥3 risk factors, TOD, CKD≥3, diabetes, established CVD
  if (
    patient.hasDiabetesType2 ||
    patient.hasASCVD ||
    patient.hasCAD ||
    patient.hasPostMI ||
    patient.hasHeartFailure ||
    patient.hasPostStroke ||
    patient.hasTargetOrganDamage ||
    isCKDStage3Plus(patient.ckdStage)
  ) {
    return 'tier3plus';
  }

  const rfCount = countRiskFactors(patient);
  if (rfCount >= 3) return 'tier3plus';
  if (rfCount >= 1) return 'tier1_2';
  return 'tier0';
}

function isCKDStage3Plus(ckd?: string): boolean {
  return ckd === 'stage_3' || ckd === 'stage_4' || ckd === 'stage_5' || ckd === 'dialysis' || ckd === 'transplant';
}

export function countRiskFactors(patient: PatientContext): number {
  let count = 0;
  if (patient.ageYears > 65) count++;
  if (patient.sex === 'male') count++;
  if (patient.heartRateBpm !== undefined && patient.heartRateBpm > 80) count++;
  if (patient.isOverweight) count++;
  if (patient.hasElevatedLDLOrTriglycerides) count++;
  if (patient.hasFamilyHistoryCVD) count++;
  if (patient.hasFamilyHistoryHTN) count++;
  if (patient.hasEarlyMenopause) count++;
  if (patient.isSmoker) count++;
  return count;
}

function buildTier3Reason(patient: PatientContext): string {
  const reasons: string[] = [];
  if (patient.hasDiabetesType2) reasons.push('T2D (tier-3 condition)');
  if (patient.hasASCVD) reasons.push('established ASCVD');
  if (patient.hasCAD) reasons.push('CAD');
  if (patient.hasPostMI) reasons.push('post-MI');
  if (patient.hasHeartFailure) reasons.push('heart failure');
  if (patient.hasPostStroke) reasons.push('post-stroke');
  if (patient.hasTargetOrganDamage) reasons.push('target organ damage');
  if (isCKDStage3Plus(patient.ckdStage)) reasons.push(`CKD ${patient.ckdStage}`);
  const rfCount = countRiskFactors(patient);
  if (rfCount >= 3) reasons.push(`${rfCount} risk factors ≥3`);
  return `High risk: ${reasons.join(', ')} [Bảng 2, p.9]`;
}

function record(
  trace: RuleTrace[],
  patient: PatientContext,
  bpCategory: BPCategory,
  risk: RiskLevel,
  reasoning: string
): RiskLevel {
  trace.push({
    ruleId: 'stratify_risk',
    ruleDescription: 'CV risk stratification per Bảng 2',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 2', page: 9, verbatimQuote: 'Bảng 2. Phân tầng nguy cơ trong tăng huyết áp' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs: {
      bpCategory,
      ageYears: patient.ageYears,
      sex: patient.sex,
      hasDiabetesType2: patient.hasDiabetesType2,
      hasASCVD: patient.hasASCVD,
      ckdStage: patient.ckdStage,
      hasTargetOrganDamage: patient.hasTargetOrganDamage,
    },
    output: risk,
    reasoning,
  });
  return risk;
}
