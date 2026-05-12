import type { Node, Edge } from 'reactflow';

export const hinh3Nodes: Node[] = [
  { id: 'h3_start', position: { x: 300, y: 0 }, data: { label: 'HA phòng khám ≥ 130/85 mmHg\nTuổi > 18', kind: 'start', ruleId: 'h3_r1_assess' }, type: 'cdssNode' },
  { id: 'h3_assess', position: { x: 300, y: 100 }, data: { label: 'Đánh giá toàn diện\n+ Cá thể hoá điều trị', kind: 'decision', ruleId: 'h3_r1_assess' }, type: 'cdssNode' },
  { id: 'h3_branch_low', position: { x: 60, y: 230 }, data: { label: 'HABTC\n+ Nguy cơ Thấp/TB', kind: 'branch', ruleId: 'h3_r2_branch' }, type: 'cdssNode' },
  { id: 'h3_branch_high', position: { x: 540, y: 230 }, data: { label: 'HABTC + Nguy cơ Cao\nhoặc BTMXV/BTM/ĐTĐ\nhoặc THA ≥ 140/90', kind: 'branch', ruleId: 'h3_r2_branch' }, type: 'cdssNode' },
  { id: 'h3_mono', position: { x: 60, y: 380 }, data: { label: 'Đơn trị liệu\nA, B, C hoặc D\n(liều thấp)', kind: 'action', ruleId: 'h3_r3_monotherapy' }, type: 'cdssNode' },
  { id: 'h3_dual', position: { x: 540, y: 380 }, data: { label: 'Phối hợp 2 thuốc\nƯu tiên A+C hoặc A+D\n(liều thấp → thông thường)', kind: 'action', ruleId: 'h3_r4_dual_combination' }, type: 'cdssNode' },
  { id: 'h3_triple', position: { x: 540, y: 530 }, data: { label: 'Phối hợp 3 thuốc\nA+C+D\n(liều thông thường)', kind: 'action', ruleId: 'h3_r5_triple_combination' }, type: 'cdssNode' },
  { id: 'h3_resistant', position: { x: 540, y: 680 }, data: { label: 'THA khó kiểm soát (KKS)', kind: 'warn', ruleId: 'h3_r6_resistant' }, type: 'cdssNode' },
  { id: 'h3_refer', position: { x: 540, y: 800 }, data: { label: 'Chuyển BV hoặc\ntrung tâm tim mạch\ntham vấn chuyên gia', kind: 'refer', ruleId: 'h3_r6_resistant' }, type: 'cdssNode' },
  { id: 'h3_maintain', position: { x: 300, y: 940 }, data: { label: 'Đạt đích — Theo dõi', kind: 'success', ruleId: 'h3_maintain' }, type: 'cdssNode' },
];

export const hinh3Edges: Edge[] = [
  { id: 'e1', source: 'h3_start', target: 'h3_assess' },
  { id: 'e2', source: 'h3_assess', target: 'h3_branch_low' },
  { id: 'e3', source: 'h3_assess', target: 'h3_branch_high' },
  { id: 'e4', source: 'h3_branch_low', target: 'h3_mono' },
  { id: 'e5', source: 'h3_branch_high', target: 'h3_dual' },
  { id: 'e6', source: 'h3_mono', target: 'h3_dual', label: 'Không đạt đích', type: 'step' },
  { id: 'e7', source: 'h3_dual', target: 'h3_triple', label: 'Không đạt đích', type: 'step' },
  { id: 'e8', source: 'h3_triple', target: 'h3_resistant', label: 'Không đạt đích', type: 'step' },
  { id: 'e9', source: 'h3_resistant', target: 'h3_refer' },
  { id: 'e10', source: 'h3_mono', target: 'h3_maintain', label: 'Đạt đích', type: 'step' },
  { id: 'e11', source: 'h3_dual', target: 'h3_maintain', label: 'Đạt đích', type: 'step' },
  { id: 'e12', source: 'h3_triple', target: 'h3_maintain', label: 'Đạt đích', type: 'step' },
];
