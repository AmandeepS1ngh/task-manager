import { type ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color?: 'indigo' | 'green' | 'amber' | 'red';
}

const colorStyles: Record<string, { border: string; bg: string; iconBg: string; text: string }> = {
  indigo: {
    border: 'border-indigo-500/30 group-hover:border-indigo-500/60',
    bg: 'from-indigo-500/10 to-transparent',
    iconBg: 'bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    text: 'text-indigo-400',
  },
  green: {
    border: 'border-green-500/30 group-hover:border-green-500/60',
    bg: 'from-green-500/10 to-transparent',
    iconBg: 'bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    text: 'text-green-400',
  },
  amber: {
    border: 'border-amber-500/30 group-hover:border-amber-500/60',
    bg: 'from-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    text: 'text-amber-400',
  },
  red: {
    border: 'border-red-500/30 group-hover:border-red-500/60',
    bg: 'from-red-500/10 to-transparent',
    iconBg: 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    text: 'text-red-400',
  },
};

export default function StatsCard({ title, value, icon, color = 'indigo' }: StatsCardProps) {
  const style = colorStyles[color];

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-[var(--color-surface)]/60 backdrop-blur-xl
        border border-[var(--color-border)] rounded-2xl p-6
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
        transition-all duration-300 ease-out
        ${style.border} border-t-2
      `}
    >
      {/* Subtle background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-50`} />

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[var(--color-muted)] text-sm font-medium mb-1 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            text-2xl transition-transform duration-300 group-hover:scale-110
            ${style.iconBg} ${style.text}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
