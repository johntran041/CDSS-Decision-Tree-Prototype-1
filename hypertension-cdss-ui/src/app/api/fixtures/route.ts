import { NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { PatientContext } from '@/lib/types';

const FIXTURES_DIR = resolve(process.cwd(), '../hypertension-cdss-prototype/fixtures');

interface FixtureEntry {
  filename: string;
  patientId: string;
  ageYears: number;
  sex: 'male' | 'female';
  pathwayMode: 'essential' | 'optimal';
  summary: string;
  data: PatientContext;
}

export async function GET() {
  try {
    const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json')).sort();
    const fixtures: FixtureEntry[] = files.map(f => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = JSON.parse(readFileSync(resolve(FIXTURES_DIR, f), 'utf-8')) as any;
      const { _expected, ...patient } = raw;
      void _expected;
      return {
        filename: f,
        patientId: patient.patientId,
        ageYears: patient.ageYears,
        sex: patient.sex,
        pathwayMode: patient.siteConfig?.pathwayMode ?? 'optimal',
        summary: buildVietnameseSummary(patient),
        data: patient as PatientContext,
      };
    });
    return NextResponse.json(fixtures);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVietnameseSummary(p: any): string {
  const parts: string[] = [];
  if (p.hasHeartFailure) parts.push(`Suy tim${p.hfrefEjectionFraction !== undefined ? ` EF ${p.hfrefEjectionFraction}%` : ''}`);
  if (p.hasDiabetesType2) parts.push('ĐTĐ');
  if (p.hasCAD) parts.push('BMV');
  if (p.hasPostMI) parts.push('Sau NMCT');
  if (p.hasPostStroke) parts.push('Sau đột quỵ');
  if (p.hasAtrialFibrillation) parts.push('Rung nhĩ');
  if (p.hasAngina) parts.push('Đau thắt ngực');
  if (p.hasLVH) parts.push('Phì đại TT');
  if (p.ckdStage && p.ckdStage !== 'none') parts.push(`BTM ${p.ckdStage}`);
  if (p.isPregnant) parts.push('Có thai');
  if (p.isFrail) parts.push('Suy yếu');
  if (p.officeSBP >= 180 || p.officeDBP >= 120) parts.push('Cơn THA');
  if (p.hasGout) parts.push('Bệnh gút');
  if (p.hasAsthma) parts.push('Hen');
  if (p.potassiumMmolL && p.potassiumMmolL > 5.5) parts.push('Tăng kali máu');
  if (parts.length === 0) parts.push('THA đơn giản');
  parts.push(p.siteConfig?.pathwayMode === 'essential' ? 'Thiết yếu' : 'Tối ưu');
  return parts.join(', ');
}
