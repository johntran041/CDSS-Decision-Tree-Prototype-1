import { createRequire } from 'module';
import type { KnowledgeBase } from './types.js';
import { validateKB } from './kb/validate.js';

const require = createRequire(import.meta.url);

let _kb: KnowledgeBase | null = null;

export function loadKnowledgeBase(): KnowledgeBase {
  if (_kb) return _kb;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = require('./kb/vsh_vnha_2022.json') as any;
  validateKB(raw);
  _kb = raw as KnowledgeBase;
  return _kb;
}
