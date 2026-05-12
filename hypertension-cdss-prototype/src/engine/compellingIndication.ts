import type { PatientContext, CompellingIndication, KnowledgeBase, RuleTrace } from '../types.js';

export function detectCompellingIndication(
  patient: PatientContext,
  _kb: KnowledgeBase,
  trace: RuleTrace[]
): CompellingIndication {
  let indication: CompellingIndication = 'none';

  // Priority order: most specific/acute first
  if (patient.hasHeartFailure && patient.hfrefEjectionFraction !== undefined && patient.hfrefEjectionFraction < 40) {
    indication = 'heart_failure_reduced_ef';
  } else if (patient.hasHeartFailure) {
    indication = 'heart_failure_preserved_ef';
  } else if (patient.hasPostMI) {
    indication = 'post_myocardial_infarction';
  } else if (patient.hasCAD) {
    indication = 'coronary_artery_disease';
  } else if (patient.hasAngina) {
    indication = 'angina';
  } else if (patient.hasPostStroke) {
    indication = 'post_stroke';
  } else if (patient.ckdStage && patient.ckdStage !== 'none') {
    indication = 'chronic_kidney_disease';
  } else if (patient.hasDiabetesType2) {
    indication = 'type2_diabetes_high_risk';
  } else if (patient.hasAtrialFibrillation) {
    indication = 'atrial_fibrillation';
  } else if (patient.hasLVH) {
    indication = 'left_ventricular_hypertrophy';
  }

  trace.push({
    ruleId: 'detect_compelling_indication',
    ruleDescription: 'Identify comorbidity-driven compelling indication per Section 3.7',
    source: { document: 'VSH/VNHA 2022', reference: 'Section 3.7', page: 30, verbatimQuote: 'Phần 3.7: Tăng huyết áp và một số bệnh đồng mắc' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs: {
      hasHeartFailure: patient.hasHeartFailure,
      hfrefEjectionFraction: patient.hfrefEjectionFraction,
      hasPostMI: patient.hasPostMI,
      hasCAD: patient.hasCAD,
      hasAngina: patient.hasAngina,
      hasPostStroke: patient.hasPostStroke,
      ckdStage: patient.ckdStage,
      hasDiabetesType2: patient.hasDiabetesType2,
      hasAtrialFibrillation: patient.hasAtrialFibrillation,
      hasLVH: patient.hasLVH,
    },
    output: indication,
    reasoning: indication === 'none'
      ? 'No compelling indication detected'
      : `Compelling indication: ${indication}`,
  });

  return indication;
}
