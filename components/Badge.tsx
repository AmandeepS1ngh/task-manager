'use client';

interface BadgeProps {
  label: string;
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'slate' | 'blue';
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  green: 'bg-green-500/20 text-green-400 border border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  slate: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

export default function Badge({ label, color = 'slate' }: BadgeProps) {
  return (
    <span
      className={`
        ${colorMap[color] || colorMap.slate}
        inline-flex items-center px-2 py-0.5
        text-xs font-medium rounded-full
        whitespace-nowrap
      `}
    >
      {label}
    </span>
  );
}
