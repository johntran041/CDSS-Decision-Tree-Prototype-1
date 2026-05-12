# VSH/VNHA 2022 Hypertension CDSS Prototype

A deterministic rule engine for hypertension treatment recommendation based on the **VSH/VNHA 2022 Vietnamese national hypertension guidelines**. Built for the RawNoodles capstone team at RMIT Vietnam in partnership with AstraZeneca Vietnam.

> **Validation notice:** This prototype has not been validated for clinical use. All recommendations must be reviewed against the original VSH/VNHA 2022 document and approved by the industry supervisor before any production deployment.

---

## Quick Start

```bash
pnpm install
pnpm test
pnpm cli fixtures/patient_03_diabetes_high_risk.json
pnpm cli fixtures/patient_03_diabetes_high_risk.json --json   # raw JSON output
```

---

## Project Purpose and Scope

This prototype validates that a **deterministic forward-chaining rule engine** can produce accurate, traceable hypertension treatment recommendations. If it passes accuracy tests, the logic will be ported to the production stack (FastAPI + PostgreSQL + TypeScript rule engine wired into CDS Hooks and FHIR R4).

**Architectural principle (the "sandwich"):** the rule engine is purely deterministic. It takes a structured `PatientContext` and returns a structured `Recommendation`. There is **no LLM** in this prototype. An LLM may later wrap the recommendation to produce human-readable explanations.

**In scope (Section III of VSH/VNHA 2022, pp. 13–38):**

| Component | Source | Status |
|---|---|---|
| BP classification | Bảng 1, p.7 | ✅ Implemented |
| CV risk stratification | Bảng 2, p.9 | ✅ Implemented |
| Treatment thresholds by age | Bảng 6, p.15 | ✅ Implemented |
| Treatment targets by age | Bảng 7, p.16 | ✅ Implemented |
| Essential pathway (Hình 3) | Hình 3, p.17 | ✅ Implemented |
| Optimal pathway (Hình 4) | Hình 4, p.18 | ✅ Implemented |
| Drug contraindications | Bảng 11, p.23 | ✅ Implemented |
| Comorbidity overrides (T2D, CAD, HF, CKD, stroke) | Bảng 18–24, pp.32–36 | ✅ Implemented |
| Resistant HTN detection | Hình 3–4, p.17–18 | ✅ Implemented |

**Out of scope (stubbed with clear error messages):**

- Diagnosis flow (Hình 1)
- HBPM technique guidance
- Secondary HTN workup
- Hypertensive emergency (Bảng 14) — returns `SAFETY_HALT`
- Pregnancy management (Bảng 15–16) — returns `OUT_OF_SCOPE`
- Device therapy
- Renovascular HTN / primary aldosteronism
- Acute stroke management (only chronic-phase stroke rules included)

---

## Architecture

```
PatientContext (JSON)
       │
       ▼
┌─────────────────────────────────────────────────────┐
│                   runEngine()                       │
│                 engine/index.ts                     │
│                                                     │
│  1. Safety guards (pregnancy → OUT_OF_SCOPE,        │
│                    crisis → SAFETY_HALT)            │
│  2. classifyBP()          [Bảng 1]                  │
│  3. stratifyRisk()        [Bảng 2]                  │
│  4. computeThreshold()    [Bảng 6]                  │
│  5. computeTarget()       [Bảng 7]                  │
│  6. Threshold gate        [Bảng 6]                  │
│  7. detectCompellingIndication()  [Section 3.7]     │
│  8. selectPathway()       [site config]             │
│  9a. runEssentialPathway() [Hình 3]                 │
│   or                                                │
│  9b. runOptimalPathway()  [Hình 4]                  │
│  10. applyContraindications() [Bảng 11]             │
│  11. Assemble Recommendation                        │
└─────────────────────────────────────────────────────┘
       │
       ▼
Recommendation (JSON)
  ├── status: PRESCRIBE | LIFESTYLE_ONLY | REFER_SPECIALIST
  │           SAFETY_HALT | OUT_OF_SCOPE
  ├── drugRecommendation (classCodes, doseLevel, pillForm)
  ├── safetyAlerts []
  ├── treatmentThreshold / treatmentTarget
  └── trace[] — every rule that fired (ruleId + source + reasoning)
```

---

## Knowledge Base Provenance

All thresholds, targets, and rules are encoded in `src/kb/vsh_vnha_2022.json`. Every entry includes a `source` field with guideline reference and page number. **No thresholds are hardcoded in TypeScript.**

| KB section | Guideline reference | Page |
|---|---|---|
| `bpCategories` | Bảng 1 | 7 |
| `riskMatrix` | Bảng 2 | 9 |
| `thresholds` | Bảng 6 | 15 |
| `targets` | Bảng 7 | 16 |
| `essentialPathwayRules` | Hình 3 | 17 |
| `optimalPathwayRules` | Hình 4 | 18 |
| `contraindications` | Bảng 11 | 23 |
| `compellingIndications` | Bảng 18–24, Section 3.7 | 30–36 |

---

## How to Extend

### Add a new comorbidity / compelling indication

1. Add an entry to `compellingIndications` in `src/kb/vsh_vnha_2022.json`:
   ```json
   {
     "indication": "your_new_indication",
     "thresholdSBP": 130,
     "targetSBPMax": 130,
     "preferredClasses": [["A","C"]],
     "notes": ["Your notes here"],
     "source": { "reference": "Bảng XX", "page": 99 }
   }
   ```
2. Add the new value to the `CompellingIndication` union type in `src/types.ts`.
3. Add detection logic in `src/engine/compellingIndication.ts`.
4. Add a test fixture in `fixtures/` and a test case in `tests/e2e.test.ts`.

### Add a new drug class

1. Add the class code to the `DrugClassCode` union type in `src/types.ts`.
2. Add contraindication entries in `src/kb/vsh_vnha_2022.json`.
3. Map the new code in `getKBKeysForClass()` in `src/engine/safetyChecks.ts`.
4. Reference the new code in relevant pathway rules.

### Add a new pathway rule

1. Add a rule entry to `essentialPathwayRules` or `optimalPathwayRules` in the KB.
2. Implement the rule logic in `src/engine/essentialPathway.ts` or `optimalPathway.ts`.
3. Ensure the rule pushes a `RuleTrace` entry — the TypeScript type enforces all required fields.

---

## Provenance Audit Notes

Every rule that fires records a `verbatimQuote` in its `RuleTrace.source` — the exact Vietnamese text from VSH/VNHA 2022 that supports the rule. This field is:

- **Required** at the TypeScript type level (compile error if missing).
- **Tested** by `tests/provenance.test.ts`, which runs all 32 fixtures and asserts `verbatimQuote` is non-empty (> 20 characters) for every trace entry.

Clinical ambiguities — places where the document supports more than one valid interpretation — are documented in `AMBIGUITIES.md` with page references and a question for Dr. Huy Nhat.

---

## Known Limitations

- **Class 'A' granularity**: the engine treats ACEi and ARB as sub-classes of the single code 'A'. Angioedema from ACEi (an absolute CI for ACEi) emits a warning and keeps the 'A' code so the clinician can switch to ARB. This is correct behaviour but the UI layer must make the sub-class distinction explicit.
- **Risk factor counting**: environmental/social factors mentioned in the guideline (Bảng 2) are not encoded as patient fields and are not counted.
- **HABTC + lifestyle-only threshold**: the Bảng 6 table threshold (≥140 for age 18–69) is used for output display, but the engine correctly routes HABTC patients through the pathway logic (3–6 month lifestyle trial) regardless of the table threshold.
- **Frailty and Hình 6**: detailed frailty-adjusted targets (Hình 6) are not fully encoded; frail patients receive monotherapy at low dose, which is the core recommendation.
- **Single pill combinations**: pill-form availability is market-dependent; the engine marks `pillForm: 'single_pill'` as a preference, not a guarantee.

---

## Running Tests

```bash
pnpm test                    # all tests
pnpm test:watch              # watch mode
pnpm test:coverage           # with v8 coverage report
pnpm typecheck               # TypeScript strict-mode check
```

Test coverage target: ≥90% line coverage on all engine modules.
