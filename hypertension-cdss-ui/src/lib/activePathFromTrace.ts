import type { Recommendation, CompellingIndication } from './types.js';

export function computeActiveNodeIds(rec: Recommendation): Set<string> {
  const active = new Set<string>();
  const prefix = rec.pathwayUsed === 'essential' ? 'h3_' : 'h4_';

  active.add(`${prefix}start`);
  active.add(`${prefix}assess`);

  for (const t of rec.trace) {
    if (!t.ruleId.startsWith('h3_') && !t.ruleId.startsWith('h4_')) continue;

    if (t.ruleId.endsWith('_r3_monotherapy')) {
      active.add(`${prefix}mono`);
      active.add(`${prefix}branch_low`);
    } else if (t.ruleId.endsWith('_r4_dual_combination') || t.ruleId.endsWith('_r4_spc_dual')) {
      active.add(`${prefix}dual`);
      active.add(`${prefix}branch_high`);
    } else if (t.ruleId.endsWith('_r5_triple_combination') || t.ruleId.endsWith('_r5_spc_triple')) {
      active.add(`${prefix}dual`);
      active.add(`${prefix}triple`);
      active.add(`${prefix}branch_high`);
    } else if (t.ruleId.endsWith('_r6_resistant')) {
      if (rec.pathwayUsed === 'essential') {
        active.add('h3_dual');
        active.add('h3_triple');
        active.add('h3_resistant');
        active.add('h3_refer');
      } else {
        active.add('h4_dual');
        active.add('h4_triple');
        active.add('h4_resistant');
      }
    } else if (t.ruleId.endsWith('_r7_compelling')) {
      active.add('h4_branch_compelling');
      active.add('h4_compelling');
      const compellingTrace = rec.trace.find(x => x.ruleId === 'detect_compelling_indication');
      const output = compellingTrace?.output as CompellingIndication | undefined;
      if (output === 'coronary_artery_disease' || output === 'post_myocardial_infarction') active.add('h4_compelling_cad');
      else if (output === 'heart_failure_reduced_ef' || output === 'heart_failure_preserved_ef') active.add('h4_compelling_hfref');
      else if (output === 'post_stroke') active.add('h4_compelling_stroke');
      else if (output === 'chronic_kidney_disease') active.add('h4_compelling_ckd');
      else if (output === 'type2_diabetes_high_risk') active.add('h4_compelling_t2d');
      else active.add('h4_compelling');
    }
  }

  return active;
}

export function getCurrentStepNodeId(rec: Recommendation): string | null {
  if (!rec.currentStep) return null;
  const prefix = rec.pathwayUsed === 'essential' ? 'h3_' : 'h4_';
  switch (rec.currentStep) {
    case 'h3_r3_monotherapy':
    case 'h4_r3_monotherapy': return `${prefix}mono`;
    case 'h3_r4_dual_combination':
    case 'h4_r4_spc_dual': return `${prefix}dual`;
    case 'h3_r5_triple_combination':
    case 'h4_r5_spc_triple': return `${prefix}triple`;
    case 'h3_r6_resistant': return 'h3_refer';
    case 'h4_r6_resistant': return 'h4_resistant';
    case 'h4_r7_compelling': {
      const t = rec.trace.find(x => x.ruleId === 'detect_compelling_indication');
      const o = t?.output as CompellingIndication | undefined;
      if (o === 'coronary_artery_disease' || o === 'post_myocardial_infarction') return 'h4_compelling_cad';
      if (o === 'heart_failure_reduced_ef' || o === 'heart_failure_preserved_ef') return 'h4_compelling_hfref';
      if (o === 'post_stroke') return 'h4_compelling_stroke';
      if (o === 'chronic_kidney_disease') return 'h4_compelling_ckd';
      if (o === 'type2_diabetes_high_risk') return 'h4_compelling_t2d';
      return 'h4_compelling';
    }
    default: return null;
  }
}
