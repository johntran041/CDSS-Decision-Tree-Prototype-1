#!/usr/bin/env tsx
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PatientContext, Recommendation } from './types.js';
import { loadKnowledgeBase } from './knowledgeBase.js';
import { runEngine } from './engine/index.js';
import { localizeRecommendation, type LocalizedRecommendation } from './i18n/localize.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: tsx src/cli.ts <patient.json> [--json] [--vi]');
  process.exit(1);
}

const jsonFlag = args.includes('--json');
const viFlag = args.includes('--vi');
const patientFile = args.find(a => !a.startsWith('--'));
if (!patientFile) {
  console.error('Error: no patient file specified');
  process.exit(1);
}

const filePath = resolve(patientFile);
let patient: PatientContext;
try {
  patient = JSON.parse(readFileSync(filePath, 'utf-8')) as PatientContext;
} catch (e) {
  console.error(`Error reading patient file: ${filePath}`);
  console.error(e);
  process.exit(1);
}

const kb = loadKnowledgeBase();
const rec = runEngine(patient, kb);

if (jsonFlag) {
  console.log(JSON.stringify(rec, null, 2));
  process.exit(0);
}

if (viFlag) {
  const loc = localizeRecommendation(rec);
  printViReport(patient, loc);
} else {
  printReport(patient, rec);
}

// ─── Vietnamese report ────────────────────────────────────────────────────────

function printViReport(p: PatientContext, loc: LocalizedRecommendation): void {
  const hr = '='.repeat(65);
  const sep = '-'.repeat(65);
  const sexText = p.sex === 'male' ? 'Nam' : 'Nữ';

  console.log(hr);
  console.log('Hệ thống Hỗ trợ Quyết định Lâm sàng — VSH/VNHA 2022');
  console.log(`Bệnh nhân: ${p.patientId} | Tuổi ${p.ageYears} | ${sexText}`);
  console.log(hr);

  console.log('\nTHÔNG TIN ĐẦU VÀO');
  console.log(`  HA phòng khám: ${p.officeSBP} / ${p.officeDBP} mmHg`);
  const comorbList = buildViComorbList(p);
  console.log(`  Bệnh đồng mắc: ${comorbList || 'không có'}`);
  console.log(`  Chế độ: ${loc.pathwayText}`);

  console.log('\nPHÂN LOẠI');
  const classTrace = loc.raw.trace.find(t => t.ruleId === 'classify_bp');
  const riskTrace = loc.raw.trace.find(t => t.ruleId === 'stratify_risk');
  console.log(`  Phân loại HA: ${loc.bpCategoryText}  [${classTrace?.source.reference ?? 'Bảng 1'}, tr.${classTrace?.source.page ?? 7}]`);
  console.log(`  Nguy cơ tim mạch: ${loc.cvRiskText}  — ${riskTrace?.reasoning ?? ''}`);

  if (loc.thresholdText && loc.targetText) {
    console.log('\nNGƯỠNG VÀ ĐÍCH ĐIỀU TRỊ');
    console.log(`  Ngưỡng điều trị: ${loc.thresholdText}`);
    if (loc.thresholdReasoning) console.log(`    Lý do: ${loc.thresholdReasoning}`);
    console.log(`  Đích điều trị: ${loc.targetText}`);
    if (loc.targetReasoning) console.log(`    Lý do: ${loc.targetReasoning}`);
  }

  console.log('\nSƠ ĐỒ ĐIỀU TRỊ');
  console.log(`  Chế độ: ${loc.pathwayText}`);
  if (loc.pathwayStepText) {
    const stepTrace = loc.raw.trace.find(t => t.ruleId === loc.raw.currentStep);
    console.log(`  Bước: ${loc.pathwayStepText}${stepTrace ? `  [${stepTrace.source.reference}, tr.${stepTrace.source.page}]` : ''}`);
  }

  console.log('\nKHUYẾN CÁO');
  console.log(`  Trạng thái:  ${loc.statusBadge}`);
  if (loc.drugSummary) {
    console.log(`  Thuốc:    ${loc.drugSummary}`);
  } else if (loc.raw.status === 'LIFESTYLE_ONLY') {
    console.log('  Không cần dùng thuốc tại thời điểm này');
  }
  for (const note of loc.drugNotes) {
    console.log(`  Lưu ý:    ${note}`);
  }

  console.log('\nCẢNH BÁO AN TOÀN');
  if (loc.safetyAlerts.length === 0) {
    console.log('  (không có)');
  } else {
    for (const alert of loc.safetyAlerts) {
      const cls = alert.drugClassText ? ` [${alert.drugClassText}]` : '';
      console.log(`  [${alert.severityText.toUpperCase()}]${cls} ${alert.reasonText}`);
      console.log(`    Nguồn: ${alert.sourceText}`);
    }
  }

  console.log('\nHƯỚNG DẪN');
  if (loc.guidanceMessages.length === 0 && !loc.followUpText) {
    console.log('  (không có)');
  } else {
    for (const msg of loc.guidanceMessages) {
      console.log(`  - ${msg}`);
    }
    if (loc.followUpText) {
      console.log(`  - ${loc.followUpText}`);
    }
  }

  console.log(`\nVẾT SUY LUẬN (${loc.trace.length} quy tắc đã kích hoạt)`);
  console.log(sep);
  loc.trace.forEach((t, i) => {
    const ruleCol = `[${i + 1}] ${t.ruleId}`.padEnd(42);
    console.log(`  ${ruleCol} → ${t.outputSummary.padEnd(20)} [${t.sourceText}]`);
  });
  console.log(hr);
}

// ─── English report ────────────────────────────────────────────────────────────

function printReport(p: PatientContext, r: Recommendation): void {
  const hr = '='.repeat(65);
  const sep = '-'.repeat(65);

  console.log(hr);
  console.log('VSH/VNHA 2022 Hypertension CDSS Prototype');
  console.log(`Patient: ${p.patientId} | Age ${p.ageYears} | ${capitalize(p.sex)}`);
  console.log(hr);

  console.log('\nINPUT');
  console.log(`  Office BP: ${p.officeSBP} / ${p.officeDBP} mmHg`);
  const comorbList = buildComorbList(p);
  console.log(`  Comorbidities: ${comorbList || 'none'}`);
  console.log(`  Site mode: ${p.siteConfig.pathwayMode}`);

  console.log('\nCLASSIFICATION');
  const classTrace = r.trace.find(t => t.ruleId === 'classify_bp');
  const riskTrace = r.trace.find(t => t.ruleId === 'stratify_risk');
  console.log(`  BP Category: ${r.bpCategory}  [${classTrace?.source.reference ?? 'Bảng 1'}, p.${classTrace?.source.page ?? 7}]`);
  console.log(`  CV Risk:     ${r.cvRiskLevel}  — ${riskTrace?.reasoning ?? ''}`);

  if (r.treatmentThreshold && r.treatmentTarget) {
    console.log('\nTHRESHOLDS & TARGETS');
    console.log(`  Threshold (start drugs at): SBP ≥${r.treatmentThreshold.sbp}, DBP ≥${r.treatmentThreshold.dbp} mmHg`);
    console.log(`    Reason: ${r.treatmentThreshold.reasoning}`);
    console.log(`  Target: SBP ${r.treatmentTarget.sbpMin}-<${r.treatmentTarget.sbpMax}, DBP <${r.treatmentTarget.dbpMax} mmHg`);
    console.log(`    Reason: ${r.treatmentTarget.reasoning}`);
  }

  console.log('\nPATHWAY');
  console.log(`  Mode: ${r.pathwayUsed}`);
  if (r.currentStep) {
    const stepTrace = r.trace.find(t => t.ruleId === r.currentStep);
    console.log(`  Step: ${r.currentStep}${stepTrace ? `  [${stepTrace.source.reference}, p.${stepTrace.source.page}]` : ''}`);
  }

  console.log('\nRECOMMENDATION');
  console.log(`  Status:  ${r.status}`);
  if (r.drugRecommendation) {
    const dr = r.drugRecommendation;
    const prefStr = dr.preferredCombination?.map(c => c.join('+')).join(' or ') ?? '';
    console.log(`  Drugs:   ${dr.classCodes.join(', ')}${prefStr ? `  (preferred: ${prefStr})` : ''}`);
    console.log(`  Dose:    ${dr.doseLevel}`);
    if (dr.pillForm) console.log(`  Form:    ${dr.pillForm}`);
    for (const note of dr.notes) {
      console.log(`  Note:    ${note}`);
    }
  } else if (r.status === 'LIFESTYLE_ONLY') {
    console.log('  No pharmacotherapy at this time');
  }

  console.log('\nSAFETY ALERTS');
  if (r.safetyAlerts.length === 0) {
    console.log('  (none)');
  } else {
    for (const alert of r.safetyAlerts) {
      const cls = alert.drugClass ? ` [Class ${alert.drugClass}]` : '';
      console.log(`  [${alert.severity.toUpperCase()}]${cls} ${alert.reason}`);
      console.log(`    Source: ${alert.source.reference}, p.${alert.source.page}`);
    }
  }

  console.log('\nGUIDANCE');
  const filteredGuidance = r.guidanceMessages.filter(msg =>
    !msg.toLowerCase().includes('re-evaluate') && !msg.toLowerCase().includes('follow-up')
  );
  if (filteredGuidance.length === 0 && r.nextEvaluationWeeks === undefined) {
    console.log('  (none)');
  } else {
    for (const msg of filteredGuidance) {
      console.log(`  - ${msg}`);
    }
    if (r.nextEvaluationWeeks !== undefined) {
      console.log(`  - Follow-up in ${r.nextEvaluationWeeks} weeks [Section 3.9, p.38]`);
    }
  }

  console.log(`\nREASONING TRACE (${r.trace.length} rules fired)`);
  console.log(sep);
  r.trace.forEach((t, i) => {
    const src = `[${t.source.reference}, p.${t.source.page}]`;
    const outStr = typeof t.output === 'string' ? t.output
      : Array.isArray(t.output) ? (t.output as string[]).join('+')
      : JSON.stringify(t.output);
    const ruleCol = `[${i + 1}] ${t.ruleId}`.padEnd(42);
    console.log(`  ${ruleCol} → ${outStr.padEnd(20)} ${src}`);
  });

  console.log(hr);
}

function buildViComorbList(p: PatientContext): string {
  const list: string[] = [];
  if (p.hasDiabetesType2) list.push('Đái tháo đường týp 2');
  if (p.hasCAD) list.push('Bệnh mạch vành');
  if (p.hasPostMI) list.push('Sau NMCT');
  if (p.hasHeartFailure) list.push(`Suy tim${p.hfrefEjectionFraction !== undefined ? ` (EF ${p.hfrefEjectionFraction}%)` : ''}`);
  if (p.hasPostStroke) list.push('Sau đột quỵ');
  if (p.ckdStage && p.ckdStage !== 'none') list.push(`Bệnh thận mạn ${p.ckdStage}`);
  if (p.hasAtrialFibrillation) list.push('Rung nhĩ');
  if (p.hasAngina) list.push('Đau thắt ngực');
  if (p.hasLVH) list.push('Phì đại thất trái');
  if (p.hasASCVD) list.push('Bệnh tim mạch xơ vữa');
  if (p.isPregnant) list.push('Có thai');
  if (p.isFrail) list.push('Suy yếu');
  return list.join(', ');
}

function buildComorbList(p: PatientContext): string {
  const list: string[] = [];
  if (p.hasDiabetesType2) list.push('Type 2 Diabetes');
  if (p.hasCAD) list.push('CAD');
  if (p.hasPostMI) list.push('Post-MI');
  if (p.hasHeartFailure) list.push(`Heart Failure${p.hfrefEjectionFraction !== undefined ? ` (EF ${p.hfrefEjectionFraction}%)` : ''}`);
  if (p.hasPostStroke) list.push('Post-Stroke');
  if (p.ckdStage && p.ckdStage !== 'none') list.push(`CKD ${p.ckdStage}`);
  if (p.hasAtrialFibrillation) list.push('AF');
  if (p.hasAngina) list.push('Angina');
  if (p.hasLVH) list.push('LVH');
  if (p.hasASCVD) list.push('ASCVD');
  if (p.isPregnant) list.push('Pregnant');
  if (p.isFrail) list.push('Frail');
  return list.join(', ');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
