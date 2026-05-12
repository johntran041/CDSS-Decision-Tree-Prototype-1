import type {
  PatientContext,
  BPCategory,
  RiskLevel,
  KnowledgeBase,
  RuleTrace,
  DrugRecommendation,
  DrugClassCode,
} from '../types.js';

export interface PathwayStepResult {
  stepId: string;
  drugRecommendation: DrugRecommendation | undefined;
  status: 'PRESCRIBE' | 'LIFESTYLE_ONLY' | 'REFER_SPECIALIST';
  guidanceMessages: string[];
  nextEvaluationWeeks: number;
}

export function runEssentialPathway(
  patient: PatientContext,
  bpCategory: BPCategory,
  cvRiskLevel: RiskLevel,
  _kb: KnowledgeBase,
  trace: RuleTrace[]
): PathwayStepResult {
  const guidance: string[] = [
    'Lifestyle changes per Bảng 8 alongside any pharmacotherapy',
  ];

  // Resistant HTN: already on A+C+D at usual dose for ≥1 month, not at target
  if (isResistantHTN(patient)) {
    trace.push(makeTrace('h3_r6_resistant', { resistant: true }, 'REFER_SPECIALIST',
      'Triple A+C+D at usual dose ≥1 month, not at target → khó kiểm soát (difficult-to-control). Refer specialist [Hình 3, p.17]'));
    return {
      stepId: 'h3_r6_resistant',
      drugRecommendation: undefined,
      status: 'REFER_SPECIALIST',
      guidanceMessages: [...guidance, 'Refer to specialist: difficult-to-control (khó kiểm soát) hypertension per Hình 3'],
      nextEvaluationWeeks: 1,
    };
  }

  // Escalation: on dual therapy at usual dose, not at target
  if (isDualEscalationNeeded(patient)) {
    const rec = makeTripleRec();
    trace.push(makeTrace('h3_r5_triple_combination',
      { currentMeds: patient.currentMedications, bpAtTarget: patient.bpAtTargetCurrentRegimen },
      rec.classCodes,
      'On dual combination not at target → escalate to triple A+C+D [Hình 3, p.17]'));
    return {
      stepId: 'h3_r5_triple_combination',
      drugRecommendation: rec,
      status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Escalated to triple combination A+C+D'],
      nextEvaluationWeeks: 4,
    };
  }

  // Escalation: on monotherapy not at target
  if (isMonoEscalationNeeded(patient)) {
    const rec = makeDualRec('low');
    trace.push(makeTrace('h3_r4_dual_combination',
      { currentMeds: patient.currentMedications, bpAtTarget: patient.bpAtTargetCurrentRegimen },
      rec.classCodes,
      'On monotherapy not at target → escalate to dual combination A+C or A+D [Hình 3, p.17]'));
    return {
      stepId: 'h3_r4_dual_combination',
      drugRecommendation: rec,
      status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Escalated from monotherapy to dual combination'],
      nextEvaluationWeeks: 4,
    };
  }

  const isHABTC = bpCategory === 'high_normal';
  const isLowIntermediate = cvRiskLevel === 'low' || cvRiskLevel === 'intermediate';
  const hasComorbidity = !!(patient.hasDiabetesType2 || patient.hasCAD || patient.hasASCVD ||
    patient.hasPostStroke || (patient.ckdStage && patient.ckdStage !== 'none') ||
    patient.hasHeartFailure || patient.hasPostMI);

  // HABTC + low/intermediate risk + no comorbidity → lifestyle first
  if (isHABTC && isLowIntermediate && !hasComorbidity) {
    const months = patient.monthsOnLifestyleChange ?? 0;
    if (months < 3) {
      trace.push(makeTrace('h3_r2_branch',
        { bpCategory, cvRiskLevel, monthsOnLifestyleChange: months },
        'LIFESTYLE_ONLY',
        'HABTC + low/intermediate risk + no comorbidity → lifestyle modification for 3-6 months before drug initiation [Hình 3, p.17]'));
      return {
        stepId: 'h3_r2_branch',
        drugRecommendation: undefined,
        status: 'LIFESTYLE_ONLY',
        guidanceMessages: [
          ...guidance,
          'HABTC with low/intermediate risk: lifestyle modification for 3-6 months before drug consideration',
        ],
        nextEvaluationWeeks: 4,
      };
    }
    // ≥3 months lifestyle, BP still elevated → start monotherapy
    trace.push(makeTrace('h3_r3_monotherapy',
      { bpCategory, cvRiskLevel, monthsOnLifestyleChange: months },
      ['A', 'B', 'C', 'D'],
      `HABTC + low/intermediate risk after ${months} months lifestyle → start monotherapy low dose [Hình 3, p.17]`));
    return {
      stepId: 'h3_r3_monotherapy',
      drugRecommendation: makeMonoRec(),
      status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Monotherapy after lifestyle modification period', 'Thiazide-like preferred over thiazide'],
      nextEvaluationWeeks: 4,
    };
  }

  // Age ≥80 or frail → monotherapy low dose
  if (patient.ageYears >= 80 || patient.isFrail) {
    trace.push(makeTrace('h3_r3_monotherapy',
      { ageYears: patient.ageYears, isFrail: patient.isFrail },
      ['A', 'B', 'C', 'D'],
      'Age ≥80 or frail → monotherapy low dose to minimise adverse effects [Hình 3, p.17]'));
    return {
      stepId: 'h3_r3_monotherapy',
      drugRecommendation: makeMonoRec(),
      status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Low-dose monotherapy for elderly/frail patient', 'Titrate cautiously'],
      nextEvaluationWeeks: 4,
    };
  }

  // Default: dual combination (grade 1/2 or high-risk HABTC)
  const doseLevel = bpCategory === 'grade_2' ? 'usual' : 'low';
  const rec = makeDualRec(doseLevel);
  trace.push(makeTrace('h3_r4_dual_combination',
    { bpCategory, cvRiskLevel, hasComorbidity },
    rec.classCodes,
    `Grade 1/2 HTN or high-risk HABTC → dual combination preferred A+C or A+D at ${doseLevel} dose [Hình 3, p.17]`));
  return {
    stepId: 'h3_r4_dual_combination',
    drugRecommendation: rec,
    status: 'PRESCRIBE',
    guidanceMessages: [
      ...guidance,
      'Preferred combination: A+C (RAS blocker + CCB) or A+D (RAS blocker + diuretic)',
      'Thiazide-like diuretic preferred over thiazide [Hình 3, p.17]',
    ],
    nextEvaluationWeeks: 4,
  };
}

function isResistantHTN(patient: PatientContext): boolean {
  if (!patient.currentMedications || patient.bpAtTargetCurrentRegimen !== false) return false;
  if ((patient.monthsOnCurrentRegimen ?? 0) < 1) return false;
  const meds = patient.currentMedications;
  const hasA = meds.some(m => m.classCode === 'A' && m.doseLevel !== 'low');
  const hasC = meds.some(m => m.classCode === 'C' && m.doseLevel !== 'low');
  const hasD = meds.some(m => m.classCode === 'D' && m.doseLevel !== 'low');
  return hasA && hasC && hasD;
}

function isDualEscalationNeeded(patient: PatientContext): boolean {
  if (!patient.currentMedications || patient.bpAtTargetCurrentRegimen !== false) return false;
  if ((patient.monthsOnCurrentRegimen ?? 0) < 1) return false;
  const meds = patient.currentMedications;
  return meds.length >= 2 && !meds.some(m => m.classCode === 'D' && meds.some(n => n.classCode === 'C' && meds.some(o => o.classCode === 'A')));
}

function isMonoEscalationNeeded(patient: PatientContext): boolean {
  if (!patient.currentMedications || patient.bpAtTargetCurrentRegimen !== false) return false;
  if ((patient.monthsOnCurrentRegimen ?? 0) < 1) return false;
  return patient.currentMedications.length === 1;
}

function makeMonoRec(): DrugRecommendation {
  return {
    classCodes: ['A', 'B', 'C', 'D'],
    preferredCombination: [['A'], ['C'], ['D']],
    doseLevel: 'low',
    pillForm: 'loose',
    notes: ['Choose single agent based on patient profile', 'Thiazide-like preferred over thiazide'],
  };
}

function makeDualRec(doseLevel: 'low' | 'usual'): DrugRecommendation {
  return {
    classCodes: ['A', 'C', 'D', 'B'],
    preferredCombination: [['A', 'C'], ['A', 'D']],
    doseLevel,
    pillForm: 'loose',
    notes: [
      'Preferred: A+C or A+D',
      'Alternatives: A+B, B+C, B+D, C+D',
      'Thiazide-like preferred over thiazide',
      'B may be added at any step for compelling indication (HF, angina, post-MI, AF)',
    ],
  };
}

function makeTripleRec(): DrugRecommendation {
  return {
    classCodes: ['A', 'C', 'D'],
    preferredCombination: [['A', 'C', 'D']],
    doseLevel: 'usual',
    pillForm: 'loose',
    notes: ['Triple combination A+C+D at usual dose', 'Monitor renal function and electrolytes'],
  };
}

function makeTrace(
  ruleId: string,
  inputs: Record<string, unknown>,
  output: unknown,
  reasoning: string
): RuleTrace {
  const pageMap: Record<string, number> = {
    h3_r2_branch: 17, h3_r3_monotherapy: 17,
    h3_r4_dual_combination: 17, h3_r5_triple_combination: 17, h3_r6_resistant: 17,
  };
  return {
    ruleId,
    ruleDescription: `Essential pathway step: ${ruleId}`,
    source: { document: 'VSH/VNHA 2022', reference: 'Hình 3', page: pageMap[ruleId] ?? 17, verbatimQuote: 'Hình 3. Sơ đồ điều trị tăng huyết áp thiết yếu VSH/VNHA 2022' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs,
    output,
    reasoning,
  };
}

// Exported for B-addition logic in the main engine
export function getBAdditionDrugCodes(
  baseCodes: DrugClassCode[],
  patient: PatientContext
): DrugClassCode[] {
  const needsB = patient.hasHeartFailure || patient.hasAngina || patient.hasPostMI ||
    patient.hasAtrialFibrillation;
  if (needsB && !baseCodes.includes('B')) return [...baseCodes, 'B'];
  return baseCodes;
}
