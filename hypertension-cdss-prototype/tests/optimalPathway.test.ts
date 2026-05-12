import { describe, it, expect } from 'vitest';
import { runOptimalPathway } from '../src/engine/optimalPathway.js';
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
    siteConfig: { pathwayMode: 'optimal' },
    ...overrides,
  };
}

describe('runOptimalPathway', () => {
  it('HABTC + low risk + no lifestyle → LIFESTYLE_ONLY', () => {
    const result = runOptimalPathway(makePatient({ sex: 'female', officeSBP: 135, officeDBP: 87 }), 'high_normal', 'low', 'none', kb, []);
    expect(result.status).toBe('LIFESTYLE_ONLY');
    expect(result.drugRecommendation).toBeUndefined();
  });

  it('HABTC + low risk + 3 months lifestyle → PRESCRIBE monotherapy SPC', () => {
    const result = runOptimalPathway(
      makePatient({ sex: 'female', officeSBP: 135, officeDBP: 87, monthsOnLifestyleChange: 3 }),
      'high_normal', 'low', 'none', kb, []
    );
    expect(result.status).toBe('PRESCRIBE');
    expect(result.stepId).toBe('h4_r3_monotherapy');
    expect(result.drugRecommendation?.pillForm).toBe('single_pill');
  });

  it('grade_1 + no comorbidity → single-pill dual SPC', () => {
    const result = runOptimalPathway(makePatient(), 'grade_1', 'low', 'none', kb, []);
    expect(result.status).toBe('PRESCRIBE');
    expect(result.stepId).toBe('h4_r4_spc_dual');
    expect(result.drugRecommendation?.pillForm).toBe('single_pill');
  });

  it('grade_2 → usual dose dual SPC', () => {
    const result = runOptimalPathway(makePatient({ officeSBP: 165, officeDBP: 105 }), 'grade_2', 'high', 'none', kb, []);
    expect(result.drugRecommendation?.doseLevel).toBe('usual');
  });

  it('age ≥80 → single-pill monotherapy', () => {
    const result = runOptimalPathway(makePatient({ ageYears: 82 }), 'grade_1', 'intermediate', 'none', kb, []);
    expect(result.stepId).toBe('h4_r3_monotherapy');
  });

  it('compelling indication: HFrEF → A+B+SGLT2i+MRA', () => {
    const result = runOptimalPathway(
      makePatient({ hasHeartFailure: true, hfrefEjectionFraction: 30 }),
      'grade_1', 'high', 'heart_failure_reduced_ef', kb, []
    );
    expect(result.stepId).toBe('h4_r7_compelling');
    expect(result.drugRecommendation?.classCodes).toEqual(
      expect.arrayContaining(['A', 'B', 'SGLT2i', 'MRA'])
    );
  });

  it('compelling indication: post-stroke → A+D', () => {
    const result = runOptimalPathway(
      makePatient({ hasPostStroke: true }),
      'grade_1', 'high', 'post_stroke', kb, []
    );
    expect(result.drugRecommendation?.classCodes).toEqual(expect.arrayContaining(['A', 'D']));
  });

  it('compelling indication: T2D → A+C or A+D with SGLT2i note', () => {
    const result = runOptimalPathway(
      makePatient({ hasDiabetesType2: true }),
      'grade_1', 'high', 'type2_diabetes_high_risk', kb, []
    );
    expect(result.guidanceMessages.some(m => m.includes('SGLT2i'))).toBe(true);
  });

  it('on mono not at target → escalate to dual SPC', () => {
    const result = runOptimalPathway(makePatient({
      currentMedications: [{ classCode: 'A', drugName: 'Ramipril', doseLevel: 'usual' }],
      monthsOnCurrentRegimen: 1,
      bpAtTargetCurrentRegimen: false,
    }), 'high_normal', 'low', 'none', kb, []);
    expect(result.stepId).toBe('h4_r4_spc_dual');
  });

  it('resistant: add MRA when eGFR ok and K ok', () => {
    const result = runOptimalPathway(makePatient({
      egfrMlMin: 55,
      potassiumMmolL: 4.0,
      currentMedications: [
        { classCode: 'A', drugName: 'P', doseLevel: 'usual' },
        { classCode: 'C', drugName: 'A', doseLevel: 'usual' },
        { classCode: 'D', drugName: 'I', doseLevel: 'usual' },
      ],
      monthsOnCurrentRegimen: 2,
      bpAtTargetCurrentRegimen: false,
    }), 'grade_1', 'low', 'none', kb, []);
    expect(result.stepId).toBe('h4_r6_resistant');
    expect(result.drugRecommendation?.classCodes).toContain('MRA');
  });

  it('resistant: MRA caution when eGFR <45 → alternative', () => {
    const result = runOptimalPathway(makePatient({
      egfrMlMin: 40,
      potassiumMmolL: 4.0,
      currentMedications: [
        { classCode: 'A', drugName: 'P', doseLevel: 'usual' },
        { classCode: 'C', drugName: 'A', doseLevel: 'usual' },
        { classCode: 'D', drugName: 'I', doseLevel: 'usual' },
      ],
      monthsOnCurrentRegimen: 2,
      bpAtTargetCurrentRegimen: false,
    }), 'grade_1', 'low', 'none', kb, []);
    expect(result.stepId).toBe('h4_r6_resistant');
    expect(result.drugRecommendation?.classCodes).not.toContain('MRA');
    expect(result.drugRecommendation?.classCodes).toContain('alpha');
  });

  it('trace contains h4_ rule ids', () => {
    const trace: RuleTrace[] = [];
    runOptimalPathway(makePatient(), 'grade_1', 'low', 'none', kb, trace);
    expect(trace.some(t => t.ruleId.startsWith('h4_'))).toBe(true);
  });

  it('evaluation weeks 2 for resistant, 4 for normal prescribe', () => {
    const normal = runOptimalPathway(makePatient(), 'grade_1', 'low', 'none', kb, []);
    expect(normal.nextEvaluationWeeks).toBe(4);

    const resistant = runOptimalPathway(makePatient({
      egfrMlMin: 55, potassiumMmolL: 4.0,
      currentMedications: [
        { classCode: 'A', drugName: 'P', doseLevel: 'usual' },
        { classCode: 'C', drugName: 'A', doseLevel: 'usual' },
        { classCode: 'D', drugName: 'I', doseLevel: 'usual' },
      ],
      monthsOnCurrentRegimen: 2,
      bpAtTargetCurrentRegimen: false,
    }), 'grade_1', 'low', 'none', kb, []);
    expect(resistant.nextEvaluationWeeks).toBe(2);
  });
});
