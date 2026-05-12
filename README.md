# CDSS Tăng Huyết Áp — VSH/VNHA 2022

A Clinical Decision Support System (CDSS) for hypertension management based on the **VSH/VNHA 2022 Vietnamese national hypertension guidelines**.

Built as a capstone project by the **RawNoodles team at RMIT Vietnam** in partnership with **AstraZeneca Vietnam**.

> **Disclaimer:** This is a research/demo prototype only. Not validated for clinical use. All recommendations must be reviewed against the original VSH/VNHA 2022 guidelines and approved by a qualified clinician before any deployment.

---

## What This System Does

Given a patient's blood pressure readings and clinical profile, the system:

1. **Classifies** blood pressure (Normal / Elevated / Grade 1–3 Hypertension)
2. **Stratifies** cardiovascular risk (Low / Moderate / High / Very High)
3. **Determines** whether to initiate drug therapy and which guideline threshold applies
4. **Recommends** first-line drug classes based on compelling indications (CAD, HFrEF, CKD, T2D, Post-stroke, AF)
5. **Selects** a treatment target (SBP/DBP goals)
6. **Flags** safety halts (hypertensive crisis) and out-of-scope cases (pregnancy)
7. **Traces** every decision back to a specific table, page, or section in the VSH/VNHA 2022 document

All output is available in both English (structured) and Vietnamese (localized).

---

## Repository Structure

```
CDSS-Decision-Tree-Prototype-1/
├── hypertension-cdss-prototype/   # Rule engine + knowledge base + tests
└── hypertension-cdss-ui/          # Next.js demo web interface
```

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node.js)

---

## Part 1 — Rule Engine (hypertension-cdss-prototype)

### Setup

```bash
cd hypertension-cdss-prototype
npm install
```

### Run Tests

```bash
npm test
```

213 tests across 11 test files covering classification, risk stratification, thresholds, targets, drug selection, safety checks, and localization.

### Run the CLI

```bash
# English output (structured)
npx tsx src/cli.ts fixtures/patient_03_diabetes_high_risk.json

# Vietnamese output
npx tsx src/cli.ts fixtures/patient_03_diabetes_high_risk.json --vi

# Raw JSON (for piping / debugging)
npx tsx src/cli.ts fixtures/patient_03_diabetes_high_risk.json --json
```

### Available Fixtures

32 pre-built patient scenarios are in `fixtures/`. Some highlights:

| File | Scenario |
|---|---|
| `patient_01_simple_grade1.json` | Grade 1 HT, no comorbidities |
| `patient_03_diabetes_high_risk.json` | T2D, high risk |
| `patient_05_resistant.json` | Resistant hypertension |
| `patient_06_ckd_stage3.json` | CKD stage 3 |
| `patient_07_post_mi.json` | Post-MI / CAD |
| `patient_08_hfref.json` | HFrEF |
| `patient_09_pregnancy_excluded.json` | Pregnancy (out of scope) |
| `patient_15_pregnancy.json` | Pregnancy safety halt |
| `patient_16_crisis.json` | Hypertensive crisis |
| `patient_24_t2d_cad_elderly_dbp.json` | Elderly T2D + CAD, DBP target |

### Add Your Own Patient

Create a JSON file in `fixtures/` following the `PatientContext` format. Example:

```json
{
  "patientId": "my_patient",
  "ageYears": 58,
  "sex": "male",
  "pathwayMode": "optimal",
  "systolicBP": 155,
  "diastolicBP": 95,
  "heartRate": 72,
  "hasDiabetes": true,
  "hasCKD": false,
  "ckdStage": null,
  "hasCAD": false,
  "hasHFrEF": false,
  "hasPostStroke": false,
  "hasAF": false,
  "isPregnant": false,
  "isFrail": false,
  "hasGout": false,
  "hasAsthmaOrCOPD": false,
  "hasHyperkalemia": false,
  "currentMedications": [],
  "contraindicatedClasses": []
}
```

Then run:
```bash
npx tsx src/cli.ts fixtures/my_patient.json --vi
```

---

## Part 2 — Demo Web Interface (hypertension-cdss-ui)

### Setup

```bash
cd hypertension-cdss-ui
npm install
```

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using the Interface

The UI has three panels:

**Left panel — Patient Input**
- Toggle between **"Chọn mẫu"** (load a fixture) and **"Nhập tay"** (manual entry)
- In fixture mode: select a patient from the dropdown and click "Chạy CDSS"
- In manual mode: fill in the form fields and click "Chạy CDSS"

**Centre panel — Decision Tree**
- Shows the active pathway (Hình 3 = Essential, Hình 4 = Optimal)
- The highlighted path shows which rules fired for the current patient
- The glowing node is the current decision step
- Toggle **"Chỉ hiện đường đi"** to dim inactive nodes
- Click any node to see its rule detail in the right panel

**Right panel — Recommendation Detail**
- Shows the full localized recommendation: status badge, BP classification, risk level, threshold, treatment target, drug classes, safety alerts, follow-up schedule
- When a node is selected, shows the raw trace entry: rule name, source citation, verbatim guideline quote, input/output summary, and reasoning

### Build for Production

```bash
npm run build
npm start
```

---

## Architecture

```
Browser
  └── page.tsx (client)
        ├── FixturePicker   → GET /api/fixtures  → reads prototype/fixtures/
        ├── PatientForm     → POST /api/recommend → engine-bridge → runEngine
        ├── DecisionTreeView (ReactFlow) ← activePathFromTrace
        └── TreeNodeDetail  ← Recommendation.trace[selected ruleId]
```

The UI imports the rule engine **directly** from the prototype directory — no code duplication.

---

## Guideline Coverage

All logic is grounded in **VSH/VNHA 2022 (Section III, pp. 13–38)**:

| Component | Source |
|---|---|
| BP classification | Bảng 1, tr. 7 |
| CV risk stratification | Bảng 3–5, tr. 10–12 |
| Treatment thresholds | Bảng 6, tr. 13 |
| Treatment targets | Bảng 7, tr. 16 |
| Essential drug pathway | Hình 3, tr. 24 |
| Optimal drug pathway | Hình 4, tr. 25 |
| Compelling indications | Bảng 9–14, tr. 28–37 |
| Resistant hypertension | tr. 38 |
| Safety / crisis halt | tr. 13 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rule engine | TypeScript 5, strict ESM |
| Knowledge base | JSON (VSH/VNHA 2022) |
| Tests | Vitest |
| Web UI | Next.js 14, App Router |
| Visualisation | React Flow |
| Styling | Tailwind CSS |
| Language | Vietnamese (primary), English (structured output) |
