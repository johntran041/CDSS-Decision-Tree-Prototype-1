'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface NodeData {
  label: string;
  kind: 'start' | 'decision' | 'branch' | 'action' | 'leaf' | 'warn' | 'refer' | 'success';
  ruleId: string;
}

interface CdssNodeProps {
  data: NodeData;
  selected: boolean;
  id: string;
  // injected by parent via ReactFlow node data
  isActive?: boolean;
  isCurrentStep?: boolean;
}

const KIND_STYLES: Record<NodeData['kind'], string> = {
  start:    'bg-blue-700 text-white border-blue-900',
  decision: 'bg-yellow-400 text-slate-900 border-yellow-600',
  branch:   'bg-yellow-200 text-slate-800 border-yellow-400',
  action:   'bg-emerald-600 text-white border-emerald-800',
  leaf:     'bg-teal-500 text-white border-teal-700',
  warn:     'bg-red-500 text-white border-red-700',
  refer:    'bg-purple-600 text-white border-purple-800',
  success:  'bg-green-100 text-green-900 border-green-400',
};

const ACTIVE_RING: Record<NodeData['kind'], string> = {
  start:    'ring-2 ring-blue-400 ring-offset-1',
  decision: 'ring-2 ring-yellow-500 ring-offset-1',
  branch:   'ring-2 ring-yellow-500 ring-offset-1',
  action:   'ring-2 ring-emerald-400 ring-offset-1',
  leaf:     'ring-2 ring-cyan-400 ring-offset-1',
  warn:     'ring-2 ring-red-400 ring-offset-1',
  refer:    'ring-2 ring-purple-400 ring-offset-1',
  success:  'ring-2 ring-green-500 ring-offset-1',
};

const CURRENT_STEP_RING: Record<NodeData['kind'], string> = {
  start:    'ring-4 ring-blue-300 shadow-lg shadow-blue-200',
  decision: 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-100',
  branch:   'ring-4 ring-yellow-400 shadow-lg shadow-yellow-100',
  action:   'ring-4 ring-emerald-300 shadow-lg shadow-emerald-100',
  leaf:     'ring-4 ring-cyan-300 shadow-lg shadow-cyan-100',
  warn:     'ring-4 ring-red-300 shadow-lg shadow-red-100',
  refer:    'ring-4 ring-purple-300 shadow-lg shadow-purple-100',
  success:  'ring-4 ring-green-400 shadow-lg shadow-green-100',
};

function CdssNodeComponent({ data, selected }: CdssNodeProps) {
  // isActive and isCurrentStep are passed via data (not props) for custom nodes
  const isActive = (data as NodeData & { isActive?: boolean }).isActive ?? false;
  const isCurrentStep = (data as NodeData & { isCurrentStep?: boolean }).isCurrentStep ?? false;

  const baseStyle = KIND_STYLES[data.kind] ?? 'bg-slate-200 text-slate-900 border-slate-400';
  const activeStyle = isCurrentStep
    ? CURRENT_STEP_RING[data.kind] ?? ''
    : isActive
      ? ACTIVE_RING[data.kind] ?? ''
      : '';
  const dimStyle = !isActive && !isCurrentStep ? '' : '';

  const isLeafOrEnd = data.kind === 'leaf' || data.kind === 'success';
  const isStart = data.kind === 'start';

  return (
    <div
      className={`
        relative border-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-150
        min-w-[180px] max-w-[220px] text-center text-sm leading-snug font-medium
        ${baseStyle}
        ${activeStyle}
        ${selected ? 'outline outline-2 outline-white outline-offset-2' : ''}
        ${dimStyle}
        whitespace-pre-line
      `}
      title={`ruleId: ${data.ruleId}`}
    >
      {!isStart && <Handle type="target" position={Position.Top} className="!bg-slate-400" />}
      {data.label}
      {!isLeafOrEnd && <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />}
    </div>
  );
}

export const CdssNode = memo(CdssNodeComponent);

export const nodeTypes = {
  cdssNode: CdssNode,
};
