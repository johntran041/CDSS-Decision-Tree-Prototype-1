'use client';

import type { LocalizedRecommendation, LocalizedTraceEntry } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { ChevronLeft, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

interface Props {
  localized: LocalizedRecommendation | null;
  selectedNodeId: string | null;
  onDeselect: () => void;
}

function SeverityIcon({ color }: { color: string }) {
  if (color === 'red') return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
  if (color === 'yellow') return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
  return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
}

function TraceDetail({ entry, active }: { entry: LocalizedTraceEntry; active: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="invisible" aria-hidden />
        {active
          ? <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3 h-3" /> Đã kích hoạt
            </span>
          : <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              Không kích hoạt
            </span>
        }
      </div>

      <div>
        <div className="font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 inline-block">{entry.ruleId}</div>
        <h2 className="text-base font-semibold text-slate-800 mt-1">{entry.ruleNameText}</h2>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded px-2 py-0.5">{entry.sourceText}</span>
      </div>

      {entry.verbatimQuote && (
        <div className="border-l-4 border-blue-400 bg-slate-50 rounded-r-lg p-3">
          <p className="text-sm italic text-slate-700 leading-relaxed">❝ {entry.verbatimQuote} ❞</p>
          <p className="text-xs text-right text-slate-400 mt-1">— {entry.sourceText}</p>
        </div>
      )}

      {entry.inputSummary && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Đầu vào</div>
          <div className="font-mono text-xs text-slate-600 bg-slate-50 rounded p-2 break-all">{entry.inputSummary}</div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Đầu ra</div>
        <div className="font-mono text-sm font-medium text-slate-800 bg-emerald-50 rounded p-2">{entry.outputSummary}</div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Lý luận</div>
        <p className="text-sm text-slate-700 leading-relaxed">{entry.reasoningText}</p>
      </div>
    </div>
  );
}

function RecommendationSummary({ loc }: { loc: LocalizedRecommendation }) {
  const showDrugs = loc.raw.drugRecommendation !== undefined;
  const visibleNotes = loc.drugNotes.slice(0, 4);

  return (
    <div className="space-y-4">
      <div>
        <StatusBadge
          status={loc.raw.status}
          badge={loc.statusBadge}
          text={loc.statusText}
          color={loc.statusColor}
          size="lg"
        />
      </div>

      {/* BP Category + Risk */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-medium">{loc.bpCategoryText}</span>
        <span className="text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1 font-medium">Nguy cơ: {loc.cvRiskText}</span>
        {loc.raw.pathwayUsed && (
          <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1 font-medium">{loc.pathwayText}</span>
        )}
      </div>

      {/* Threshold + Target */}
      {loc.thresholdText && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngưỡng & Đích điều trị</div>
          <div className="text-sm text-slate-700"><span className="font-medium">Ngưỡng:</span> {loc.thresholdText}</div>
          <div className="text-sm text-slate-700"><span className="font-medium">Đích:</span> {loc.targetText}</div>
        </div>
      )}

      {/* Drug recommendation */}
      {showDrugs && loc.drugClassNames && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thuốc đề xuất</div>
          <div className="flex flex-wrap gap-1.5">
            {loc.drugClassNames.map((name, i) => (
              <span key={i} className="text-xs bg-emerald-100 text-emerald-800 rounded px-2 py-0.5 font-medium">{name}</span>
            ))}
          </div>
          {loc.raw.drugRecommendation?.doseLevel && (
            <div className="text-xs text-slate-600">
              Liều: <span className="font-medium">{
                loc.raw.drugRecommendation.doseLevel === 'low' ? 'Thấp' :
                loc.raw.drugRecommendation.doseLevel === 'usual' ? 'Thông thường' : 'Tối đa'
              }</span>
              {loc.raw.drugRecommendation.pillForm && (
                <> · Dạng: <span className="font-medium">{loc.raw.drugRecommendation.pillForm === 'single_pill' ? 'Viên phối hợp' : 'Thuốc rời'}</span></>
              )}
            </div>
          )}
          {visibleNotes.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
              {visibleNotes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Safety alerts */}
      {loc.safetyAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cảnh báo an toàn</div>
          <div className="space-y-1.5">
            {loc.safetyAlerts.map((alert, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-50 rounded p-2 border border-slate-100">
                <SeverityIcon color={alert.severityColor} />
                <div>
                  <span className="text-xs font-semibold">[{alert.severityText}]</span>{' '}
                  <span className="text-xs text-slate-700">{alert.reasonText}</span>
                  <div className="text-xs text-slate-400 mt-0.5">{alert.sourceText}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidance */}
      {(loc.guidanceMessages.length > 0 || loc.followUpText) && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hướng dẫn</div>
          <ul className="text-xs text-slate-700 space-y-0.5 list-disc list-inside">
            {loc.guidanceMessages.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
          {loc.followUpText && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
              <Clock className="w-3 h-3" />
              {loc.followUpText}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
        Nhấp vào bất kỳ nút nào trên cây quyết định để xem chi tiết quy tắc.
      </p>
    </div>
  );
}

export function TreeNodeDetail({ localized, selectedNodeId, onDeselect }: Props) {
  if (!localized) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-sm text-slate-400 text-center">Chọn một bệnh nhân hoặc nhập thông tin bệnh nhân để xem khuyến cáo</p>
      </div>
    );
  }

  if (selectedNodeId) {
    // Find the trace entry for this node (match by ruleId, some nodes share ruleIds)
    const entry = localized.trace.find(t => t.ruleId === selectedNodeId);

    return (
      <div className="h-full overflow-y-auto p-4">
        <button
          onClick={onDeselect}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại tóm tắt
        </button>

        {entry ? (
          <TraceDetail entry={entry} active={true} />
        ) : (
          <div className="space-y-3">
            <div className="font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 py-1 inline-block">{selectedNodeId}</div>
            <h2 className="text-base font-semibold text-slate-700">Quy tắc chưa kích hoạt</h2>
            <div className="flex items-center">
              <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                Quy tắc này không kích hoạt cho bệnh nhân hiện tại.
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Quy tắc <code className="font-mono bg-slate-100 px-1 rounded">{selectedNodeId}</code> không thuộc vết suy luận của bệnh nhân này.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <RecommendationSummary loc={localized} />
    </div>
  );
}
