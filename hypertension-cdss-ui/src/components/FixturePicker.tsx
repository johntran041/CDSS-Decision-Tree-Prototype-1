'use client';

import { useEffect, useState } from 'react';
import type { PatientContext } from '@/lib/types';

interface FixtureEntry {
  filename: string;
  patientId: string;
  ageYears: number;
  sex: 'male' | 'female';
  pathwayMode: 'essential' | 'optimal';
  summary: string;
  data: PatientContext;
}

interface Props {
  onSelect: (patient: PatientContext, summary: string) => void;
}

export function FixturePicker({ onSelect }: Props) {
  const [fixtures, setFixtures] = useState<FixtureEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then((data: FixtureEntry[] | { error: string }) => {
        if ('error' in data) {
          setError(data.error);
        } else {
          setFixtures(data);
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 text-sm py-2">Đang tải fixture…</div>;
  if (error) return <div className="text-red-600 text-sm py-2">Lỗi: {error}</div>;

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
        Chọn fixture bệnh nhân
      </label>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        defaultValue=""
        onChange={e => {
          const f = fixtures.find(x => x.filename === e.target.value);
          if (f) onSelect(f.data, f.summary);
        }}
      >
        <option value="" disabled>-- Chọn bệnh nhân --</option>
        {fixtures.map(f => (
          <option key={f.filename} value={f.filename}>
            {f.patientId} — {f.ageYears} tuổi, {f.sex === 'male' ? 'Nam' : 'Nữ'} — {f.summary}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500 mt-1">{fixtures.length} fixture có sẵn</p>
    </div>
  );
}
