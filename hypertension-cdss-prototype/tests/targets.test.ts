import { describe, it, expect } from 'vitest';
import { computeTarget } from '../src/engine/targets.js';
import { loadKnowledgeBase } from '../src/knowledgeBase.js';
import type { PatientContext, RuleTrace } from '../src/types.js';

const kb = loadKnowledgeBase();

function makePatient(overrides: Partial<PatientContext> = {}): PatientContext {
  return {
    patientId: 'TEST',
    ageYears: 50,
    sex: 'male',
    officeSBP: 145,
    officeDBP: 90,
    siteConfig: { pathwayMode: 'essential' },
    ...overrides,
  };
}

describe('computeTarget', () => {
  it('18-69 no comorbidity: SBP 120-<130, DBP <80', () => {
    const trace: RuleTrace[] = [];
    const result = computeTarget(makePatient(), kb, trace);
    expect(result.sbpMin).toBe(120);
    expect(result.sbpMax).toBe(130);
    expect(result.dbpMax).toBe(80);
    expect(trace[0].ruleId).toBe('compute_target');
  });

  it('>=70 no comorbidity: SBP 130-<140, DBP <80', () => {
    const result = computeTarget(makePatient({ ageYears: 72 }), kb, []);
    expect(result.sbpMin).toBe(130);
    expect(result.sbpMax).toBe(140);
    expect(result.dbpMax).toBe(80);
  });

  it('T2D + CAD age >65: DBP target 79 (70-79 range)', () => {
    const result = computeTarget(makePatient({
      ageYears: 68,
      hasDiabetesType2: true,
      hasCAD: true,
    }), kb, []);
    expect(result.dbpMax).toBe(79);
  });

  it('T2D alone age >65: DBP target 79', () => {
    const result = computeTarget(makePatient({ ageYears: 66, hasDiabetesType2: true }), kb, []);
    expect(result.dbpMax).toBe(79);
  });

  it('T2D age ≤65 (exactly 65): normal DBP target', () => {
    const result = computeTarget(makePatient({ ageYears: 65, hasDiabetesType2: true }), kb, []);
    expect(result.dbpMax).toBe(80);
  });

  it('includes trace source', () => {
    const trace: RuleTrace[] = [];
    computeTarget(makePatient(), kb, trace);
    expect(trace[0].source.reference).toBe('Bảng 7');
    expect(trace[0].source.page).toBe(16);
  });

  it('reasoning contains age group', () => {
    const result = computeTarget(makePatient({ ageYears: 75 }), kb, []);
    expect(result.reasoning).toContain('>=70');
  });
});
