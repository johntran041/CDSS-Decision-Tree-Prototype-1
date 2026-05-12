import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import type { PatientContext, Recommendation, RecommendationStatus, DrugClassCode } from '../src/types.js';
import { loadKnowledgeBase } from '../src/knowledgeBase.js';
import { runEngine } from '../src/engine/index.js';

const kb = loadKnowledgeBase();
const fixturesDir = resolve(import.meta.dirname ?? '.', '../fixtures');

interface FixtureExpected {
  status: RecommendationStatus;
  bpCategory?: string;
  cvRiskLevel?: string;
  treatmentThreshold?: { sbp?: number; dbp?: number };
  treatmentTarget?: { sbpMin?: number; sbpMax?: number; dbpMax?: number };
  currentStep?: string;
  drugClassCodes?: DrugClassCode[];
  drugClassCodesContains?: DrugClassCode[];
  drugClassCodesNotContains?: DrugClassCode[];
  safetyAlertCount?: number;
  safetyAlertSeverity?: string;
  pathwayUsed?: string;
  doseLevel?: string;
  pillForm?: string;
  preferredCombination?: DrugClassCode[][];
  traceRuleIds?: string[];
  note?: string;
}

interface FixtureFile extends PatientContext {
  _expected: FixtureExpected;
}

function loadFixtures(): Array<{ name: string; patient: PatientContext; expected: FixtureExpected }> {
  const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();
  return files.map(file => {
    const raw = JSON.parse(readFileSync(join(fixturesDir, file), 'utf-8')) as FixtureFile;
    const { _expected, ...patient } = raw;
    return { name: file, patient: patient as PatientContext, expected: _expected };
  });
}

const fixtures = loadFixtures();

// Result tracker for summary table
interface TestResult {
  name: string;
  expectedStatus: string;
  actualStatus: string;
  passed: boolean;
}
const results: TestResult[] = [];

describe('E2E: all fixtures', () => {
  for (const { name, patient, expected } of fixtures) {
    it(`${name}: expects ${expected.status}`, () => {
      let rec: Recommendation;
      try {
        rec = runEngine(patient, kb);
      } catch (e) {
        results.push({ name, expectedStatus: expected.status, actualStatus: 'ERROR', passed: false });
        throw e;
      }

      const passed = rec.status === expected.status;
      results.push({ name, expectedStatus: expected.status, actualStatus: rec.status, passed });

      expect(rec.status).toBe(expected.status);

      if (expected.bpCategory) expect(rec.bpCategory).toBe(expected.bpCategory);
      if (expected.cvRiskLevel) expect(rec.cvRiskLevel).toBe(expected.cvRiskLevel);
      if (expected.pathwayUsed) expect(rec.pathwayUsed).toBe(expected.pathwayUsed);

      if (expected.currentStep !== undefined) {
        expect(rec.currentStep ?? null).toBe(expected.currentStep);
      }

      if (expected.treatmentThreshold) {
        expect(rec.treatmentThreshold).toBeDefined();
        if (expected.treatmentThreshold.sbp !== undefined) {
          expect(rec.treatmentThreshold!.sbp).toBe(expected.treatmentThreshold.sbp);
        }
        if (expected.treatmentThreshold.dbp !== undefined) {
          expect(rec.treatmentThreshold!.dbp).toBe(expected.treatmentThreshold.dbp);
        }
      }

      if (expected.treatmentTarget) {
        expect(rec.treatmentTarget).toBeDefined();
        if (expected.treatmentTarget.sbpMin !== undefined) {
          expect(rec.treatmentTarget!.sbpMin).toBe(expected.treatmentTarget.sbpMin);
        }
        if (expected.treatmentTarget.sbpMax !== undefined) {
          expect(rec.treatmentTarget!.sbpMax).toBe(expected.treatmentTarget.sbpMax);
        }
        if (expected.treatmentTarget.dbpMax !== undefined) {
          expect(rec.treatmentTarget!.dbpMax).toBe(expected.treatmentTarget.dbpMax);
        }
      }

      if (expected.drugClassCodes === null) {
        expect(rec.drugRecommendation).toBeUndefined();
      } else if (expected.drugClassCodes !== undefined) {
        expect(rec.drugRecommendation).toBeDefined();
        expect([...rec.drugRecommendation!.classCodes].sort()).toEqual([...expected.drugClassCodes].sort());
      }

      if (expected.drugClassCodesContains) {
        for (const code of expected.drugClassCodesContains) {
          expect(rec.drugRecommendation?.classCodes).toContain(code);
        }
      }

      if (expected.drugClassCodesNotContains) {
        for (const code of expected.drugClassCodesNotContains) {
          expect(rec.drugRecommendation?.classCodes ?? []).not.toContain(code);
        }
      }

      if (expected.safetyAlertCount !== undefined) {
        expect(rec.safetyAlerts).toHaveLength(expected.safetyAlertCount);
      }

      if (expected.traceRuleIds) {
        const ruleIds = rec.trace.map(t => t.ruleId);
        for (const id of expected.traceRuleIds) {
          expect(ruleIds, `Expected trace rule '${id}' not found in [${ruleIds.join(', ')}]`).toContain(id);
        }
      }

      // Invariants
      expect(Array.isArray(rec.safetyAlerts)).toBe(true);
      expect(Array.isArray(rec.trace)).toBe(true);
      expect(Array.isArray(rec.guidanceMessages)).toBe(true);
      expect(rec.trace.length).toBeGreaterThan(0);
      for (const entry of rec.trace) {
        expect(entry.ruleId).toBeTruthy();
        expect(entry.source.document).toBe('VSH/VNHA 2022');
        expect(entry.source.reference).toBeTruthy();
        expect(entry.source.page).toBeGreaterThan(0);
        expect(entry.reasoning).toBeTruthy();
        expect(entry.inputs).toBeDefined();
      }
    });
  }
});

afterAll(() => {
  const totalWidth = 80;
  console.log('\n' + '='.repeat(totalWidth));
  console.log('E2E TEST SUMMARY');
  console.log('='.repeat(totalWidth));
  console.log(
    'STATUS'.padEnd(8) + ' | ' +
    'FIXTURE'.padEnd(45) + ' | ' +
    'EXPECTED'.padEnd(18) + ' | ACTUAL'
  );
  console.log('-'.repeat(totalWidth));
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    if (r.passed) passed++; else failed++;
    console.log(
      icon.padEnd(8) + ' | ' +
      r.name.padEnd(45) + ' | ' +
      r.expectedStatus.padEnd(18) + ' | ' + r.actualStatus
    );
  }
  console.log('='.repeat(totalWidth));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(totalWidth) + '\n');
});
