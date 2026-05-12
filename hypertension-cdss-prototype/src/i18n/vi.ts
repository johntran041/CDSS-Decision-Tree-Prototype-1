import type { RecommendationStatus, BPCategory, RiskLevel, DrugClassCode, CompellingIndication } from '../types.js';

export const STATUS_BADGE: Record<RecommendationStatus, string> = {
  PRESCRIBE: 'KÊ ĐƠN',
  LIFESTYLE_ONLY: 'TĐLS',
  ESCALATE: 'TĂNG BƯỚC',
  REFER_SPECIALIST: 'CHUYỂN CHUYÊN GIA',
  OUT_OF_SCOPE: 'NGOÀI PHẠM VI',
  SAFETY_HALT: 'DỪNG AN TOÀN',
};

export const STATUS_TEXT: Record<RecommendationStatus, string> = {
  PRESCRIBE: 'Kê đơn thuốc theo phác đồ',
  LIFESTYLE_ONLY: 'Chỉ thay đổi lối sống',
  ESCALATE: 'Tăng bước điều trị',
  REFER_SPECIALIST: 'Chuyển chuyên gia THA hoặc trung tâm tim mạch',
  OUT_OF_SCOPE: 'Ngoài phạm vi của hệ thống — cần chuyên khoa',
  SAFETY_HALT: 'Cơn THA — cấp cứu ngay',
};

export const STATUS_COLOR: Record<RecommendationStatus, 'green' | 'blue' | 'yellow' | 'orange' | 'red'> = {
  PRESCRIBE: 'green',
  LIFESTYLE_ONLY: 'blue',
  ESCALATE: 'yellow',
  REFER_SPECIALIST: 'orange',
  OUT_OF_SCOPE: 'orange',
  SAFETY_HALT: 'red',
};

export const BP_CATEGORY_TEXT: Record<BPCategory, string> = {
  normal: 'Bình thường',
  high_normal: 'Bình thường - cao (HABTC)',
  grade_1: 'THA độ 1',
  grade_2: 'THA độ 2',
  isolated_systolic: 'THA tâm thu đơn độc',
  hypertensive_crisis: 'Cơn THA',
};

export const RISK_LEVEL_TEXT: Record<RiskLevel, string> = {
  low: 'Thấp',
  intermediate: 'Trung bình',
  high: 'Cao',
};

export const DRUG_CLASS_TEXT: Record<DrugClassCode, string> = {
  A: 'Ức chế men chuyển / Chẹn thụ thể angiotensin (ƯCMC/CTTA)',
  B: 'Chẹn beta (CB)',
  C: 'Chẹn kênh canxi (CKCa)',
  D: 'Lợi tiểu giống thiazide (LT)',
  MRA: 'Đối kháng thụ thể mineralocorticoid (MRA)',
  SGLT2i: 'Ức chế SGLT2',
  GLP1RA: 'Đồng vận thụ thể GLP-1',
  ARNI: 'Ức chế thụ thể angiotensin-neprilysin (ARNI)',
  loop: 'Lợi tiểu quai',
  alpha: 'Chẹn alpha',
};

export const DRUG_CLASS_SHORT: Record<DrugClassCode, string> = {
  A: 'ƯCMC/CTTA',
  B: 'CB',
  C: 'CKCa',
  D: 'LT',
  MRA: 'MRA',
  SGLT2i: 'SGLT2i',
  GLP1RA: 'GLP-1',
  ARNI: 'ARNI',
  loop: 'LT quai',
  alpha: 'Chẹn α',
};

export const COMPELLING_INDICATION_TEXT: Record<CompellingIndication, string> = {
  none: 'Không có',
  coronary_artery_disease: 'Bệnh mạch vành (BMV)',
  post_myocardial_infarction: 'Sau nhồi máu cơ tim (NMCT)',
  heart_failure_reduced_ef: 'Suy tim phân suất tống máu giảm (HFrEF)',
  heart_failure_preserved_ef: 'Suy tim phân suất tống máu bảo tồn (HFpEF)',
  left_ventricular_hypertrophy: 'Phì đại thất trái',
  post_stroke: 'Sau đột quỵ',
  chronic_kidney_disease: 'Bệnh thận mạn (BTM)',
  type2_diabetes_high_risk: 'Đái tháo đường týp 2 nguy cơ cao (ĐTĐ)',
  atrial_fibrillation: 'Rung nhĩ',
  angina: 'Đau thắt ngực',
};

export const RULE_ID_TEXT: Record<string, string> = {
  classify_bp: 'Phân loại huyết áp',
  stratify_risk: 'Phân tầng nguy cơ tim mạch',
  compute_threshold: 'Xác định ngưỡng điều trị theo nhóm tuổi và bệnh đồng mắc',
  compute_target: 'Xác định đích huyết áp theo nhóm tuổi và bệnh đồng mắc',
  detect_compelling_indication: 'Phát hiện chỉ định bắt buộc theo bệnh đồng mắc',
  select_pathway: 'Chọn sơ đồ điều trị (Thiết yếu/Tối ưu)',
  safety_check: 'Kiểm tra chống chỉ định thuốc',
  safety_halt_crisis: 'Dừng an toàn — cơn THA',
  out_of_scope_check: 'Kiểm tra ngoài phạm vi (thai kỳ)',
  threshold_check: 'So sánh HA với ngưỡng điều trị',
  escalate_all_ci: 'Chuyển chuyên gia — tất cả nhóm thuốc có chống chỉ định',
  h3_r1_assess: 'Hình 3 — Đánh giá ban đầu',
  h3_r2_branch: 'Hình 3 — Phân nhánh nguy cơ',
  h3_r3_monotherapy: 'Hình 3 — Đơn trị liệu',
  h3_r4_dual_combination: 'Hình 3 — Phối hợp 2 thuốc',
  h3_r5_triple_combination: 'Hình 3 — Phối hợp 3 thuốc',
  h3_r6_resistant: 'Hình 3 — THA khó kiểm soát, chuyển chuyên gia',
  h4_r1_assess: 'Hình 4 — Đánh giá ban đầu',
  h4_r2_branch: 'Hình 4 — Phân nhánh nguy cơ',
  h4_r3_monotherapy: 'Hình 4 — Đơn trị liệu (viên đơn)',
  h4_r4_spc_dual: 'Hình 4 — Viên phối hợp 2 thuốc',
  h4_r5_spc_triple: 'Hình 4 — Viên phối hợp 3 thuốc',
  h4_r6_resistant: 'Hình 4 — Tăng huyết áp kháng trị, thêm MRA',
  h4_r7_compelling: 'Hình 4 — Chỉ định bắt buộc theo bệnh đồng mắc',
};

export const DOSE_LEVEL_TEXT: Record<string, string> = {
  low: 'Thấp',
  usual: 'Thông thường',
  max: 'Tối đa',
};

export const PILL_FORM_TEXT: Record<string, string> = {
  single_pill: 'Viên phối hợp liều cố định',
  loose: 'Thuốc rời',
};

export const SEVERITY_TEXT: Record<string, string> = {
  info: 'Thông tin',
  warning: 'Cảnh báo',
  contraindication: 'Chống chỉ định',
};

export const SEVERITY_COLOR: Record<string, string> = {
  info: 'gray',
  warning: 'yellow',
  contraindication: 'red',
};

export const PATHWAY_TEXT: Record<string, string> = {
  essential: 'Thiết yếu',
  optimal: 'Tối ưu',
};

export const CONDITION_TEXT: Record<string, string> = {
  gout: 'bệnh gút',
  asthma: 'hen',
  av_block_high_grade: 'block nhĩ thất độ cao',
  bradycardia_hr_under_60: 'nhịp tim chậm (<60 bpm)',
  bilateral_renal_artery_stenosis: 'hẹp động mạch thận hai bên',
  angioedema_history: 'tiền sử phù mạch',
  pregnancy: 'thai kỳ',
  hyperkalemia_over_5_5: 'tăng kali máu (K > 5.5 mmol/L)',
  hyperkalemia: 'tăng kali máu',
  acute_renal_failure_egfr_under_30: 'suy thận cấp (mức lọc cầu thận <30)',
  lvef_under_40: 'EF thất trái <40%',
  metabolic_syndrome: 'hội chứng chuyển hoá',
  glucose_intolerance: 'rối loạn dung nạp glucose',
  tachycardia: 'nhịp tim nhanh',
  hf_reduced_ef_nyha_3_4: 'suy tim EF giảm NYHA 3-4',
  severe_leg_edema: 'phù chân nặng',
  constipation: 'táo bón',
  childbearing_age_no_contraception: 'phụ nữ trong độ tuổi sinh đẻ không dùng biện pháp tránh thai',
  hypercalcemia: 'tăng canxi máu',
  hypokalemia: 'hạ kali máu',
  athlete: 'vận động viên',
};

// Note translation lookup (exact match; fallback to follow-up regex in localize.ts)
export const NOTE_TRANSLATIONS = new Map<string, string>([
  ['Consider SGLT2i or GLP-1 RA for glycemic control with proven CV benefit [Bảng 18, p.32]',
   'Xem xét thêm Ức chế SGLT2 hoặc Đồng vận GLP-1 để kiểm soát đường huyết với lợi ích tim mạch đã được chứng minh [Bảng 18, tr.32]'],
  ['Single-pill combination preferred for adherence', 'Ưu tiên viên phối hợp liều cố định để cải thiện tuân thủ điều trị'],
  ['Single-pill dual combination preferred', 'Ưu tiên viên phối hợp 2 thuốc liều cố định'],
  ['Preferred: A+C or A+D', 'Ưu tiên: ƯCMC/CTTA+CKCa hoặc ƯCMC/CTTA+LT'],
  ['Add loop diuretic if congestion present', 'Thêm lợi tiểu quai nếu có ứ dịch'],
  ['ARNI preferred over ACEi/ARB in HFrEF if tolerated', 'Ưu tiên ARNI hơn ƯCMC/CTTA trong suy tim EF giảm nếu dung nạp được'],
  ['Titrate to maximally tolerated doses', 'Chỉnh liều đến mức dung nạp tối đa'],
  ['Resistant HTN: add MRA (spironolactone preferred, eplerenone if intolerance)', 'THA kháng trị: thêm MRA (ưu tiên Spironolactone, dùng Eplerenone nếu không dung nạp)'],
  ['Monitor eGFR and potassium closely', 'Theo dõi sát mức lọc cầu thận và kali máu'],
  ['If BP still uncontrolled after 1 month → refer specialist', 'Nếu HA chưa kiểm soát sau 1 tháng → chuyển chuyên gia'],
  ['Monitor eGFR and potassium after RAS blocker initiation', 'Theo dõi mức lọc cầu thận và kali máu sau khi khởi trị thuốc ức chế hệ RAS'],
  ['Monitor HbA1c alongside BP management', 'Theo dõi HbA1c song song với quản lý huyết áp'],
  ['Monitor eGFR and urine protein at each visit', 'Theo dõi mức lọc cầu thận và protein niệu tại mỗi lần tái khám'],
  ['Lifestyle changes per Bảng 8 alongside any pharmacotherapy', 'Thay đổi lối sống theo Bảng 8 song song với điều trị thuốc'],
  ['BP below treatment threshold. Continue lifestyle modification.', 'Huyết áp dưới ngưỡng điều trị thuốc. Tiếp tục thay đổi lối sống.'],
  ['Lifestyle changes: sodium restriction, DASH diet, weight management, exercise, alcohol reduction, smoking cessation [Bảng 8]',
   'Thay đổi lối sống: hạn chế muối, chế độ ăn DASH, quản lý cân nặng, tập thể dục, hạn chế rượu, bỏ thuốc lá [Bảng 8]'],
  ['Suspected hypertensive crisis. Out of scope for outpatient pathway.', 'Nghi ngờ cơn tăng huyết áp. Ngoài phạm vi điều trị ngoại trú.'],
  ['Refer to emergency protocol (Bảng 14, p.28).', 'Chuyển theo phác đồ cấp cứu (Bảng 14, tr.28).'],
  ['Do NOT delay: initiate emergency assessment immediately.', 'KHÔNG được trì hoãn: tiến hành đánh giá cấp cứu ngay.'],
  ['Pregnancy management requires the dedicated pregnancy pathway (Bảng 15-16). Not implemented in this prototype.',
   'Quản lý THA trong thai kỳ cần sơ đồ điều trị riêng (Bảng 15-16). Chưa được triển khai trong nguyên mẫu này.'],
  ['Refer to specialist: difficult-to-control (khó kiểm soát) hypertension per Hình 3',
   'Chuyển chuyên gia: tăng huyết áp khó kiểm soát theo Hình 3'],
  ['DBP target 70-79 for CAD without revascularization, age >65',
   'Đích HA tâm trương 70-79 mmHg cho bệnh mạch vành chưa tái thông mạch, tuổi ≥65'],
  ['DBP target 70-79 mmHg (T2D + CAD without revascularization, age ≥ 65) [Bảng 7 footnote, p.16; Bảng 18, p.32]',
   'Đích HA tâm trương 70-79 mmHg (ĐTĐ + BMV chưa tái thông mạch, tuổi ≥65) [Bảng 7 footnote, tr.16; Bảng 18, tr.32]'],
  ['Avoid DBP <70', 'Tránh để HA tâm trương dưới 70 mmHg'],
  ['Beta-blocker mandatory post-MI', 'Chẹn beta bắt buộc sau NMCT'],
  ['ACEi/ARB mandatory post-MI with reduced EF', 'ƯCMC/CTTA bắt buộc sau NMCT với EF giảm'],
  ['Beta-blocker or non-DHP CCB for rate control', 'Chẹn beta hoặc CKCa non-DHP để kiểm soát nhịp'],
  ['Consider stroke risk and anticoagulation', 'Xem xét nguy cơ đột quỵ và chỉ định kháng đông'],
  ['Beta-blocker first-line for angina symptoms', 'Chẹn beta là lựa chọn hàng đầu cho triệu chứng đau thắt ngực'],
  ['Long-acting CCB if beta-blocker not tolerated', 'CKCa tác dụng kéo dài nếu không dung nạp chẹn beta'],
  ['ACEi/ARB mandatory for CKD with proteinuria', 'ƯCMC/CTTA bắt buộc cho BTM có protein niệu'],
  ['Monitor eGFR and K+ after RAS blocker initiation', 'Theo dõi mức lọc cầu thận và K+ sau khi khởi trị ức chế RAS'],
  ['Thiazide less effective if eGFR <30', 'Lợi tiểu thiazide kém hiệu quả khi mức lọc cầu thận <30'],
  ['Initiate/continue antihypertensive therapy in chronic phase', 'Khởi trị/tiếp tục điều trị THA trong giai đoạn mạn tính'],
  ['Acute stroke management is out of scope', 'Xử trí đột quỵ cấp ngoài phạm vi'],
  ['Avoid direct vasodilators as monotherapy', 'Tránh dùng thuốc giãn mạch trực tiếp đơn trị liệu'],
  ['SGLT2i has emerging evidence in HFpEF', 'Ức chế SGLT2 có bằng chứng đang nổi lên trong HFpEF'],
  ['Diuretics for symptom relief if congested', 'Lợi tiểu để giảm triệu chứng nếu ứ dịch'],
  ['All recommended drug classes are contraindicated for this patient. Specialist referral required.',
   'Tất cả nhóm thuốc được khuyến cáo đều có chống chỉ định cho bệnh nhân này. Cần chuyển chuyên gia.'],
  ['MRA contraindicated/cautioned: eGFR <45 or K >4.5', 'MRA chống chỉ định/thận trọng: mức lọc cầu thận <45 hoặc K >4.5'],
  ['Use alternative: alpha-blocker, additional beta-blocker, or loop diuretic',
   'Dùng thay thế: chẹn alpha, thêm chẹn beta, hoặc lợi tiểu quai'],
  ['Refer to specialist if still uncontrolled', 'Chuyển chuyên gia nếu HA vẫn chưa kiểm soát'],
  ['Single-pill triple combination A+C+D at usual dose', 'Viên phối hợp 3 thuốc ƯCMC/CTTA+CKCa+LT liều thông thường'],
  ['Monitor renal function and electrolytes', 'Theo dõi chức năng thận và điện giải'],
  ['Choose single agent based on patient profile', 'Chọn thuốc đơn trị dựa trên đặc điểm bệnh nhân'],
  ['Thiazide-like preferred over thiazide', 'Ưu tiên lợi tiểu giống thiazide hơn thiazide'],
  ['Alternatives: A+B, B+C, B+D, C+D', 'Thay thế: ƯCMC/CTTA+CB, CB+CKCa, CB+LT, CKCa+LT'],
  ['B may be added at any step for compelling indication (HF, angina, post-MI, AF)',
   'Có thể thêm CB ở bất kỳ bước nào nếu có chỉ định bắt buộc (suy tim, đau thắt ngực, sau NMCT, rung nhĩ)'],
  ['HABTC: lifestyle modification for 3-6 months', 'HABTC: thay đổi lối sống 3-6 tháng'],
  ['HABTC with low/intermediate risk: lifestyle modification for 3-6 months before drug consideration',
   'HABTC với nguy cơ thấp/trung bình: thay đổi lối sống 3-6 tháng trước khi xem xét dùng thuốc'],
  ['Single-pill monotherapy low dose', 'Đơn trị liệu viên đơn liều thấp'],
  ['Choose based on patient profile', 'Chọn dựa trên đặc điểm bệnh nhân'],
  ['Monotherapy after lifestyle modification period', 'Đơn trị liệu sau giai đoạn thay đổi lối sống'],
  ['Low-dose monotherapy for elderly/frail', 'Đơn trị liệu liều thấp cho bệnh nhân cao tuổi/suy yếu'],
  ['Low-dose monotherapy for elderly/frail patient', 'Đơn trị liệu liều thấp cho bệnh nhân cao tuổi/suy yếu'],
  ['Titrate cautiously', 'Chỉnh liều thận trọng'],
  ['Escalate to single-pill dual combination', 'Tăng lên viên phối hợp 2 thuốc'],
  ['Single-pill triple combination A+C+D', 'Viên phối hợp 3 thuốc ƯCMC/CTTA+CKCa+LT'],
  ['Escalated to triple combination A+C+D', 'Tăng lên phối hợp 3 thuốc ƯCMC/CTTA+CKCa+LT'],
  ['Escalated from monotherapy to dual combination', 'Tăng từ đơn trị liệu lên phối hợp 2 thuốc'],
  ['Preferred combination: A+C (RAS blocker + CCB) or A+D (RAS blocker + diuretic)',
   'Phối hợp ưu tiên: ƯCMC/CTTA+CKCa hoặc ƯCMC/CTTA+LT'],
  ['Thiazide-like diuretic preferred over thiazide [Hình 3, p.17]',
   'Ưu tiên lợi tiểu giống thiazide hơn thiazide [Hình 3, tr.17]'],
  ['DBP target 70-79 for T2D/CAD without revascularization, age ≥65',
   'Đích HA tâm trương 70-79 mmHg cho ĐTĐ/BMV chưa tái thông mạch, tuổi ≥65'],
]);
