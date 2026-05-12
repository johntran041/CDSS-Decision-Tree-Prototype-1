import { describe, it, expect } from 'vitest';
import { computeThreshold, detectComorbidity, getAgeGroup } from '../src/engine/thresholds.js';
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

describe('getAgeGroup', () => {
  it('returns 18-69 for age 50', () => expect(getAgeGroup(50)).toBe('18-69'));
  it('returns 70-79 for age 75', () => expect(getAgeGroup(75)).toBe('70-79'));
  it('returns >=80 for age 82', () => expect(getAgeGroup(82)).toBe('>=80'));
  it('returns >=80 for age 80 exactly', () => expect(getAgeGroup(80)).toBe('>=80'));
  it('returns 70-79 for age 70 exactly', () => expect(getAgeGroup(70)).toBe('70-79'));
});

describe('detectComorbidity', () => {
  it('false when no comorbidities', () => {
    expect(detectComorbidity(makePatient())).toBe(false);
  });

  it('true for T2D', () => {
    expect(detectComorbidity(makePatient({ hasDiabetesType2: true }))).toBe(true);
  });

  it('true for CAD', () => {
    expect(detectComorbidity(makePatient({ hasCAD: true }))).toBe(true);
  });

  it('true for CKD (any stage except none)', () => {
    expect(detectComorbidity(makePatient({ ckdStage: 'stage_1' }))).toBe(true);
  });

  it('false for CKD none', () => {
    expect(detectComorbidity(makePatient({ ckdStage: 'none' }))).toBe(false);
  });
});

describe('computeThreshold', () => {
  it('140/90 for 18-69, no comorbidity', () => {
    const trace: RuleTrace[] = [];
    const result = computeThreshold(makePatient(), kb, trace);
    expect(result.sbp).toBe(140);
    expect(result.dbp).toBe(90);
    expect(trace[0].ruleId).toBe('compute_threshold');
  });

  it('130/85 for 18-69 with T2D', () => {
    const result = computeThreshold(makePatient({ hasDiabetesType2: true }), kb, []);
    expect(result.sbp).toBe(130);
    expect(result.dbp).toBe(85);
  });

  it('140/90 for 70-79, no comorbidity', () => {
    const result = computeThreshold(makePatient({ ageYears: 75 }), kb, []);
    expect(result.sbp).toBe(140);
    expect(result.dbp).toBe(90);
  });

  it('140/90 for 70-79 with comorbidity', () => {
    const result = computeThreshold(makePatient({ ageYears: 75, hasDiabetesType2: true }), kb, []);
    expect(result.sbp).toBe(140);
    expect(result.dbp).toBe(90);
  });

  it('160/90 for >=80, no comorbidity', () => {
    const result = computeThreshold(makePatient({ ageYears: 82 }), kb, []);
    expect(result.sbp).toBe(160);
    expect(result.dbp).toBe(90);
  });

  it('includes source reference in trace', () => {
    const trace: RuleTrace[] = [];
    computeThreshold(makePatient(), kb, trace);
    expect(trace[0].source.reference).toBe('Bảng 6');
    expect(trace[0].source.page).toBe(15);
  });

  it('reasoning mentions comorbidity when present', () => {
    const result = computeThreshold(makePatient({ hasDiabetesType2: true }), kb, []);
    expect(result.reasoning).toContain('T2D');
  });
});
