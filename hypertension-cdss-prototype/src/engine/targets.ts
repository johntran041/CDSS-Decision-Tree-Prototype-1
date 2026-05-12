import type { PatientContext, KnowledgeBase, RuleTrace } from '../types.js';

export interface TargetResult {
  sbpMin: number;
  sbpMax: number;
  dbpMax: number;
  reasoning: string;
}

export function computeTarget(
  patient: PatientContext,
  kb: KnowledgeBase,
  trace: RuleTrace[]
): TargetResult {
  const ageGroup = patient.ageYears >= 70 ? '>=70' : '18-69';
  const entry = kb.targets.find(t => t.ageGroup === ageGroup);
  if (!entry) throw new Error(`No target entry for age group: ${ageGroup}`);

  const hasComorbidity = !!(
    patient.hasDiabetesType2 || patient.hasCAD || patient.hasASCVD ||
    patient.hasPostStroke || (patient.ckdStage && patient.ckdStage !== 'none')
  );

  const sbpMin = hasComorbidity ? entry.sbpMinWithComorbidity : entry.sbpMinNoComorbidity;
  const sbpMax = hasComorbidity ? entry.sbpMaxWithComorbidity : entry.sbpMaxNoComorbidity;

  // Special case: T2D or CAD without revascularization, age >65 → DBP target 70-79 mmHg
  let dbpMax = entry.dbpMax;
  let dbpNote = '';
  if (patient.ageYears > 65 && (patient.hasDiabetesType2 || patient.hasCAD)) {
    dbpMax = 79;
    dbpNote = ' (DBP 70-79 for T2D/CAD without revascularization age ≥65)';
  }

  const comorbStr = hasComorbidity ? 'with comorbidity' : 'no comorbidity';
  const reasoning = `Age ${patient.ageYears} (${ageGroup}), ${comorbStr} → SBP ${sbpMin}-<${sbpMax}, DBP <${dbpMax}${dbpNote} [${entry.source.reference}, p.${entry.source.page}]`;

  trace.push({
    ruleId: 'compute_target',
    ruleDescription: 'Determine treatment target by age group and comorbidity [Bảng 7]',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 7', page: 16, verbatimQuote: 'Bảng 7. Mục tiêu huyết áp phòng khám trong điều trị tăng huyết áp theo nhóm tuổi' },
    evidenceClass: 'I',
    evidenceLevel: 'A',
    inputs: { ageYears: patient.ageYears, ageGroup, hasComorbidity },
    output: { sbpMin, sbpMax, dbpMax },
    reasoning,
  });

  return { sbpMin, sbpMax, dbpMax, reasoning };
}
