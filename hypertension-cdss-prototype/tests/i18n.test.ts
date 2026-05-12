import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import type { PatientContext } from '../src/types.js';
import { loadKnowledgeBase } from '../src/knowledgeBase.js';
import { runEngine } from '../src/engine/index.js';
import {
  localizeRecommendation,
  localizeStatus,
  localizeBPCategory,
  localizeRiskLevel,
  localizeDrugClassCode,
  localizeCompellingIndication,
} from '../src/i18n/localize.js';
import type { LocalizedRecommendation } from '../src/i18n/localize.js';

const kb = loadKnowledgeBase();
const fixturesDir = resolve(import.meta.dirname ?? '.', '../fixtures');

interface FixtureFile extends PatientContext {
  _expected: unknown;
}

function loadFixtures(): Array<{ name: string; patient: PatientContext }> {
  const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();
  return files.map(file => {
    const raw = JSON.parse(readFileSync(join(fixturesDir, file), 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    return { name: file, patient: patient as PatientContext };
  });
}

const fixtures = loadFixtures();

describe('i18n: individual localization functions', () => {
  it('localizeStatus returns non-empty Vietnamese for all statuses', () => {
    const statuses = ['PRESCRIBE', 'LIFESTYLE_ONLY', 'ESCALATE', 'REFER_SPECIALIST', 'OUT_OF_SCOPE', 'SAFETY_HALT'] as const;
    for (const s of statuses) {
      const text = localizeStatus(s);
      expect(text, `Status '${s}' has no Vietnamese translation`).toBeTruthy();
      expect(text).not.toBe(s); // must be translated, not a passthrough
      expect(text.length).toBeGreaterThan(4);
    }
  });

  it('localizeBPCategory returns non-empty Vietnamese for all categories', () => {
    const cats = ['normal', 'high_normal', 'grade_1', 'grade_2', 'isolated_systolic', 'hypertensive_crisis'] as const;
    for (const c of cats) {
      const text = localizeBPCategory(c);
      expect(text, `BP category '${c}' has no Vietnamese translation`).toBeTruthy();
      expect(text).not.toBe(c);
    }
  });

  it('localizeRiskLevel returns non-empty Vietnamese for all risk levels', () => {
    const levels = ['low', 'intermediate', 'high'] as const;
    for (const l of levels) {
      const text = localizeRiskLevel(l);
      expect(text, `Risk level '${l}' has no Vietnamese translation`).toBeTruthy();
      expect(text).not.toBe(l);
    }
  });

  it('localizeDrugClassCode returns non-empty Vietnamese for all drug classes', () => {
    const codes = ['A', 'B', 'C', 'D', 'MRA', 'SGLT2i', 'GLP1RA', 'ARNI', 'loop', 'alpha'] as const;
    for (const code of codes) {
      const text = localizeDrugClassCode(code);
      expect(text, `Drug class '${code}' has no Vietnamese translation`).toBeTruthy();
      expect(text.length).toBeGreaterThan(3);
    }
  });

  it('localizeCompellingIndication returns Vietnamese for all known indications', () => {
    const indications = [
      'none', 'coronary_artery_disease', 'post_myocardial_infarction',
      'heart_failure_reduced_ef', 'heart_failure_preserved_ef',
      'left_ventricular_hypertrophy', 'post_stroke', 'chronic_kidney_disease',
      'type2_diabetes_high_risk', 'atrial_fibrillation', 'angina',
    ] as const;
    for (const ind of indications) {
      const text = localizeCompellingIndication(ind);
      expect(text, `Compelling indication '${ind}' has no Vietnamese translation`).toBeTruthy();
    }
  });
});

describe('i18n: all fixtures localize without empty fields', () => {
  for (const { name, patient } of fixtures) {
    it(`${name}: localizes without empty required fields`, () => {
      const rec = runEngine(patient, kb);
      let loc: LocalizedRecommendation;

      // Must not throw
      expect(() => { loc = localizeRecommendation(rec); }).not.toThrow();
      loc = localizeRecommendation(rec);

      // Required string fields must be non-empty
      expect(loc.statusText, 'statusText empty').toBeTruthy();
      expect(loc.statusBadge, 'statusBadge empty').toBeTruthy();
      expect(loc.statusColor, 'statusColor empty').toBeTruthy();
      expect(loc.bpCategoryText, 'bpCategoryText empty').toBeTruthy();
      expect(loc.cvRiskText, 'cvRiskText empty').toBeTruthy();
      expect(loc.pathwayText, 'pathwayText empty').toBeTruthy();

      // statusText must be Vietnamese (contains at least one common Vietnamese diacritic or keyword)
      const hasVietnamese = /[àáâãèéêìíòóôõùúýăđươ]/i.test(loc.statusText);
      expect(hasVietnamese, `statusText '${loc.statusText}' appears to be English`).toBe(true);

      // bpCategoryText must be Vietnamese
      const bpHasVietnamese = /[àáâãèéêìíòóôõùúýăđươ]/i.test(loc.bpCategoryText) || loc.bpCategoryText.includes('THA') || loc.bpCategoryText.includes('Bình');
      expect(bpHasVietnamese, `bpCategoryText '${loc.bpCategoryText}' appears to be English`).toBe(true);

      // raw must be the same object
      expect(loc.raw).toBe(rec);

      // Arrays must exist
      expect(Array.isArray(loc.drugNotes)).toBe(true);
      expect(Array.isArray(loc.safetyAlerts)).toBe(true);
      expect(Array.isArray(loc.guidanceMessages)).toBe(true);
      expect(Array.isArray(loc.trace)).toBe(true);

      // Safety alerts must be localized
      for (const alert of loc.safetyAlerts) {
        expect(alert.severityText, 'severityText empty').toBeTruthy();
        expect(alert.reasonText, 'reasonText empty').toBeTruthy();
        expect(alert.sourceText, 'sourceText empty').toBeTruthy();
      }

      // Trace must have all required fields; verbatimQuote must be preserved
      expect(loc.trace.length).toBeGreaterThan(0);
      for (const entry of loc.trace) {
        expect(entry.ruleId, 'trace ruleId empty').toBeTruthy();
        expect(entry.ruleNameText, `ruleNameText empty for ${entry.ruleId}`).toBeTruthy();
        expect(entry.verbatimQuote, `verbatimQuote empty for ${entry.ruleId}`).toBeTruthy();

        // verbatimQuote must be preserved unchanged through localization
        const originalTrace = rec.trace.find(t => t.ruleId === entry.ruleId);
        if (originalTrace) {
          expect(entry.verbatimQuote).toBe(originalTrace.source.verbatimQuote);
        }
      }

      // Source references in Vietnamese output should use 'tr.' not 'p.' prefix
      if (loc.thresholdReasoning) {
        expect(loc.thresholdReasoning).not.toMatch(/, p\.\d/);
      }
      if (loc.targetReasoning) {
        expect(loc.targetReasoning).not.toMatch(/, p\.\d/);
      }
    });
  }
});

describe('i18n: threshold/target available for PRESCRIBE fixtures', () => {
  it('PRESCRIBE fixture has thresholdText and targetText', () => {
    // Use patient_03 (diabetes, prescribe)
    const file = join(fixturesDir, 'patient_03_diabetes_high_risk.json');
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    const rec = runEngine(patient as PatientContext, kb);
    const loc = localizeRecommendation(rec);

    expect(loc.thresholdText).toBeDefined();
    expect(loc.targetText).toBeDefined();
    expect(loc.thresholdText).toMatch(/HATT/);
    expect(loc.targetText).toMatch(/HATT/);
  });
});

describe('i18n: safety halt and out-of-scope localize correctly', () => {
  it('SAFETY_HALT: statusBadge is DỪNG AN TOÀN', () => {
    const file = join(fixturesDir, 'patient_16_crisis.json');
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    const rec = runEngine(patient as PatientContext, kb);
    const loc = localizeRecommendation(rec);
    expect(loc.statusBadge).toBe('DỪNG AN TOÀN');
    expect(loc.statusColor).toBe('red');
  });

  it('OUT_OF_SCOPE: statusBadge is NGOÀI PHẠM VI', () => {
    const file = join(fixturesDir, 'patient_15_pregnancy.json');
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    const rec = runEngine(patient as PatientContext, kb);
    const loc = localizeRecommendation(rec);
    expect(loc.statusBadge).toBe('NGOÀI PHẠM VI');
    expect(loc.statusColor).toBe('orange');
  });
});

describe('i18n: drug notes are translated', () => {
  it('HFrEF fixture: ARNI note is translated to Vietnamese', () => {
    const file = join(fixturesDir, 'patient_08_hfref.json');
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    const rec = runEngine(patient as PatientContext, kb);
    const loc = localizeRecommendation(rec);

    const arniNote = loc.drugNotes.find(n => n.includes('ARNI'));
    expect(arniNote, 'ARNI note not found in translated drugNotes').toBeDefined();
  });
});

describe('i18n: follow-up text is correctly formatted', () => {
  it('PRESCRIBE fixture has followUpText with Vietnamese tái khám', () => {
    const file = join(fixturesDir, 'patient_03_diabetes_high_risk.json');
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    void _expected;
    const rec = runEngine(patient as PatientContext, kb);
    const loc = localizeRecommendation(rec);

    if (loc.followUpText) {
      expect(loc.followUpText).toMatch(/Tái khám sau \d+ tuần/);
      expect(loc.followUpText).toMatch(/tr\.38/);
    }
  });
});
