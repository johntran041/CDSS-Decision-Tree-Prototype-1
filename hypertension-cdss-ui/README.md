# CDSS Tăng huyết áp — Demo UI

A Vietnamese-language demo interface for the VSH/VNHA 2022 Hypertension Clinical Decision Support System.
Built with Next.js 14, TypeScript, Tailwind CSS, and React Flow.

> **Disclaimer:** This is a research/demo prototype only. Not for clinical use.

---

## How to Run

```bash
# From hypertension-cdss-ui/
npm install
npm run dev
# Opens at http://localhost:3000
```

**Requires:** Node 20+. The prototype must be at `../hypertension-cdss-prototype` (sibling directory).

---

## How the Engine is Shared

The UI imports the rule engine **directly** from the prototype directory — no code duplication.

`src/lib/engine-bridge.ts` does:
```typescript
import { runEngine } from '../../../hypertension-cdss-prototype/src/engine/index.js';
import { localizeRecommendation } from '../../../hypertension-cdss-prototype/src/i18n/localize.js';
import kbData from '../../../hypertension-cdss-prototype/src/kb/vsh_vnha_2022.json';
```

`next.config.mjs` enables this with:
- `experimental.externalDir: true` — allows imports outside the project root
- `webpack.extensionAlias` — resolves `.js` ESM imports to `.ts` TypeScript source files

The API route at `POST /api/recommend` calls `recommend()` from the bridge and returns both the raw structured output and the Vietnamese-localized output.

---

## How Fixtures Are Discovered

The GET `/api/fixtures` endpoint reads `../hypertension-cdss-prototype/fixtures/*.json` at runtime and returns fixture metadata for the dropdown. **No configuration needed** — drop any `.json` fixture file into the prototype's `fixtures/` directory and it appears automatically on the next page refresh.

Each fixture entry includes: `patientId`, `ageYears`, `sex`, `pathwayMode`, `summary` (Vietnamese auto-generated description), and `data` (the full `PatientContext`).

---

## How to Add New Fixtures

1. Add a `.json` file to `../hypertension-cdss-prototype/fixtures/` following the `PatientContext` format.
2. Refresh the browser. The fixture appears in the dropdown automatically.
3. Optionally add an `_expected` field (used by the prototype's test suite, ignored by the UI).

---

## How to Extend the Decision Tree (Hình 3 / Hình 4)

The tree graphs are defined in two files:
- `src/components/tree/hinh3Graph.ts` — Essential pathway (Hình 3)
- `src/components/tree/hinh4Graph.ts` — Optimal pathway (Hình 4)

Each file exports `nodes: Node[]` and `edges: Edge[]` in React Flow format. Each node has:
```typescript
data: {
  label: string;     // Vietnamese display text (\n for line breaks)
  kind: 'start' | 'decision' | 'branch' | 'action' | 'leaf' | 'warn' | 'refer' | 'success';
  ruleId: string;    // matches a ruleId in Recommendation.trace
}
```

When a new guideline revision updates Hình 3 or Hình 4:
1. Add/edit nodes and edges in the appropriate graph file.
2. Update `src/lib/activePathFromTrace.ts` to map the new `ruleId` → node id(s).
3. No changes to the engine or KB are needed for the visual layer alone.

The `activePathFromTrace.ts` module walks `Recommendation.trace` and returns a `Set<string>` of node IDs that should be highlighted as the active pathway for the current patient.

---

## Architecture

```
Browser
  └── page.tsx (client)
        ├── FixturePicker → GET /api/fixtures → reads prototype/fixtures/
        ├── PatientForm → POST /api/recommend → engine-bridge → runEngine + localizeRecommendation
        ├── DecisionTreeView (ReactFlow) ← activePathFromTrace
        └── TreeNodeDetail ← Recommendation.trace[selected ruleId]
```

All clinical logic lives in the prototype. The UI is a pure presentation layer.

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # lang="vi", metadata
│   ├── page.tsx            # Three-panel layout (client)
│   ├── globals.css         # Tailwind + ReactFlow styles
│   └── api/
│       ├── recommend/route.ts   # POST: runs engine
│       └── fixtures/route.ts    # GET: lists fixtures
├── components/
│   ├── FixturePicker.tsx
│   ├── PatientForm.tsx
│   ├── DecisionTreeView.tsx
│   ├── TreeNodeDetail.tsx
│   ├── StatusBadge.tsx
│   └── tree/
│       ├── nodeTypes.tsx    # CdssNode custom renderer
│       ├── hinh3Graph.ts    # Essential pathway nodes + edges
│       └── hinh4Graph.ts    # Optimal pathway nodes + edges
└── lib/
    ├── engine-bridge.ts     # Imports from prototype (server-side only)
    ├── activePathFromTrace.ts  # Maps trace → highlighted node IDs
    └── types.ts             # Re-exports prototype types
```
