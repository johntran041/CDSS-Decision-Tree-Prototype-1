import type {
  PatientContext,
  BPCategory,
  RiskLevel,
  CompellingIndication,
  KnowledgeBase,
  RuleTrace,
  DrugRecommendation,
  DrugClassCode,
} from '../types.js';
import type { PathwayStepResult } from './essentialPathway.js';

export function runOptimalPathway(
  patient: PatientContext,
  bpCategory: BPCategory,
  cvRiskLevel: RiskLevel,
  compelling: CompellingIndication,
  kb: KnowledgeBase,
  trace: RuleTrace[]
): PathwayStepResult {
  const guidance: string[] = ['Lifestyle changes per Bảng 8 alongside any pharmacotherapy'];

  // Resistant: on triple A+C+D at usual dose ≥1 month, not at target
  if (isResistantHTN(patient)) {
    return handleResistant(patient, kb, trace, guidance);
  }

  // Escalation from dual not at target
  if (isDualEscalationNeeded(patient)) {
    const rec = makeTripleSPC();
    trace.push(mkTrace('h4_r5_spc_triple', { currentMeds: patient.currentMedications }, rec.classCodes,
      'On dual combination not at target → escalate to single-pill triple A+C+D [Hình 4, p.18]'));
    return { stepId: 'h4_r5_spc_triple', drugRecommendation: rec, status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Single-pill triple combination A+C+D'], nextEvaluationWeeks: 4 };
  }

  // Escalation from mono not at target
  if (isMonoEscalationNeeded(patient)) {
    const rec = makeDualSPC('low');
    trace.push(mkTrace('h4_r4_spc_dual', { currentMeds: patient.currentMedications }, rec.classCodes,
      'On monotherapy not at target → escalate to single-pill dual A+C or A+D [Hình 4, p.18]'));
    return { stepId: 'h4_r4_spc_dual', drugRecommendation: rec, status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Escalate to single-pill dual combination'], nextEvaluationWeeks: 4 };
  }

  // Compelling indication takes priority
  if (compelling !== 'none') {
    return handleCompelling(patient, compelling, kb, trace, guidance);
  }

  const isHABTC = bpCategory === 'high_normal';
  const isLowIntermediate = cvRiskLevel === 'low' || cvRiskLevel === 'intermediate';
  const hasComorbidity = !!(patient.hasDiabetesType2 || patient.hasCAD || patient.hasASCVD ||
    patient.hasPostStroke || (patient.ckdStage && patient.ckdStage !== 'none') ||
    patient.hasHeartFailure || patient.hasPostMI);

  // HABTC + low/intermediate risk → lifestyle first
  if (isHABTC && isLowIntermediate && !hasComorbidity) {
    const months = patient.monthsOnLifestyleChange ?? 0;
    if (months < 3) {
      trace.push(mkTrace('h4_r2_branch', { bpCategory, cvRiskLevel }, 'LIFESTYLE_ONLY',
        'HABTC + low/intermediate risk → lifestyle modification for 3-6 months [Hình 4, p.18]'));
      return { stepId: 'h4_r2_branch', drugRecommendation: undefined, status: 'LIFESTYLE_ONLY',
        guidanceMessages: [...guidance, 'HABTC: lifestyle modification for 3-6 months'], nextEvaluationWeeks: 4 };
    }
    // After 3+ months → single-pill monotherapy
    trace.push(mkTrace('h4_r3_monotherapy', { bpCategory, cvRiskLevel, months }, ['A', 'B', 'C', 'D'],
      `HABTC after ${months} months lifestyle → single-pill monotherapy low dose [Hình 4, p.18]`));
    return { stepId: 'h4_r3_monotherapy', drugRecommendation: makeMonoSPC(),
      status: 'PRESCRIBE', guidanceMessages: [...guidance, 'Single-pill monotherapy low dose'], nextEvaluationWeeks: 4 };
  }

  // Age ≥80 or frail → monotherapy
  if (patient.ageYears >= 80 || patient.isFrail) {
    trace.push(mkTrace('h4_r3_monotherapy', { ageYears: patient.ageYears, isFrail: patient.isFrail }, ['A', 'C', 'D'],
      'Age ≥80 or frail → single-pill monotherapy low dose [Hình 4, p.18]'));
    return { stepId: 'h4_r3_monotherapy', drugRecommendation: makeMonoSPC(), status: 'PRESCRIBE',
      guidanceMessages: [...guidance, 'Low-dose monotherapy for elderly/frail', 'Titrate cautiously'], nextEvaluationWeeks: 4 };
  }

  // Default: single-pill dual combination
  const doseLevel = bpCategory === 'grade_2' ? 'usual' : 'low';
  const rec = makeDualSPC(doseLevel);
  trace.push(mkTrace('h4_r4_spc_dual', { bpCategory, cvRiskLevel, hasComorbidity }, rec.classCodes,
    `Grade 1/2 HTN or high-risk → single-pill dual A+C or A+D at ${doseLevel} dose [Hình 4, p.18]`));
  return {
    stepId: 'h4_r4_spc_dual', drugRecommendation: rec, status: 'PRESCRIBE',
    guidanceMessages: [...guidance, 'Single-pill dual combination preferred'],
    nextEvaluationWeeks: 4,
  };
}

const COMPELLING_VERBATIM_QUOTES: Partial<Record<CompellingIndication, string>> = {
  heart_failure_reduced_ef: 'Bảng 20: Ở bệnh nhân THA có suy tim EF giảm (HFrEF), khuyến cáo dùng ƯCMC hoặc CTTA / ARNI và thuốc chẹn beta, lợi tiểu và/hoặc kháng aldosterone và SGLT2i (Class I, A)',
  coronary_artery_disease: 'Bảng 19: Thuốc ƯCMC/CTTA + CB là chỉ định hàng đầu (Class I, B)',
  post_myocardial_infarction: 'Bảng 19: Thuốc ƯCMC/CTTA + CB là chỉ định hàng đầu (Class I, B)',
  post_stroke: 'Section 3.7.5: Tăng huyết áp và Đột quỵ',
  chronic_kidney_disease: 'Bảng 22: Liệu pháp ban đầu nên kết hợp thuốc ức chế RAS với CKCa hoặc thuốc lợi tiểu (Class I, A)',
  type2_diabetes_high_risk: 'Bảng 18. Chiến lược điều trị tăng huyết áp kèm theo đái tháo đường (Class I, A)',
};

function handleCompelling(
  patient: PatientContext,
  compelling: CompellingIndication,
  kb: KnowledgeBase,
  trace: RuleTrace[],
  guidance: string[]
): PathwayStepResult {
  const entry = kb.compellingIndications.find(c => c.indication === compelling);
  if (!entry) throw new Error(`No KB entry for compelling indication: ${compelling}`);

  const baseCodes = deduplicateCodes(entry.preferredClasses.flat());

  // Add B for AF rate control or angina if not already present
  let finalCodes: DrugClassCode[] = [...baseCodes];
  if ((patient.hasAtrialFibrillation || patient.hasAngina) && !finalCodes.includes('B')) {
    finalCodes.push('B');
  }

  const notes: string[] = [...entry.notes];

  // AMBIGUITY: Bảng 7 footnote says > 65, Bảng 18 says ≥ 70 for this rule. Using ≥ 65 (more inclusive, safer). Dr. Huy should confirm.
  if (
    compelling === 'type2_diabetes_high_risk' &&
    patient.hasCAD &&
    !patient.hasRevascularization &&
    patient.ageYears >= 65
  ) {
    notes.push('DBP target 70-79 mmHg (T2D + CAD without revascularization, age ≥ 65) [Bảng 7 footnote, p.16; Bảng 18, p.32]');
  }

  const dedupedNotes = Array.from(new Set(notes));

  const rec: DrugRecommendation = {
    classCodes: finalCodes,
    preferredCombination: entry.preferredClasses as DrugClassCode[][],
    doseLevel: 'low',
    pillForm: 'single_pill',
    notes: dedupedNotes,
  };

  const verbatimQuote = COMPELLING_VERBATIM_QUOTES[compelling] ?? 'Hình 4. Sơ đồ điều trị tăng huyết áp tối ưu VSH/VNHA 2022';

  trace.push(mkTrace('h4_r7_compelling',
    { compelling, preferredClasses: entry.preferredClasses },
    finalCodes,
    `Compelling indication ${compelling} → ${entry.preferredClasses.map(c => c.join('+')).join(' or ')} [${entry.source.reference}, p.${entry.source.page}]`,
    verbatimQuote));

  return {
    stepId: 'h4_r7_compelling',
    drugRecommendation: rec,
    status: 'PRESCRIBE',
    guidanceMessages: [...guidance, ...dedupedNotes],
    nextEvaluationWeeks: 4,
  };
}

function handleResistant(
  patient: PatientContext,
  kb: KnowledgeBase,
  trace: RuleTrace[],
  guidance: string[]
): PathwayStepResult {
  const egfr = patient.egfrMlMin ?? 999;
  const potassium = patient.potassiumMmolL ?? 0;

  // MRA caution if eGFR <45 or K >4.5
  if (egfr < 45 || potassium > 4.5) {
    const mraCIEntry = kb.contraindications.find(c => c.drugClass === 'MRA');
    const page = mraCIEntry?.source.page ?? 23;

    const rec: DrugRecommendation = {
      classCodes: ['alpha', 'B', 'loop'],
      preferredCombination: [['alpha'], ['B'], ['loop']],
      doseLevel: 'usual',
      pillForm: 'loose',
      notes: [
        'MRA contraindicated/cautioned: eGFR <45 or K >4.5',
        'Use alternative: alpha-blocker, additional beta-blocker, or loop diuretic',
        'Refer to specialist if still uncontrolled',
      ],
    };
    trace.push(mkTrace('h4_r6_resistant',
      { egfr, potassium, mraCaution: true },
      rec.classCodes,
      `Resistant HTN: MRA cautioned (eGFR ${egfr} <45 or K ${potassium} >4.5) → use alternative [Hình 4, p.18; Bảng 11, p.${page}]`));
    return {
      stepId: 'h4_r6_resistant', drugRecommendation: rec, status: 'PRESCRIBE',
      guidanceMessages: [...guidance, ...rec.notes],
      nextEvaluationWeeks: 2,
    };
  }

  // Add MRA (spironolactone/eplerenone)
  const rec: DrugRecommendation = {
    classCodes: ['A', 'C', 'D', 'MRA'],
    preferredCombination: [['A', 'C', 'D', 'MRA']],
    doseLevel: 'usual',
    pillForm: 'loose',
    notes: [
      'Resistant HTN: add MRA (spironolactone preferred, eplerenone if intolerance)',
      'Monitor eGFR and potassium closely',
      'If BP still uncontrolled after 1 month → refer specialist',
    ],
  };
  trace.push(mkTrace('h4_r6_resistant',
    { egfr, potassium, addMRA: true },
    rec.classCodes,
    'Resistant HTN: add MRA to existing A+C+D [Hình 4, p.18]'));
  return {
    stepId: 'h4_r6_resistant', drugRecommendation: rec, status: 'PRESCRIBE',
    guidanceMessages: [...guidance, ...rec.notes],
    nextEvaluationWeeks: 2,
  };
}

// ---- Helpers ----

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
  return patient.currentMedications.length >= 2;
}

function isMonoEscalationNeeded(patient: PatientContext): boolean {
  if (!patient.currentMedications || patient.bpAtTargetCurrentRegimen !== false) return false;
  if ((patient.monthsOnCurrentRegimen ?? 0) < 1) return false;
  return patient.currentMedications.length === 1;
}

function deduplicateCodes(codes: DrugClassCode[]): DrugClassCode[] {
  return [...new Set(codes)];
}

function makeMonoSPC(): DrugRecommendation {
  return {
    classCodes: ['A', 'C', 'D'],
    preferredCombination: [['A'], ['C'], ['D']],
    doseLevel: 'low',
    pillForm: 'single_pill',
    notes: ['Single-pill monotherapy low dose', 'Choose based on patient profile'],
  };
}

function makeDualSPC(doseLevel: 'low' | 'usual'): DrugRecommendation {
  return {
    classCodes: ['A', 'C', 'D'],
    preferredCombination: [['A', 'C'], ['A', 'D']],
    doseLevel,
    pillForm: 'single_pill',
    notes: ['Single-pill combination preferred for adherence', 'Preferred: A+C or A+D'],
  };
}

function makeTripleSPC(): DrugRecommendation {
  return {
    classCodes: ['A', 'C', 'D'],
    preferredCombination: [['A', 'C', 'D']],
    doseLevel: 'usual',
    pillForm: 'single_pill',
    notes: ['Single-pill triple combination A+C+D at usual dose'],
  };
}

function mkTrace(
  ruleId: string,
  inputs: Record<string, unknown>,
  output: unknown,
  reasoning: string,
  verbatimQuoteOverride?: string
): RuleTrace {
  const refMap: Record<string, string> = {
    h4_r2_branch: 'Hình 4', h4_r3_monotherapy: 'Hình 4',
    h4_r4_spc_dual: 'Hình 4', h4_r5_spc_triple: 'Hình 4',
    h4_r6_resistant: 'Hình 4', h4_r7_compelling: 'Hình 4',
  };
  return {
    ruleId,
    ruleDescription: `Optimal pathway step: ${ruleId}`,
    source: { document: 'VSH/VNHA 2022', reference: refMap[ruleId] ?? 'Hình 4', page: 18, verbatimQuote: verbatimQuoteOverride ?? 'Hình 4. Sơ đồ điều trị tăng huyết áp tối ưu VSH/VNHA 2022' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs,
    output,
    reasoning,
  };
}
