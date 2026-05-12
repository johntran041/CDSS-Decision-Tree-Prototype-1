import type { PatientContext, RuleTrace } from '../types.js';

export function selectPathway(
  patient: PatientContext,
  trace: RuleTrace[]
): 'essential' | 'optimal' {
  const mode = patient.siteConfig.pathwayMode;
  trace.push({
    ruleId: 'select_pathway',
    ruleDescription: 'Select treatment pathway based on site configuration',
    source: { document: 'VSH/VNHA 2022', reference: 'Hình 3 / Hình 4', page: 17, verbatimQuote: 'Hình 3 (Thiết yếu) / Hình 4 (Tối ưu): Sơ đồ điều trị tăng huyết áp VSH/VNHA 2022' },
    inputs: { pathwayMode: mode },
    output: mode,
    reasoning: `Site configured for ${mode} pathway`,
  });
  return mode;
}
