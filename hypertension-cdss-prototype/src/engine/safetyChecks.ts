import type {
  PatientContext,
  DrugRecommendation,
  DrugClassCode,
  SafetyAlert,
  KnowledgeBase,
  RuleTrace,
} from '../types.js';

// Maps patient boolean flags to contraindication condition strings used in the KB
function buildPatientConditions(patient: PatientContext): string[] {
  const conditions: string[] = [];
  if (patient.hasGout) conditions.push('gout');
  if (patient.hasAsthma) conditions.push('asthma');
  if (patient.hasAVBlock) conditions.push('av_block_high_grade');
  if (patient.heartRateBpm !== undefined && patient.heartRateBpm < 60) conditions.push('bradycardia_hr_under_60');
  if (patient.hasBilateralRenalArteryStenosis) conditions.push('bilateral_renal_artery_stenosis');
  if (patient.hasAngioedemaHistory) conditions.push('angioedema_history');
  if (patient.isPregnant) conditions.push('pregnancy');
  if (patient.potassiumMmolL !== undefined && patient.potassiumMmolL > 5.5) conditions.push('hyperkalemia_over_5_5');
  if (patient.potassiumMmolL !== undefined && patient.potassiumMmolL > 5.0) conditions.push('hyperkalemia');
  if (patient.egfrMlMin !== undefined && patient.egfrMlMin < 30) conditions.push('acute_renal_failure_egfr_under_30');
  if (patient.hfrefEjectionFraction !== undefined && patient.hfrefEjectionFraction < 40) conditions.push('lvef_under_40');
  return conditions;
}

// Maps drug class code to the KB entry drugClass keys
function getKBKeysForClass(classCode: DrugClassCode): string[] {
  switch (classCode) {
    case 'A': return ['A_ACEi', 'A_ARB'];
    case 'B': return ['B'];
    case 'C': return ['C_DHP'];
    case 'D': return ['D'];
    case 'MRA': return ['MRA'];
    default: return [];
  }
}

export interface SafetyCheckResult {
  filteredRecommendation: DrugRecommendation | undefined;
  safetyAlerts: SafetyAlert[];
}

export function applyContraindications(
  drugRec: DrugRecommendation | undefined,
  patient: PatientContext,
  kb: KnowledgeBase,
  existingAlerts: SafetyAlert[],
  trace: RuleTrace[]
): DrugRecommendation | undefined {
  if (!drugRec) {
    trace.push(noRecTrace());
    return undefined;
  }

  const patientConditions = buildPatientConditions(patient);
  const alerts: SafetyAlert[] = [];
  const absolutelyContraindicated = new Set<DrugClassCode>();
  const relativelyContraindicated = new Set<DrugClassCode>();

  for (const classCode of drugRec.classCodes) {
    const kbKeys = getKBKeysForClass(classCode);
    if (kbKeys.length === 0) continue;

    // For multi-sub-class codes (e.g. A = ACEi + ARB), only remove the whole class if
    // ALL sub-classes have an absolute CI. If only one sub-class is CI'd, emit a warning
    // but keep the class (clinician can choose the safe sub-class).
    const kbEntriesPresent = kbKeys.filter(k => kb.contraindications.some(c => c.drugClass === k));
    let absoluteCISubCount = 0;

    for (const kbKey of kbKeys) {
      const entry = kb.contraindications.find(c => c.drugClass === kbKey);
      if (!entry) continue;

      const absoluteCondition = patientConditions.find(c => entry.absolute.includes(c));
      if (absoluteCondition) {
        absoluteCISubCount++;
        const isFullBlock = kbEntriesPresent.length <= 1; // single sub-class → full block
        alerts.push({
          severity: isFullBlock ? 'contraindication' : 'warning',
          drugClass: classCode,
          reason: isFullBlock
            ? `Class ${classCode} (${kbKey}): absolute contraindication — ${absoluteCondition}`
            : `Class ${classCode} (${kbKey}): absolutely contraindicated — ${absoluteCondition}. Use alternative sub-class if available.`,
          source: { reference: entry.source.reference, page: entry.source.page },
        });
        continue; // skip relative check for this sub-key if already absolutely CI'd
      }

      // Relative CI check (only if not absolutely CI'd for this sub-key)
      const relativeCondition = patientConditions.find(c => entry.relative.includes(c));
      if (relativeCondition && !relativelyContraindicated.has(classCode)) {
        relativelyContraindicated.add(classCode);
        alerts.push({
          severity: 'warning',
          drugClass: classCode,
          reason: `Class ${classCode} (${kbKey}): relative contraindication — ${relativeCondition}. Use with caution.`,
          source: { reference: entry.source.reference, page: entry.source.page },
        });
      }
    }

    // Remove the class only if every tracked sub-class entry has an absolute CI
    if (absoluteCISubCount > 0 && absoluteCISubCount >= kbEntriesPresent.length) {
      absolutelyContraindicated.add(classCode);
      // Upgrade warning alerts for this class to contraindication
      for (const a of alerts) {
        if (a.drugClass === classCode && a.severity === 'warning' && a.reason.includes('absolutely contraindicated')) {
          a.severity = 'contraindication';
        }
      }
    }
  }

  existingAlerts.push(...alerts);

  const safeCodes = drugRec.classCodes.filter(c => !absolutelyContraindicated.has(c));
  const safePreferred = drugRec.preferredCombination
    ?.map(combo => combo.filter(c => !absolutelyContraindicated.has(c)))
    .filter(combo => combo.length > 0);

  trace.push({
    ruleId: 'safety_check',
    ruleDescription: 'Apply contraindication filters per Bảng 11',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 11', page: 23, verbatimQuote: 'Bảng 11. Chống chỉ định của các nhóm thuốc điều trị tăng huyết áp chính' },
    inputs: {
      originalClasses: drugRec.classCodes,
      patientConditions,
      absolutelyContraindicated: Array.from(absolutelyContraindicated),
      relativelyContraindicated: Array.from(relativelyContraindicated),
    },
    output: {
      safeCodes,
      removedCodes: drugRec.classCodes.filter((c: DrugClassCode) => !safeCodes.includes(c)),
      alertCount: alerts.length
    },
    reasoning: alerts.length === 0
      ? 'No contraindications detected'
      : `Removed absolute CI: [${Array.from(absolutelyContraindicated).join(', ')}]; warnings for: [${Array.from(relativelyContraindicated).join(', ')}]`,
  });

  if (safeCodes.length === 0) return undefined;

  return {
    ...drugRec,
    classCodes: safeCodes,
    preferredCombination: safePreferred && safePreferred.length > 0 ? safePreferred : undefined,
  };
}

function noRecTrace(): RuleTrace {
  return {
    ruleId: 'safety_check',
    ruleDescription: 'Apply contraindication filters per Bảng 11',
    source: { document: 'VSH/VNHA 2022', reference: 'Bảng 11', page: 23, verbatimQuote: 'Bảng 11. Chống chỉ định của các nhóm thuốc điều trị tăng huyết áp chính' },
    inputs: {},
    output: 'no_recommendation',
    reasoning: 'No drug recommendation to check',
  };
}
