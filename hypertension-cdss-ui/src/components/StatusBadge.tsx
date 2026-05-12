'use client';

import type { RecommendationStatus } from '@/lib/types';

interface Props {
  status: RecommendationStatus;
  badge: string;
  text: string;
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_MAP = {
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  badge: 'bg-green-600 text-white' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   badge: 'bg-blue-600 text-white' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', badge: 'bg-yellow-500 text-white' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-500 text-white' },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    badge: 'bg-red-600 text-white' },
};

export function StatusBadge({ badge, text, color, size = 'md' }: Props) {
  const c = COLOR_MAP[color];
  const badgeSize = size === 'lg' ? 'text-base px-3 py-1' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-0.5';
  const textSize = size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${c.bg} ${c.border}`}>
      <span className={`rounded font-bold ${badgeSize} ${c.badge} shrink-0`}>{badge}</span>
      <span className={`font-medium ${textSize} ${c.text}`}>{text}</span>
    </div>
  );
}
