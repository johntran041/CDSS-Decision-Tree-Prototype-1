import { describe, it, expect } from 'vitest';
import { classifyBP } from '../src/engine/classify.js';
import { loadKnowledgeBase } from '../src/knowledgeBase.js';
import type { PatientContext, RuleTrace } from '../src/types.js';

const kb = loadKnowledgeBase();

function makePatient(sbp: number, dbp: number): PatientContext {
  return {
    patientId: 'TEST',
    ageYears: 50,
    sex: 'male',
    officeSBP: sbp,
    officeDBP: dbp,
    siteConfig: { pathwayMode: 'essential' },
  };
}

describe('classifyBP', () => {
  it('classifies normal BP (<130/<85)', () => {
    const trace: RuleTrace[] = [];
    expect(classifyBP(makePatient(125, 80), kb, trace)).toBe('normal');
    expect(trace[0].ruleId).toBe('classify_bp');
  });

  it('classifies high_normal (130-139 / 85-89)', () => {
    expect(classifyBP(makePatient(135, 87), kb, [])).toBe('high_normal');
  });

  it('classifies high_normal when only SBP in range', () => {
    expect(classifyBP(makePatient(132, 80), kb, [])).toBe('high_normal');
  });

  it('classifies high_normal when only DBP in range', () => {
    expect(classifyBP(makePatient(128, 86), kb, [])).toBe('high_normal');
  });

  it('classifies grade_1 (140-159 / 90-99)', () => {
    expect(classifyBP(makePatient(145, 95), kb, [])).toBe('grade_1');
  });

  it('classifies grade_1 when only SBP elevated (no isolated systolic because DBP ≥90)', () => {
    expect(classifyBP(makePatient(150, 92), kb, [])).toBe('grade_1');
  });

  it('classifies grade_2 (≥160 / ≥100)', () => {
    expect(classifyBP(makePatient(165, 105), kb, [])).toBe('grade_2');
  });

  it('classifies grade_2 when only SBP ≥160', () => {
    expect(classifyBP(makePatient(162, 88), kb, [])).toBe('grade_2');
  });

  it('classifies grade_2 when only DBP ≥100', () => {
    expect(classifyBP(makePatient(145, 102), kb, [])).toBe('grade_2');
  });

  it('classifies isolated_systolic (SBP ≥140 AND DBP <90)', () => {
    expect(classifyBP(makePatient(142, 88), kb, [])).toBe('isolated_systolic');
  });

  it('classifies hypertensive_crisis (SBP ≥180 OR DBP ≥120)', () => {
    expect(classifyBP(makePatient(185, 120), kb, [])).toBe('hypertensive_crisis');
  });

  it('classifies hypertensive_crisis on DBP alone ≥120', () => {
    expect(classifyBP(makePatient(170, 122), kb, [])).toBe('hypertensive_crisis');
  });

  it('populates trace with source reference', () => {
    const trace: RuleTrace[] = [];
    classifyBP(makePatient(135, 87), kb, trace);
    expect(trace[0].source.reference).toBe('Bảng 1');
    expect(trace[0].source.page).toBe(7);
    expect(trace[0].source.document).toBe('VSH/VNHA 2022');
  });

  it('populates trace inputs with sbp and dbp', () => {
    const trace: RuleTrace[] = [];
    classifyBP(makePatient(145, 90), kb, trace);
    expect(trace[0].inputs['officeSBP']).toBe(145);
    expect(trace[0].inputs['officeDBP']).toBe(90);
  });
});
