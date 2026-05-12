'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './tree/nodeTypes';
import { hinh3Nodes, hinh3Edges } from './tree/hinh3Graph';
import { hinh4Nodes, hinh4Edges } from './tree/hinh4Graph';
import { computeActiveNodeIds, getCurrentStepNodeId } from '@/lib/activePathFromTrace';
import type { Recommendation } from '@/lib/types';

interface Props {
  recommendation: Recommendation | null;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

const CRISIS_NODES: Node[] = [
  { id: 'crisis_start', position: { x: 200, y: 50 }, data: { label: 'HA ≥ 180/120 mmHg', kind: 'start', ruleId: 'safety_halt_crisis' }, type: 'cdssNode' },
  { id: 'crisis_halt', position: { x: 200, y: 180 }, data: { label: 'Cơn THA\nCấp cứu ngay', kind: 'warn', ruleId: 'safety_halt_crisis' }, type: 'cdssNode' },
];
const CRISIS_EDGES: Edge[] = [
  { id: 'ce1', source: 'crisis_start', target: 'crisis_halt', style: { stroke: '#ef4444', strokeWidth: 3 } },
];

const OOS_NODES: Node[] = [
  { id: 'oos_start', position: { x: 200, y: 50 }, data: { label: 'Bệnh nhân có thai', kind: 'start', ruleId: 'out_of_scope_check' }, type: 'cdssNode' },
  { id: 'oos_end', position: { x: 200, y: 180 }, data: { label: 'Quản lý theo Bảng 15-16\nChuyên khoa sản', kind: 'refer', ruleId: 'out_of_scope_check' }, type: 'cdssNode' },
];
const OOS_EDGES: Edge[] = [
  { id: 'oe1', source: 'oos_start', target: 'oos_end', style: { stroke: '#f97316', strokeWidth: 3 } },
];

const LEGEND = [
  { kind: 'start', color: 'bg-blue-700', label: 'Bắt đầu' },
  { kind: 'decision', color: 'bg-yellow-400', label: 'Quyết định' },
  { kind: 'branch', color: 'bg-yellow-200', label: 'Phân nhánh' },
  { kind: 'action', color: 'bg-emerald-600', label: 'Hành động' },
  { kind: 'leaf', color: 'bg-teal-500', label: 'Chi tiết' },
  { kind: 'warn', color: 'bg-red-500', label: 'Cảnh báo' },
  { kind: 'refer', color: 'bg-purple-600', label: 'Chuyển viện' },
  { kind: 'success', color: 'bg-green-100 border border-green-400', label: 'Đạt đích' },
];

export function DecisionTreeView({ recommendation, selectedNodeId, onNodeSelect }: Props) {
  const [showOnlyActivePath, setShowOnlyActivePath] = useState(false);

  const { baseNodes, baseEdges, autoSelectId } = useMemo(() => {
    if (!recommendation) {
      return { baseNodes: hinh4Nodes, baseEdges: hinh4Edges, autoSelectId: null };
    }
    if (recommendation.status === 'SAFETY_HALT') {
      return { baseNodes: CRISIS_NODES, baseEdges: CRISIS_EDGES, autoSelectId: 'crisis_halt' };
    }
    if (recommendation.status === 'OUT_OF_SCOPE') {
      return { baseNodes: OOS_NODES, baseEdges: OOS_EDGES, autoSelectId: 'oos_end' };
    }
    const isEssential = recommendation.pathwayUsed === 'essential';
    return {
      baseNodes: isEssential ? hinh3Nodes : hinh4Nodes,
      baseEdges: isEssential ? hinh3Edges : hinh4Edges,
      autoSelectId: null,
    };
  }, [recommendation]);

  const activeNodeIds = useMemo(() => {
    if (!recommendation) return new Set<string>();
    return computeActiveNodeIds(recommendation);
  }, [recommendation]);

  const currentStepNodeId = useMemo(() => {
    if (!recommendation) return null;
    return getCurrentStepNodeId(recommendation);
  }, [recommendation]);

  // Use the autoSelectId for special states
  const effectiveSelectedId = autoSelectId ?? selectedNodeId;

  const enrichedNodes = useMemo(() => {
    return baseNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isActive: activeNodeIds.has(n.id),
        isCurrentStep: n.id === currentStepNodeId,
      },
      style: showOnlyActivePath && !activeNodeIds.has(n.id) && n.id !== currentStepNodeId
        ? { opacity: 0.3 }
        : {},
      selected: n.id === effectiveSelectedId,
    }));
  }, [baseNodes, activeNodeIds, currentStepNodeId, showOnlyActivePath, effectiveSelectedId]);

  const [, , onNodesChange] = useNodesState(enrichedNodes);
  const [edges, , onEdgesChange] = useEdgesState(baseEdges);

  // Sync enriched nodes whenever recommendation or selection changes
  const syncedNodes = enrichedNodes;

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (autoSelectId) return; // no manual selection for special states
    onNodeSelect(node.id === effectiveSelectedId ? null : node.id);
  }, [effectiveSelectedId, onNodeSelect, autoSelectId]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          {recommendation && (
            <span className="text-xs text-slate-500 font-medium">
              Sơ đồ: {recommendation.pathwayUsed === 'essential' ? 'Thiết yếu (Hình 3)' : 'Tối ưu (Hình 4)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyActivePath}
              onChange={e => setShowOnlyActivePath(e.target.checked)}
              className="rounded text-blue-600"
            />
            Chỉ hiện đường đi
          </label>
          {/* Legend */}
          <div className="hidden md:flex items-center gap-2">
            {LEGEND.map(l => (
              <div key={l.kind} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${l.color} shrink-0`} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* React Flow canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={syncedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="#e2e8f0" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
