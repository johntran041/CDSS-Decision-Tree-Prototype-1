import { NextResponse } from 'next/server';
import { recommend } from '@/lib/engine-bridge';
import type { PatientContext } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const patient = (await request.json()) as PatientContext;
    const result = recommend(patient);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lỗi không xác định' },
      { status: 400 }
    );
  }
}
