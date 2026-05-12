'use client';

import { useState, useCallback } from 'react';
import { PatientForm } from '@/components/PatientForm';
import { FixturePicker } from '@/components/FixturePicker';
import { DecisionTreeView } from '@/components/DecisionTreeView';
import { TreeNodeDetail } from '@/components/TreeNodeDetail';
import type { PatientContext, Recommendation } from '@/lib/types';
import type { LocalizedRecommendation } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

type InputMode = 'fixture' | 'manual';

interface ApiResult {
  raw: Recommendation;
  localized: LocalizedRecommendation;
  error?: string;
}

export default function HomePage() {
  const [inputMode, setInputMode] = useState<InputMode>('fixture');
  const [selectedPatient, setSelectedPatient] = useState<PatientContext | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const runRecommendation = useCallback(async (patient: PatientContext) => {
    setLoading(true);
    setApiError(null);
    setSelectedNodeId(null);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      });
      const data = await response.json() as ApiResult;
      if (data.error) {
        setApiError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Lỗi kết nối');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFixtureSelect = useCallback((patient: PatientContext) => {
    setSelectedPatient(patient);
    runRecommendation(patient);
  }, [runRecommendation]);

  const handleFormSubmit = useCallback((patient: PatientContext) => {
    setSelectedPatient(patient);
    runRecommendation(patient);
  }, [runRecommendation]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-slate-800">Hệ thống Hỗ trợ Quyết định Lâm sàng</h1>
            <span className="text-slate-400 text-sm hidden sm:inline">·</span>
            <span className="text-base font-semibold text-blue-700">Tăng huyết áp — VSH/VNHA 2022</span>
            <span className="text-slate-400 text-sm hidden md:inline">·</span>
            <span className="text-xs text-slate-500 hidden md:inline">Phối hợp AstraZeneca Việt Nam · RawNoodles · RMIT Vietnam</span>
          </div>
        </div>
        <div className="px-4 pb-2 flex items-center gap-2 bg-yellow-50 border-t border-yellow-200 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-800">
            Đây là nguyên mẫu chỉ phục vụ mục đích nghiên cứu và trình bày. Không sử dụng cho điều trị lâm sàng thực tế.
          </p>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Form */}
        <aside className="w-80 min-w-64 max-w-96 border-r border-slate-200 bg-white flex flex-col overflow-hidden shrink-0">
          {/* Input mode toggle */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
              <button
                onClick={() => setInputMode('fixture')}
                className={`flex-1 py-1.5 font-medium transition-colors text-xs ${inputMode === 'fixture' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Chọn từ fixture
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-1.5 font-medium transition-colors text-xs ${inputMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Nhập thủ công
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Fixture picker */}
            {inputMode === 'fixture' && (
              <FixturePicker onSelect={handleFixtureSelect} />
            )}

            {/* Error display */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <strong>Lỗi:</strong> {apiError}
              </div>
            )}

            {/* Patient form — visible in manual mode; readonly preview in fixture mode */}
            {(inputMode === 'manual' || selectedPatient) && (
              <div className={inputMode === 'fixture' ? 'opacity-75 pointer-events-none' : ''}>
                {inputMode === 'fixture' && selectedPatient && (
                  <p className="text-xs text-slate-500 mb-2 font-medium">Dữ liệu đã tải từ fixture:</p>
                )}
                <PatientForm
                  initialData={selectedPatient}
                  onSubmit={handleFormSubmit}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Center panel: Decision tree */}
        <main className="flex-1 min-w-0 overflow-hidden bg-slate-50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-slate-400 text-sm">Đang tính khuyến cáo…</div>
            </div>
          ) : (
            <DecisionTreeView
              recommendation={result?.raw ?? null}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
            />
          )}
        </main>

        {/* Right panel: Detail */}
        <aside className="w-72 min-w-60 max-w-80 border-l border-slate-200 bg-white shrink-0 overflow-hidden">
          <div className="h-full">
            <TreeNodeDetail
              localized={result?.localized ?? null}
              selectedNodeId={selectedNodeId}
              onDeselect={() => setSelectedNodeId(null)}
            />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-400 flex items-center justify-between">
        <span>Nguyên mẫu CDSS — RawNoodles, RMIT Việt Nam</span>
        <span>Bản quyền nguồn: VSH/VNHA 2022 · Mọi quy tắc đều trích dẫn nguyên văn từ tài liệu nguồn</span>
      </footer>
    </div>
  );
}
