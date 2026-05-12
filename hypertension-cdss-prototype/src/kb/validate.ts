import type { KnowledgeBase } from '../types.js';

export function validateKB(kb: KnowledgeBase): void {
  if (!kb.bpCategories || kb.bpCategories.length < 6) {
    throw new Error('KB validation: bpCategories must have at least 6 entries (Bảng 1, p. 7)');
  }
  if (!kb.riskMatrix || kb.riskMatrix.length !== 9) {
    throw new Error('KB validation: riskMatrix must have exactly 9 entries (3×3 from Bảng 2, p. 9)');
  }
  if (!kb.thresholds || kb.thresholds.length !== 3) {
    throw new Error('KB validation: thresholds must have 3 age groups (Bảng 6, p. 15)');
  }
  if (!kb.targets || kb.targets.length !== 2) {
    throw new Error('KB validation: targets must have 2 age groups (Bảng 7, p. 16)');
  }
  if (!kb.contraindications || kb.contraindications.length < 7) {
    throw new Error('KB validation: contraindications must cover all 7 main classes (Bảng 11, p. 23)');
  }

  const allEntries: Array<{ name: string; entries: Array<{ source?: { reference: string; page: number } }> }> = [
    { name: 'bpCategories', entries: kb.bpCategories },
    { name: 'thresholds', entries: kb.thresholds },
    { name: 'targets', entries: kb.targets },
    { name: 'contraindications', entries: kb.contraindications },
    { name: 'essentialPathwayRules', entries: kb.essentialPathwayRules },
    { name: 'optimalPathwayRules', entries: kb.optimalPathwayRules },
    { name: 'compellingIndications', entries: kb.compellingIndications },
  ];

  for (const group of allEntries) {
    for (let i = 0; i < group.entries.length; i++) {
      const e = group.entries[i];
      if (!e.source) throw new Error(`KB validation: ${group.name}[${i}] missing source`);
      if (!e.source.reference) throw new Error(`KB validation: ${group.name}[${i}].source.reference is empty`);
      if (!e.source.page || e.source.page < 1) throw new Error(`KB validation: ${group.name}[${i}].source.page is invalid`);
    }
  }
}
