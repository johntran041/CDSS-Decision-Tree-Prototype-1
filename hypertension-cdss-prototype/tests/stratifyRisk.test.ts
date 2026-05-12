import { describe, it, expect } from 'vitest';
import { stratifyRisk, computeRiskTier, countRiskFactors } from '../src/engine/stratifyRisk.js';
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

describe('countRiskFactors', () => {
  it('returns 0 for baseline patient', () => {
    expect(countRiskFactors(makePatient({ sex: 'female', ageYears: 50 }))).toBe(0);
  });

  it('counts male sex as risk factor', () => {
    expect(countRiskFactors(makePatient({ sex: 'male' }))).toBe(1);
  });

  it('counts age >65', () => {
    expect(countRiskFactors(makePatient({ ageYears: 66, sex: 'female' }))).toBe(1);
  });

  it('counts HR >80', () => {
    expect(countRiskFactors(makePatient({ heartRateBpm: 85, sex: 'female' }))).toBe(1);
  });

  it('counts multiple risk factors', () => {
    const n = countRiskFactors(makePatient({
      sex: 'male', isOverweight: true, isSmoker: true,
    }));
    expect(n).toBe(3);
  });
});

describe('computeRiskTier', () => {
  it('returns tier0 for patient with no risk factors', () => {
    expect(computeRiskTier(makePatient({ sex: 'female' }))).toBe('tier0');
  });

  it('returns tier1_2 for 1-2 risk factors', () => {
    expect(computeRiskTier(makePatient({ sex: 'male' }))).toBe('tier1_2');
  });

  it('returns tier3plus for diabetes', () => {
    expect(computeRiskTier(makePatient({ hasDiabetesType2: true, sex: 'female' }))).toBe('tier3plus');
  });

  it('returns tier3plus for CKD stage 3', () => {
    expect(computeRiskTier(makePatient({ ckdStage: 'stage_3', sex: 'female' }))).toBe('tier3plus');
  });

  it('returns tier3plus for ≥3 risk factors', () => {
    expect(computeRiskTier(makePatient({
      sex: 'male', isOverweight: true, isSmoker: true, hasFamilyHistoryCVD: true,
    }))).toBe('tier3plus');
  });

  it('returns tier3plus for ASCVD', () => {
    expect(computeRiskTier(makePatient({ hasASCVD: true, sex: 'female' }))).toBe('tier3plus');
  });
});

describe('stratifyRisk', () => {
  it('low risk: 0 RF + high_normal', () => {
    const trace: RuleTrace[] = [];
    expect(stratifyRisk(makePatient({ sex: 'female' }), 'high_normal', kb, trace)).toBe('low');
    expect(trace[0].ruleId).toBe('stratify_risk');
  });

  it('low risk: 0 RF + grade_1', () => {
    expect(stratifyRisk(makePatient({ sex: 'female' }), 'grade_1', kb, [])).toBe('low');
  });

  it('intermediate risk: 0 RF + grade_2', () => {
    expect(stratifyRisk(makePatient({ sex: 'female' }), 'grade_2', kb, [])).toBe('intermediate');
  });

  it('intermediate risk: 1 RF + grade_1', () => {
    expect(stratifyRisk(makePatient({ sex: 'male' }), 'grade_1', kb, [])).toBe('intermediate');
  });

  it('high risk: 1 RF + grade_2', () => {
    expect(stratifyRisk(makePatient({ sex: 'male' }), 'grade_2', kb, [])).toBe('high');
  });

  it('high risk: T2D regardless of BP category', () => {
    expect(stratifyRisk(makePatient({ hasDiabetesType2: true, sex: 'female' }), 'high_normal', kb, [])).toBe('high');
  });

  it('high risk: CKD stage 3', () => {
    expect(stratifyRisk(makePatient({ ckdStage: 'stage_3', sex: 'female' }), 'high_normal', kb, [])).toBe('high');
  });

  it('populates trace reasoning', () => {
    const trace: RuleTrace[] = [];
    stratifyRisk(makePatient({ hasDiabetesType2: true, sex: 'female' }), 'grade_1', kb, trace);
    expect(trace[0].reasoning).toContain('T2D');
  });

  it('normal BP returns low risk', () => {
    expect(stratifyRisk(makePatient({ sex: 'female' }), 'normal', kb, [])).toBe('low');
  });
});
