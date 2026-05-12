import type {
  PatientContext,
  KnowledgeBase,
  Recommendation,
  RuleTrace,
  SafetyAlert,
  BPCategory,
  RiskLevel,
} from '../types.js';
import { classifyBP } from './classify.js';
import { stratifyRisk } from './stratifyRisk.js';
import { computeThreshold } from './thresholds.js';
import { computeTarget } from './targets.js';
import { selectPathway } from './pathwaySelector.js';
import { detectCompellingIndication } from './compellingIndication.js';
import { runEssentialPathway } from './essentialPathway.js';
import { runOptimalPathway } from './optimalPathway.js';
import { applyContraindications } from './safetyChecks.js';

const CRISIS_SBP = 180;
const CRISIS_DBP = 120;

export function runEngine(patient: PatientContext, kb: KnowledgeBase): Recommendation {
  const trace: RuleTrace[] = [];
  const safetyAlerts: SafetyAlert[] = [];

  // 1. Out-of-scope: pregnancy
  if (patient.isPregnant) {
    return buildOutOfScope('pregnancy', trace, patient);
  }

  // 2. Safety halt: hypertensive crisis
  if (patient.officeSBP >= CRISIS_SBP || patient.officeDBP >= CRISIS_DBP) {
    return buildSafetyHalt(patient, trace, safetyAlerts, kb);
  }

  // 3. BP classification
  const bpCategory = classifyBP(patient, kb, trace);

  // 4. CV risk stratification
  const cvRiskLevel = stratifyRisk(patient, bpCategory, kb, trace);

  // 5. Treatment threshold and target
  const threshold = computeThreshold(patient, kb, trace);
  const target = computeTarget(patient, kb, trace);

  // 6. Below threshold: only early-exit if NOT in HABTC range and no active med escalation.
  //    HABTC patients need pathway logic (lifestyle trial + duration check).
  //    Patients on meds not at target need escalation regardless of current BP vs threshold.
  const exceedsThreshold = patient.officeSBP >= threshold.sbp || patient.officeDBP >= threshold.dbp;
  const isHABTCRange = bpCategory === 'high_normal';
  const hasActiveMedEscalation =
    (patient.currentMedications?.length ?? 0) > 0 && patient.bpAtTargetCurrentRegimen === false;

  if (!exceedsThreshold && !isHABTCRange && !hasActiveMedEscalation) {
    trace.push({
      ruleId: 'threshold_check',
      ruleDescription: 'Check if BP meets treatment threshold',
      source: { document: 'VSH/VNHA 2022', reference: 'Bảng 6', page: 15, verbatimQuote: 'Bảng 6. Ngưỡng huyết áp phòng khám cho điều trị tăng huyết áp theo nhóm tuổi' },
      inputs: { officeSBP: patient.officeSBP, officeDBP: patient.officeDBP, threshold },
      output: 'LIFESTYLE_ONLY',
      reasoning: `BP ${patient.officeSBP}/${patient.officeDBP} below threshold ${threshold.sbp}/${threshold.dbp} → lifestyle only`,
    });
    selectPathway(patient, trace);
    return {
      status: 'LIFESTYLE_ONLY',
      bpCategory,
      cvRiskLevel,
      treatmentThreshold: threshold,
      treatmentTarget: target,
      pathwayUsed: patient.siteConfig.pathwayMode,
      safetyAlerts: [],
      trace,
      guidanceMessages: [
        'BP below treatment threshold. Continue lifestyle modification.',
        'Lifestyle changes: sodium restriction, DASH diet, weight management, exercise, alcohol reduction, smoking cessation [Bảng 8]',
        'Re-evaluate in 4 weeks',
      ],
      nextEvaluationWeeks: 4,
    };
  }

  // 7. Detect compelling indication
  const compelling = detectCompellingIndication(patient, kb, trace);

  // 8. Select pathway
  const pathway = selectPathway(patient, trace);

  // 9. Run pathway
  const stepResult = pathway === 'essential'
    ? runEssentialPathway(patient, bpCategory, cvRiskLevel, kb, trace)
    : runOptimalPathway(patient, bpCategory, cvRiskLevel, compelling, kb, trace);

  // 10. Safety check: filter contraindicated drugs
  const filteredRec = applyContraindications(stepResult.drugRecommendation, patient, kb, safetyAlerts, trace);

  // Update the pathway step trace entry to show post-filter drug classes (Bug 2 fix)
  if (filteredRec && stepResult.drugRecommendation) {
    const pathwayTrace = [...trace].reverse().find(t =>
      t.ruleId.startsWith('h3_') || t.ruleId.startsWith('h4_')
    );
    if (pathwayTrace && Array.isArray(pathwayTrace.output)) {
      const preCodes = pathwayTrace.output as string[];
      const postCodes = filteredRec.classCodes as string[];
      const removed = preCodes.filter(c => !postCodes.includes(c));
      if (removed.length > 0) {
        pathwayTrace.output = postCodes;
        pathwayTrace.reasoning += ` | After contraindication filter: removed [${removed.join(', ')}]`;
      }
    }
  }

  // 11. If all drugs removed by CIs and no escalation → refer specialist
  let finalStatus = stepResult.status;
  const finalMessages = [...stepResult.guidanceMessages];

  if (stepResult.status === 'PRESCRIBE' && !filteredRec) {
    finalStatus = 'REFER_SPECIALIST';
    finalMessages.push('All recommended drug classes are contraindicated for this patient. Specialist referral required.');
    safetyAlerts.push({
      severity: 'contraindication',
      reason: 'All recommended drug classes have absolute contraindications. Cannot prescribe via standard pathway.',
      source: { reference: 'Bảng 11', page: 23 },
    });
    trace.push({
      ruleId: 'escalate_all_ci',
      ruleDescription: 'Escalate to specialist when all drug classes are contraindicated',
      source: { document: 'VSH/VNHA 2022', reference: 'Bảng 11', page: 23, verbatimQuote: 'Bảng 11. Chống chỉ định của các nhóm thuốc điều trị tăng huyết áp chính' },
      inputs: {},
      output: 'REFER_SPECIALIST',
      reasoning: 'No safe drug class available after contraindication filtering',
    });
  }

  addStandardGuidance(patient, finalMessages, compelling);

  return {
    status: finalStatus,
    bpCategory,
    cvRiskLevel,
    treatmentThreshold: threshold,
    treatmentTarget: target,
    pathwayUsed: pathway,
    currentStep: stepResult.stepId,
    drugRecommendation: filteredRec,
    safetyAlerts,
    trace,
    guidanceMessages: [...new Set(finalMessages)],
    nextEvaluationWeeks: stepResult.nextEvaluationWeeks,
  };
}

function addStandardGuidance(
  patient: PatientContext,
  messages: string[],
  compelling: string
): void {
  if (compelling !== 'none') {
    messages.push('Monitor eGFR and potassium after RAS blocker initiation');
  }
  if (patient.hasDiabetesType2) {
    messages.push('Monitor HbA1c alongside BP management');
  }
  if (patient.ckdStage && patient.ckdStage !== 'none') {
    messages.push('Monitor eGFR and urine protein at each visit');
  }
}

function buildOutOfScope(
  reason: string,
  trace: RuleTrace[],
  patient: PatientContext
): Recommendation {
  trace.push({
    ruleId: 'out_of_scope_check',
    ruleDescription: 'Check for out-of-scope conditions',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 15-16', page: 29, verbatimQuote: 'Bảng 15-16: THA trong thai kỳ — chống chỉ định ƯCMC, CTTA, ức chế renin, MRA (Class III, C)' },
    inputs: { reason },
    output: 'OUT_OF_SCOPE',
    reasoning: `Pregnancy management requires the dedicated pregnancy pathway (Bảng 15-16). Not implemented in this prototype.`,
  });

  return {
    status: 'OUT_OF_SCOPE',
    bpCategory: classifyBPSimple(patient.officeSBP, patient.officeDBP),
    cvRiskLevel: 'low',
    pathwayUsed: patient.siteConfig.pathwayMode,
    safetyAlerts: [],
    trace,
    guidanceMessages: [
      'Pregnancy management requires the dedicated pregnancy pathway (Bảng 15-16). Not implemented in this prototype.',
    ],
  };
}

function buildSafetyHalt(
  patient: PatientContext,
  trace: RuleTrace[],
  safetyAlerts: SafetyAlert[],
  kb: KnowledgeBase
): Recommendation {
  safetyAlerts.push({
    severity: 'contraindication',
    reason: 'Suspected hypertensive crisis (SBP ≥180 or DBP ≥120). Refer to emergency protocol.',
    source: { reference: 'Bảng 14', page: 28 },
  });
  trace.push({
    ruleId: 'safety_halt_crisis',
    ruleDescription: 'Halt: hypertensive crisis detected',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 14', page: 28, verbatimQuote: 'Cơn tăng huyết áp ≥ 180 và/hoặc ≥ 120 mmHg [Bảng 1, p.7]; đánh giá tổn thương cơ quan đích để chẩn đoán THA khẩn cấp hoặc cấp cứu [Bảng 14, p.28]' },
    inputs: { officeSBP: patient.officeSBP, officeDBP: patient.officeDBP },
    output: 'SAFETY_HALT',
    reasoning: `SBP ${patient.officeSBP} ≥180 or DBP ${patient.officeDBP} ≥120 → hypertensive crisis out of outpatient scope`,
  });

  const bpCategory: BPCategory = 'hypertensive_crisis';
  const cvRiskLevel: RiskLevel = 'high';

  void kb; // kb available if needed in future

  return {
    status: 'SAFETY_HALT',
    bpCategory,
    cvRiskLevel,
    pathwayUsed: patient.siteConfig.pathwayMode,
    safetyAlerts,
    trace,
    guidanceMessages: [
      'Suspected hypertensive crisis. Out of scope for outpatient pathway.',
      'Refer to emergency protocol (Bảng 14, p.28).',
      'Do NOT delay: initiate emergency assessment immediately.',
    ],
  };
}

function classifyBPSimple(sbp: number, dbp: number): BPCategory {
  if (sbp >= CRISIS_SBP || dbp >= CRISIS_DBP) return 'hypertensive_crisis';
  if (sbp >= 160 || dbp >= 100) return 'grade_2';
  if (sbp >= 140 && dbp < 90) return 'isolated_systolic';
  if (sbp >= 140 || dbp >= 90) return 'grade_1';
  if (sbp >= 130 || dbp >= 85) return 'high_normal';
  return 'normal';
}
