import { describe, it, expect } from 'vitest';
import { detectCompellingIndication } from '../src/engine/compellingIndication.js';
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

describe('detectCompellingIndication', () => {
  it('returns none for patient with no comorbidities', () => {
    const trace: RuleTrace[] = [];
    expect(detectCompellingIndication(makePatient(), kb, trace)).toBe('none');
    expect(trace[0].ruleId).toBe('detect_compelling_indication');
  });

  it('detects heart_failure_reduced_ef (EF <40)', () => {
    expect(detectCompellingIndication(makePatient({ hasHeartFailure: true, hfrefEjectionFraction: 35 }), kb, [])).toBe('heart_failure_reduced_ef');
  });

  it('detects heart_failure_preserved_ef when HF but no EF specified', () => {
    expect(detectCompellingIndication(makePatient({ hasHeartFailure: true }), kb, [])).toBe('heart_failure_preserved_ef');
  });

  it('detects post_myocardial_infarction over CAD (priority)', () => {
    expect(detectCompellingIndication(makePatient({ hasPostMI: true, hasCAD: true }), kb, [])).toBe('post_myocardial_infarction');
  });

  it('detects coronary_artery_disease', () => {
    expect(detectCompellingIndication(makePatient({ hasCAD: true }), kb, [])).toBe('coronary_artery_disease');
  });

  it('detects post_stroke', () => {
    expect(detectCompellingIndication(makePatient({ hasPostStroke: true }), kb, [])).toBe('post_stroke');
  });

  it('detects chronic_kidney_disease', () => {
    expect(detectCompellingIndication(makePatient({ ckdStage: 'stage_3' }), kb, [])).toBe('chronic_kidney_disease');
  });

  it('detects type2_diabetes_high_risk', () => {
    expect(detectCompellingIndication(makePatient({ hasDiabetesType2: true }), kb, [])).toBe('type2_diabetes_high_risk');
  });

  it('detects atrial_fibrillation', () => {
    expect(detectCompellingIndication(makePatient({ hasAtrialFibrillation: true }), kb, [])).toBe('atrial_fibrillation');
  });

  it('detects left_ventricular_hypertrophy', () => {
    expect(detectCompellingIndication(makePatient({ hasLVH: true }), kb, [])).toBe('left_ventricular_hypertrophy');
  });

  it('HFrEF has priority over post_MI', () => {
    expect(detectCompellingIndication(makePatient({ hasHeartFailure: true, hfrefEjectionFraction: 30, hasPostMI: true }), kb, [])).toBe('heart_failure_reduced_ef');
  });

  it('populates trace with source page 30', () => {
    const trace: RuleTrace[] = [];
    detectCompellingIndication(makePatient(), kb, trace);
    expect(trace[0].source.page).toBe(30);
  });
});
