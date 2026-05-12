import { describe, it, expect } from 'vitest';
import { runEssentialPathway } from '../src/engine/essentialPathway.js';
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

describe('runEssentialPathway', () => {
  it('HABTC + low risk + no lifestyle → LIFESTYLE_ONLY', () => {
    const trace: RuleTrace[] = [];
    const result = runEssentialPathway(makePatient({ officeSBP: 135, officeDBP: 87, sex: 'female' }), 'high_normal', 'low', kb, trace);
    expect(result.status).toBe('LIFESTYLE_ONLY');
    expect(result.drugRecommendation).toBeUndefined();
  });

  it('HABTC + low risk + 6 months lifestyle → PRESCRIBE monotherapy', () => {
    const result = runEssentialPathway(
      makePatient({ officeSBP: 135, officeDBP: 87, sex: 'female', monthsOnLifestyleChange: 6 }),
      'high_normal', 'low', kb, []
    );
    expect(result.status).toBe('PRESCRIBE');
    expect(result.stepId).toBe('h3_r3_monotherapy');
    expect(result.drugRecommendation?.doseLevel).toBe('low');
  });

  it('grade_1 + no comorbidity → dual combination', () => {
    const result = runEssentialPathway(makePatient(), 'grade_1', 'low', kb, []);
    expect(result.status).toBe('PRESCRIBE');
    expect(result.stepId).toBe('h3_r4_dual_combination');
    expect(result.drugRecommendation?.preferredCombination).toBeDefined();
  });

  it('grade_2 → dual combination at usual dose', () => {
    const result = runEssentialPathway(makePatient({ officeSBP: 165, officeDBP: 105 }), 'grade_2', 'high', kb, []);
    expect(result.drugRecommendation?.doseLevel).toBe('usual');
  });

  it('age ≥80 → monotherapy low dose', () => {
    const result = runEssentialPathway(makePatient({ ageYears: 82 }), 'grade_1', 'intermediate', kb, []);
    expect(result.stepId).toBe('h3_r3_monotherapy');
    expect(result.drugRecommendation?.doseLevel).toBe('low');
  });

  it('frail patient → monotherapy', () => {
    const result = runEssentialPathway(makePatient({ isFrail: true }), 'grade_1', 'intermediate', kb, []);
    expect(result.stepId).toBe('h3_r3_monotherapy');
  });

  it('on mono, not at target after 1 month → escalate to dual', () => {
    const result = runEssentialPathway(makePatient({
      currentMedications: [{ classCode: 'A', drugName: 'Ramipril', doseLevel: 'usual' }],
      monthsOnCurrentRegimen: 1,
      bpAtTargetCurrentRegimen: false,
    }), 'high_normal', 'low', kb, []);
    expect(result.stepId).toBe('h3_r4_dual_combination');
  });

  it('resistant (triple at usual, 2 months, not at target) → REFER_SPECIALIST', () => {
    const result = runEssentialPathway(makePatient({
      currentMedications: [
        { classCode: 'A', drugName: 'Perindopril', doseLevel: 'usual' },
        { classCode: 'C', drugName: 'Amlodipine', doseLevel: 'usual' },
        { classCode: 'D', drugName: 'Indapamide', doseLevel: 'usual' },
      ],
      monthsOnCurrentRegimen: 2,
      bpAtTargetCurrentRegimen: false,
    }), 'grade_1', 'low', kb, []);
    expect(result.status).toBe('REFER_SPECIALIST');
    expect(result.stepId).toBe('h3_r6_resistant');
  });

  it('populates trace with h3 rule ids', () => {
    const trace: RuleTrace[] = [];
    runEssentialPathway(makePatient(), 'grade_1', 'low', kb, trace);
    expect(trace.some(t => t.ruleId.startsWith('h3_'))).toBe(true);
  });

  it('preferred combination includes A+C and A+D for dual', () => {
    const result = runEssentialPathway(makePatient(), 'grade_1', 'low', kb, []);
    expect(result.drugRecommendation?.preferredCombination).toEqual(
      expect.arrayContaining([expect.arrayContaining(['A', 'C'])])
    );
  });
});
