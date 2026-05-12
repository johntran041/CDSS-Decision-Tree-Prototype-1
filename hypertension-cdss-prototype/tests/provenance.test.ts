import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import type { PatientContext } from '../src/types.js';
import { loadKnowledgeBase } from '../src/knowledgeBase.js';
import { runEngine } from '../src/engine/index.js';

const kb = loadKnowledgeBase();
const fixturesDir = resolve(import.meta.dirname ?? '.', '../fixtures');

describe('Provenance: every trace entry must cite VSH/VNHA 2022 with verbatim quote', () => {
  const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json')).sort();

  for (const file of files) {
    it(`${file}: all trace entries have non-empty verbatimQuote`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = JSON.parse(readFileSync(join(fixturesDir, file), 'utf-8')) as any;
      const { _expected, ...patient } = raw;
      void _expected;
      const rec = runEngine(patient as PatientContext, kb);

      for (const t of rec.trace) {
        expect(t.source.document, `${t.ruleId}: source.document`).toBe('VSH/VNHA 2022');
        expect(t.source.reference, `${t.ruleId}: source.reference`).toBeTruthy();
        expect(t.source.page, `${t.ruleId}: source.page`).toBeGreaterThan(0);
        expect(
          t.source.verbatimQuote,
          `${t.ruleId} is missing verbatimQuote`
        ).toBeTruthy();
        expect(
          t.source.verbatimQuote.length,
          `${t.ruleId}: verbatimQuote too short`
        ).toBeGreaterThan(20);
      }
    });
  }
});
