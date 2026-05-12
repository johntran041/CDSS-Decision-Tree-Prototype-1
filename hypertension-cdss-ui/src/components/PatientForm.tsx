'use client';

import { useState, useEffect } from 'react';
import type { PatientContext, CKDStage, DrugClassCode } from '@/lib/types';

interface Props {
  initialData?: PatientContext | null;
  onSubmit: (p: PatientContext) => void;
  loading?: boolean;
}

const DEFAULT_PATIENT: PatientContext = {
  patientId: 'BN_001',
  ageYears: 60,
  sex: 'male',
  officeSBP: 150,
  officeDBP: 95,
  siteConfig: { pathwayMode: 'optimal' },
};

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-3 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, placeholder }: { value: number | undefined; onChange: (v: number | undefined) => void; min?: number; max?: number; placeholder?: string }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

function CheckInput({ checked, onChange, label }: { checked: boolean | undefined; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}

export function PatientForm({ initialData, onSubmit, loading }: Props) {
  const [p, setP] = useState<PatientContext>(initialData ?? DEFAULT_PATIENT);

  useEffect(() => {
    if (initialData) setP(initialData);
  }, [initialData]);

  function set<K extends keyof PatientContext>(key: K, value: PatientContext[K]) {
    setP(prev => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setP(DEFAULT_PATIENT);
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(p); }}
      className="space-y-3"
    >
      {/* Section 1: Basic info — always visible */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 text-sm font-semibold text-slate-700">
          Thông tin cơ bản
        </div>
        <div className="px-4 py-3 space-y-3 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã bệnh nhân">
              <input
                type="text"
                value={p.patientId}
                onChange={e => set('patientId', e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Tuổi (năm)">
              <NumberInput value={p.ageYears} onChange={v => set('ageYears', v ?? 60)} min={18} max={120} />
            </Field>
          </div>
          <Field label="Giới tính">
            <div className="flex gap-4">
              {(['male', 'female'] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={p.sex === s} onChange={() => set('sex', s)} className="text-blue-600" />
                  {s === 'male' ? 'Nam' : 'Nữ'}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="HATT (mmHg)">
              <NumberInput value={p.officeSBP} onChange={v => set('officeSBP', v ?? 140)} min={60} max={300} />
            </Field>
            <Field label="HATTr (mmHg)">
              <NumberInput value={p.officeDBP} onChange={v => set('officeDBP', v ?? 90)} min={40} max={200} />
            </Field>
          </div>
          <Field label="Chế độ phác đồ">
            <div className="flex gap-4">
              {(['essential', 'optimal'] as const).map(mode => (
                <label key={mode} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={p.siteConfig.pathwayMode === mode}
                    onChange={() => set('siteConfig', { pathwayMode: mode })}
                    className="text-blue-600"
                  />
                  {mode === 'essential' ? 'Thiết yếu' : 'Tối ưu'}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <Section title="Yếu tố nguy cơ">
        <Field label="Nhịp tim (bpm)">
          <NumberInput value={p.heartRateBpm} onChange={v => set('heartRateBpm', v)} min={30} max={200} placeholder="Không bắt buộc" />
        </Field>
        <CheckInput checked={p.isOverweight} onChange={v => set('isOverweight', v)} label="Thừa cân / béo phì" />
        <CheckInput checked={p.isSmoker} onChange={v => set('isSmoker', v)} label="Hút thuốc lá" />
        <CheckInput checked={p.hasFamilyHistoryCVD} onChange={v => set('hasFamilyHistoryCVD', v)} label="Tiền sử gia đình bệnh tim mạch" />
        <CheckInput checked={p.hasFamilyHistoryHTN} onChange={v => set('hasFamilyHistoryHTN', v)} label="Tiền sử gia đình tăng huyết áp" />
        {p.sex === 'female' && (
          <CheckInput checked={p.hasEarlyMenopause} onChange={v => set('hasEarlyMenopause', v)} label="Mãn kinh sớm" />
        )}
        <CheckInput checked={p.hasElevatedLDLOrTriglycerides} onChange={v => set('hasElevatedLDLOrTriglycerides', v)} label="Tăng LDL hoặc triglycerides" />
      </Section>

      <Section title="Bệnh đồng mắc">
        <CheckInput checked={p.hasDiabetesType2} onChange={v => set('hasDiabetesType2', v)} label="Đái tháo đường týp 2" />
        <CheckInput checked={p.hasASCVD} onChange={v => set('hasASCVD', v)} label="Bệnh tim mạch do xơ vữa (ASCVD)" />
        <CheckInput checked={p.hasCAD} onChange={v => set('hasCAD', v)} label="Bệnh mạch vành (BMV)" />
        {p.hasCAD && (
          <div className="ml-4">
            <CheckInput checked={p.hasRevascularization} onChange={v => set('hasRevascularization', v)} label="Đã tái thông mạch vành" />
          </div>
        )}
        <CheckInput checked={p.hasPostMI} onChange={v => set('hasPostMI', v)} label="Sau nhồi máu cơ tim (NMCT)" />
        <CheckInput checked={p.hasHeartFailure} onChange={v => set('hasHeartFailure', v)} label="Suy tim" />
        {p.hasHeartFailure && (
          <div className="ml-4">
            <Field label="EF thất trái (%)">
              <NumberInput value={p.hfrefEjectionFraction} onChange={v => set('hfrefEjectionFraction', v)} min={10} max={80} placeholder="Nhập EF%" />
            </Field>
          </div>
        )}
        <CheckInput checked={p.hasLVH} onChange={v => set('hasLVH', v)} label="Phì đại thất trái (LVH)" />
        <CheckInput checked={p.hasPostStroke} onChange={v => set('hasPostStroke', v)} label="Sau đột quỵ" />
        <CheckInput checked={p.hasAtrialFibrillation} onChange={v => set('hasAtrialFibrillation', v)} label="Rung nhĩ" />
        <CheckInput checked={p.hasAngina} onChange={v => set('hasAngina', v)} label="Đau thắt ngực" />
        <Field label="Bệnh thận mạn — Giai đoạn">
          <select
            value={p.ckdStage ?? 'none'}
            onChange={e => set('ckdStage', e.target.value as CKDStage)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="none">Không</option>
            <option value="stage_1">Giai đoạn 1</option>
            <option value="stage_2">Giai đoạn 2</option>
            <option value="stage_3">Giai đoạn 3</option>
            <option value="stage_4">Giai đoạn 4</option>
            <option value="stage_5">Giai đoạn 5</option>
            <option value="dialysis">Lọc máu</option>
            <option value="transplant">Sau ghép thận</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="mLCCT (mL/min)">
            <NumberInput value={p.egfrMlMin} onChange={v => set('egfrMlMin', v)} min={0} max={150} placeholder="eGFR" />
          </Field>
          <Field label="Kali máu (mmol/L)">
            <NumberInput value={p.potassiumMmolL} onChange={v => set('potassiumMmolL', v)} min={1} max={10} placeholder="K+" />
          </Field>
        </div>
        <CheckInput checked={p.hasTargetOrganDamage} onChange={v => set('hasTargetOrganDamage', v)} label="Tổn thương cơ quan đích (TOD)" />
      </Section>

      <Section title="Trạng thái đặc biệt">
        {p.sex === 'female' && (
          <CheckInput checked={p.isPregnant} onChange={v => set('isPregnant', v)} label="Có thai" />
        )}
        <CheckInput checked={p.isFrail} onChange={v => set('isFrail', v)} label="Suy yếu / hội chứng lão hoá" />
      </Section>

      <Section title="Chống chỉ định">
        <CheckInput checked={p.hasGout} onChange={v => set('hasGout', v)} label="Bệnh gút" />
        <CheckInput checked={p.hasAsthma} onChange={v => set('hasAsthma', v)} label="Hen" />
        <CheckInput checked={p.hasAVBlock} onChange={v => set('hasAVBlock', v)} label="Block nhĩ thất" />
        <CheckInput checked={p.hasBilateralRenalArteryStenosis} onChange={v => set('hasBilateralRenalArteryStenosis', v)} label="Hẹp động mạch thận hai bên" />
        <CheckInput checked={p.hasAngioedemaHistory} onChange={v => set('hasAngioedemaHistory', v)} label="Tiền sử phù mạch" />
      </Section>

      <Section title="Lịch sử điều trị">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tháng TĐLS">
            <NumberInput value={p.monthsOnLifestyleChange} onChange={v => set('monthsOnLifestyleChange', v)} min={0} placeholder="Tháng" />
          </Field>
          <Field label="Tháng phác đồ hiện tại">
            <NumberInput value={p.monthsOnCurrentRegimen} onChange={v => set('monthsOnCurrentRegimen', v)} min={0} placeholder="Tháng" />
          </Field>
        </div>
        <Field label="HA đã đạt đích?">
          <div className="flex gap-4">
            {[{ v: true, l: 'Có' }, { v: false, l: 'Chưa' }, { v: undefined, l: 'N/A' }].map(({ v, l }) => (
              <label key={l} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={p.bpAtTargetCurrentRegimen === v}
                  onChange={() => set('bpAtTargetCurrentRegimen', v)}
                  className="text-blue-600"
                />
                {l}
              </label>
            ))}
          </div>
        </Field>
        {/* Current medications */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Thuốc đang dùng</label>
          <div className="space-y-2">
            {(p.currentMedications ?? []).map((med, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded p-2">
                <select
                  value={med.classCode}
                  onChange={e => {
                    const meds = [...(p.currentMedications ?? [])];
                    meds[i] = { ...meds[i], classCode: e.target.value as DrugClassCode };
                    set('currentMedications', meds);
                  }}
                  className="rounded border border-slate-300 px-1 py-1 text-xs w-16"
                >
                  {(['A', 'B', 'C', 'D', 'MRA', 'loop'] as DrugClassCode[]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tên thuốc"
                  value={med.drugName}
                  onChange={e => {
                    const meds = [...(p.currentMedications ?? [])];
                    meds[i] = { ...meds[i], drugName: e.target.value };
                    set('currentMedications', meds);
                  }}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
                />
                <select
                  value={med.doseLevel}
                  onChange={e => {
                    const meds = [...(p.currentMedications ?? [])];
                    meds[i] = { ...meds[i], doseLevel: e.target.value as 'low' | 'usual' | 'max' };
                    set('currentMedications', meds);
                  }}
                  className="rounded border border-slate-300 px-1 py-1 text-xs w-24"
                >
                  <option value="low">Thấp</option>
                  <option value="usual">Thông thường</option>
                  <option value="max">Tối đa</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const meds = (p.currentMedications ?? []).filter((_, j) => j !== i);
                    set('currentMedications', meds.length > 0 ? meds : undefined);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs px-1"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const meds = [...(p.currentMedications ?? []), { classCode: 'A' as DrugClassCode, drugName: '', doseLevel: 'usual' as const }];
              set('currentMedications', meds);
            }}
            className="mt-2 text-blue-600 text-xs hover:text-blue-800 font-medium"
          >
            + Thêm thuốc
          </button>
        </div>
      </Section>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Đang tính…' : 'Tính khuyến cáo'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Đặt lại
        </button>
      </div>
    </form>
  );
}
