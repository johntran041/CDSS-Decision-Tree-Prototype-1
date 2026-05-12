import type {
  Recommendation,
  RecommendationStatus,
  BPCategory,
  RiskLevel,
  DrugClassCode,
  CompellingIndication,
  RuleTrace,
  SafetyAlert,
} from '../types.js';
import {
  STATUS_BADGE,
  STATUS_TEXT,
  STATUS_COLOR,
  BP_CATEGORY_TEXT,
  RISK_LEVEL_TEXT,
  DRUG_CLASS_TEXT,
  DRUG_CLASS_SHORT,
  COMPELLING_INDICATION_TEXT,
  RULE_ID_TEXT,
  DOSE_LEVEL_TEXT,
  PILL_FORM_TEXT,
  SEVERITY_TEXT,
  SEVERITY_COLOR,
  PATHWAY_TEXT,
  NOTE_TRANSLATIONS,
  CONDITION_TEXT,
} from './vi.js';

// ─── Public types ───────────────────────────────────────────────────────────

export interface LocalizedSafetyAlert {
  severityText: string;
  severityColor: string;
  drugClassText?: string;
  reasonText: string;
  sourceText: string;
}

export interface LocalizedTraceEntry {
  ruleId: string;
  ruleNameText: string;
  inputSummary: string;
  outputSummary: string;
  reasoningText: string;
  sourceText: string;
  verbatimQuote: string;
}

export interface LocalizedRecommendation {
  raw: Recommendation;
  statusText: string;
  statusBadge: string;
  statusColor: 'green' | 'yellow' | 'red' | 'orange' | 'blue';
  bpCategoryText: string;
  cvRiskText: string;
  thresholdText?: string;
  thresholdReasoning?: string;
  targetText?: string;
  targetReasoning?: string;
  pathwayText: string;
  pathwayStepText?: string;
  drugSummary?: string;
  drugClassNames?: string[];
  drugNotes: string[];
  safetyAlerts: LocalizedSafetyAlert[];
  guidanceMessages: string[];
  followUpText?: string;
  trace: LocalizedTraceEntry[];
}

// ─── Individual localization functions ──────────────────────────────────────

export function localizeStatus(status: RecommendationStatus): string {
  return STATUS_TEXT[status] ?? status;
}

export function localizeBPCategory(cat: BPCategory): string {
  return BP_CATEGORY_TEXT[cat] ?? cat;
}

export function localizeRiskLevel(level: RiskLevel): string {
  return RISK_LEVEL_TEXT[level] ?? level;
}

export function localizeDrugClassCode(code: DrugClassCode): string {
  return DRUG_CLASS_TEXT[code] ?? code;
}

export function localizeCompellingIndication(ind: CompellingIndication): string {
  return COMPELLING_INDICATION_TEXT[ind] ?? ind;
}

// ─── Source reference: p. → tr., Section → Mục ──────────────────────────────

function localizeSourceRef(text: string): string {
  return text
    .replace(/\bp\.(\d)/g, 'tr.$1')
    .replace(/\bSection /g, 'Mục ');
}

function localizeRef(ref: string): string {
  return ref.replace(/^Section /, 'Mục ');
}

// ─── Structured reasoning string localization ─────────────────────────────────

function localizeReasoning(text: string): string {
  // Threshold reasoning: "Age 60 (18-69), with comorbidity → SBP threshold ≥130, DBP ≥85 [Bảng 6, p.15]"
  const thresholdMatch = text.match(
    /Age (\d+) \(([^)]+)\), (with|no) comorbidity → SBP threshold ≥(\d+), DBP ≥(\d+)(.*)/
  );
  if (thresholdMatch) {
    const comorbText = thresholdMatch[3] === 'with' ? 'có bệnh đồng mắc' : 'không có bệnh đồng mắc';
    const suffix = localizeSourceRef(thresholdMatch[6] ?? '');
    return `Tuổi ${thresholdMatch[1]} (${thresholdMatch[2]}), ${comorbText} → Ngưỡng HATT ≥${thresholdMatch[4]}, HATTr ≥${thresholdMatch[5]}${suffix}`;
  }

  // Target reasoning: "Age 60 (18-69), no comorbidity → SBP 120-<130, DBP <80 [Bảng 7, p.16]"
  const targetMatch = text.match(
    /Age (\d+) \(([^)]+)\), (with|no) comorbidity → SBP (\d+)-<(\d+), DBP <(\d+)(.*)/
  );
  if (targetMatch) {
    const comorbText = targetMatch[3] === 'with' ? 'có bệnh đồng mắc' : 'không có bệnh đồng mắc';
    const suffix = localizeSourceRef(targetMatch[7] ?? '');
    return `Tuổi ${targetMatch[1]} (${targetMatch[2]}), ${comorbText} → HATT ${targetMatch[4]}-<${targetMatch[5]}, HATTr <${targetMatch[6]}${suffix}`;
  }

  // Risk reasoning: "High risk: heart failure [Bảng 2, p.9]"
  let r = text
    .replace(/^High risk: /, 'Nguy cơ cao: ')
    .replace(/^Intermediate risk: /, 'Nguy cơ trung bình: ')
    .replace(/^Low risk: /, 'Nguy cơ thấp: ')
    .replace(/\bheart failure\b/g, 'suy tim')
    .replace(/\bcoronary artery disease\b/g, 'bệnh mạch vành')
    .replace(/\bdiabetes\b/g, 'đái tháo đường')
    .replace(/\bpost.stroke\b/g, 'sau đột quỵ')
    .replace(/\bchronic kidney disease\b/g, 'bệnh thận mạn')
    .replace(/\batrial fibrillation\b/g, 'rung nhĩ')
    .replace(/\bpost.MI\b/g, 'sau NMCT')
    .replace(/\bLVH\b/g, 'phì đại thất trái')
    .replace(/\bASCVD\b/g, 'bệnh tim mạch xơ vữa')
    .replace(/\b(\d+)\+ risk factor/g, '$1+ yếu tố nguy cơ')
    .replace(/\brisk factor\b/g, 'yếu tố nguy cơ')
    .replace(/\btier\b/g, 'nhóm');
  return localizeSourceRef(r);
}

// ─── Note translation ────────────────────────────────────────────────────────

function localizeNote(note: string): string {
  // Exact match first
  const exact = NOTE_TRANSLATIONS.get(note);
  if (exact) return exact;

  // Follow-up pattern: "Follow-up in X weeks [Section 3.9, p.38]"
  const followUpMatch = note.match(/Follow-up in (\d+) weeks/);
  if (followUpMatch) {
    return `Tái khám sau ${followUpMatch[1]} tuần [Mục 3.9, tr.38]`;
  }

  // Re-evaluate pattern
  if (/Re-evaluate/.test(note)) {
    const weeksMatch = note.match(/(\d+)\s*weeks?/i);
    if (weeksMatch) return `Tái đánh giá sau ${weeksMatch[1]} tuần`;
    return 'Tái đánh giá';
  }

  // Fallback: translate common embedded references
  return localizeSourceRef(note);
}

// ─── Safety alert localization ───────────────────────────────────────────────

function localizeSafetyAlert(alert: SafetyAlert): LocalizedSafetyAlert {
  const severityText = SEVERITY_TEXT[alert.severity] ?? alert.severity;
  const severityColor = SEVERITY_COLOR[alert.severity] ?? 'gray';
  const drugClassText = alert.drugClass ? DRUG_CLASS_TEXT[alert.drugClass] : undefined;

  // Localize the reason string by substituting known condition terms
  let reasonText = alert.reason;
  for (const [en, vi] of Object.entries(CONDITION_TEXT)) {
    reasonText = reasonText.replace(new RegExp(en, 'g'), vi);
  }
  // Translate class label prefix pattern "Class X (Y): severity — condition"
  reasonText = reasonText
    .replace(/absolute contraindication/gi, 'chống chỉ định tuyệt đối')
    .replace(/absolutely contraindicated/gi, 'chống chỉ định tuyệt đối')
    .replace(/relative contraindication/gi, 'chống chỉ định tương đối')
    .replace(/Use with caution\./gi, 'Sử dụng thận trọng.')
    .replace(/Use alternative sub-class if available\./gi, 'Dùng nhóm thuốc phụ thay thế nếu có.')
    .replace(/Cannot prescribe via standard pathway\./gi, 'Không thể kê đơn theo phác đồ chuẩn.')
    .replace(/All recommended drug classes have absolute contraindications\./gi,
             'Tất cả nhóm thuốc được khuyến cáo đều có chống chỉ định tuyệt đối.');

  const sourceText = `${alert.source.reference}, tr.${alert.source.page}`;

  return { severityText, severityColor, drugClassText, reasonText, sourceText };
}

// ─── Trace entry localization ─────────────────────────────────────────────────

function localizeTraceEntry(t: RuleTrace): LocalizedTraceEntry {
  const ruleNameText = RULE_ID_TEXT[t.ruleId] ?? t.ruleId;

  const inputSummary = Object.entries(t.inputs)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ');

  const outputSummary = typeof t.output === 'string'
    ? localizeOutputString(t.output)
    : Array.isArray(t.output)
      ? (t.output as string[]).map(c => DRUG_CLASS_SHORT[c as DrugClassCode] ?? c).join(' + ')
      : JSON.stringify(t.output);

  const reasoningText = localizeNote(t.reasoning) || localizeReasoning(t.reasoning);
  const sourceText = `${localizeRef(t.source.reference)}, tr.${t.source.page}`;

  return {
    ruleId: t.ruleId,
    ruleNameText,
    inputSummary,
    outputSummary,
    reasoningText,
    sourceText,
    verbatimQuote: t.source.verbatimQuote,
  };
}

function localizeOutputString(s: string): string {
  const map: Record<string, string> = {
    LIFESTYLE_ONLY: 'Chỉ thay đổi lối sống',
    PRESCRIBE: 'Kê đơn thuốc',
    REFER_SPECIALIST: 'Chuyển chuyên gia',
    SAFETY_HALT: 'Dừng an toàn',
    OUT_OF_SCOPE: 'Ngoài phạm vi',
    none: 'Không có',
    no_recommendation: 'Không có khuyến cáo thuốc',
  };
  // If it's a compelling indication key, translate it
  const compelling = COMPELLING_INDICATION_TEXT[s as CompellingIndication];
  if (compelling && s !== 'none') return compelling;
  return map[s] ?? s;
}

// ─── Drug summary string ─────────────────────────────────────────────────────

function buildDrugSummary(rec: Recommendation): string | undefined {
  const dr = rec.drugRecommendation;
  if (!dr) return undefined;

  const codes = dr.classCodes.map(c => DRUG_CLASS_SHORT[c] ?? c).join(', ');
  const preferred = dr.preferredCombination
    ?.map(combo => combo.map(c => DRUG_CLASS_SHORT[c] ?? c).join('+'))
    .join(' hoặc ');
  const form = dr.pillForm ? PILL_FORM_TEXT[dr.pillForm] : undefined;
  const dose = DOSE_LEVEL_TEXT[dr.doseLevel] ?? dr.doseLevel;

  let summary = `${codes}`;
  if (preferred) summary += ` (ưu tiên: ${preferred})`;
  if (form) summary += ` — ${form}`;
  summary += `, liều ${dose.toLowerCase()}`;
  return summary;
}

// ─── Main localization function ───────────────────────────────────────────────

export function localizeRecommendation(rec: Recommendation): LocalizedRecommendation {
  const statusText = STATUS_TEXT[rec.status] ?? rec.status;
  const statusBadge = STATUS_BADGE[rec.status] ?? rec.status;
  const statusColor = STATUS_COLOR[rec.status] ?? 'blue';
  const bpCategoryText = BP_CATEGORY_TEXT[rec.bpCategory] ?? rec.bpCategory;
  const cvRiskText = RISK_LEVEL_TEXT[rec.cvRiskLevel] ?? rec.cvRiskLevel;
  const pathwayText = PATHWAY_TEXT[rec.pathwayUsed] ?? rec.pathwayUsed;
  const pathwayStepText = rec.currentStep ? (RULE_ID_TEXT[rec.currentStep] ?? rec.currentStep) : undefined;

  // Threshold text
  let thresholdText: string | undefined;
  let thresholdReasoning: string | undefined;
  if (rec.treatmentThreshold) {
    thresholdText = `HATT ≥${rec.treatmentThreshold.sbp}, HATTr ≥${rec.treatmentThreshold.dbp} mmHg`;
    thresholdReasoning = localizeReasoning(rec.treatmentThreshold.reasoning);
  }

  // Target text
  let targetText: string | undefined;
  let targetReasoning: string | undefined;
  if (rec.treatmentTarget) {
    targetText = `HATT ${rec.treatmentTarget.sbpMin}-<${rec.treatmentTarget.sbpMax}, HATTr <${rec.treatmentTarget.dbpMax} mmHg`;
    targetReasoning = localizeReasoning(rec.treatmentTarget.reasoning);
  }

  // Drug info
  const drugClassNames = rec.drugRecommendation?.classCodes.map(c => DRUG_CLASS_TEXT[c] ?? c);
  const drugSummary = buildDrugSummary(rec);
  const drugNotes = (rec.drugRecommendation?.notes ?? []).map(localizeNote);

  // Safety alerts
  const safetyAlerts = rec.safetyAlerts.map(localizeSafetyAlert);

  // Guidance messages (filter out re-evaluate; follow-up is separate)
  const filteredGuidance = rec.guidanceMessages.filter(
    msg => !msg.toLowerCase().includes('re-evaluate') && !msg.toLowerCase().includes('follow-up')
  );
  const guidanceMessages = filteredGuidance.map(localizeNote);

  // Follow-up text
  let followUpText: string | undefined;
  if (rec.nextEvaluationWeeks !== undefined) {
    followUpText = `Tái khám sau ${rec.nextEvaluationWeeks} tuần [Mục 3.9, tr.38]`;
  }

  // Trace
  const trace = rec.trace.map(localizeTraceEntry);

  return {
    raw: rec,
    statusText,
    statusBadge,
    statusColor,
    bpCategoryText,
    cvRiskText,
    thresholdText,
    thresholdReasoning,
    targetText,
    targetReasoning,
    pathwayText,
    pathwayStepText,
    drugSummary,
    drugClassNames,
    drugNotes,
    safetyAlerts,
    guidanceMessages,
    followUpText,
    trace,
  };
}
