# Clinical Ambiguities — VSH/VNHA 2022 Interpretation

This file lists places where the document text could reasonably support more than one interpretation. The CDSS engine encodes the most clinically conservative interpretation by default. Each entry must be reviewed with Dr. Huy Nhat (industry supervisor) before production deployment.

## A1. DBP threshold 85 vs 90 for HF and LVH (18-69 age group)

- **Source:** Bảng 6, p. 15 footnote
- **Footnote text:** "≥ 85mmHg cho bệnh nhân 18-69 tuổi có THA nguy cơ cao, Đái tháo đường, Bệnh thận mạn, Bệnh mạch vành, Đột quỵ/TIA"
- **Question:** The footnote enumerates T2D, CKD, CAD, stroke/TIA but does not literally include HF or LVH.
- **Engine choice:** Treat HF and LVH as DBP ≥ 85 (more aggressive), based on Bảng 20 stating HF DBP target < 80.
- **To confirm:** Should HF and LVH have DBP threshold 85 like T2D/CAD/CKD/stroke, or 90 like the default?

## A2. T2D + CAD DBP 70-79 age boundary (> 65 vs ≥ 70)

- **Source 1:** Bảng 7, p. 16 footnote: "*THA + ĐTĐ týp 2 / BMV: Mục tiêu HATTr ở bệnh nhân > 65 tuổi không điều trị tái tưới máu là 70 – 79 mmHg"
- **Source 2:** Bảng 18, p. 32: "Ở bệnh nhân THA kèm ĐTĐ ≥ 70 tuổi, mục tiêu HATT là 130 - 139 mmHg, có thể thấp hơn nếu dung nạp được, mục tiêu HATTr là 70 - 79 mmHg nếu có bệnh mạch vành không được tái tưới máu"
- **Question:** Bảng 7 says > 65 years; Bảng 18 says ≥ 70 years. Which applies?
- **Engine choice:** Use ≥ 65 (most inclusive interpretation, safer fallback — catches more patients).
- **To confirm:** Which threshold should the engine apply?

## A3. Resistant HTN detection — minimum duration on triple therapy

- **Source:** Section 3.6.1, p. 24 — "Liều tối ưu (hoặc liều dung nạp tốt nhất) của một chiến lược điều trị thích hợp, trong đó có thuốc lợi tiểu (điển hình là phối hợp thuốc ức chế men chuyển hoặc chẹn thụ thể Angiotensin II với chẹn kênh canxi và lợi tiểu thiazide / thiazide-like), nhưng không làm giảm HATT và/hoặc HATTr tương ứng xuống <140mmHg và/hoặc 90mmHg"
- **Engine choice:** Detect resistant HTN when patient has A + C + D at usual dose AND bpAtTargetCurrentRegimen === false AND monthsOnCurrentRegimen >= 1. Minimum duration of 1 month is a conservative default.
- **To confirm:** Is 1 month minimum reasonable, or should it be 2+ months?

## A4. ARNI vs ACEi/ARB first-line in HFrEF

- **Source:** Bảng 20, p. 34: "ƯCMC hoặc CTTA / ARNI" — listed as Class I, A.
- **Engine choice:** ARNI is preferred when tolerated, but ACEi/ARB is a valid alternative. Both are included in the recipe.
- **To confirm:** Should the engine actively recommend ARNI as first-line over ACEi/ARB in HFrEF, or treat them as equivalent?

## A5. HABTC + low/intermediate risk: minimum lifestyle duration before starting drugs (3 vs 6 months)

- **Source:** Hình 4 footnote: "Xem xét đơn trị liệu ở HABTC có nguy cơ thấp TB sau 3 - 6 tháng TĐLS không kiểm soát HA, hoặc bn ≥ 80 tuổi, hội chứng lão hoá."
- **Engine choice:** Use 3 months as the trigger (minimum from "3-6"), so monthsOnLifestyleChange >= 3 → prescribe.
- **To confirm:** Should the threshold be 3 months (minimum) or 6 months (maximum)?
