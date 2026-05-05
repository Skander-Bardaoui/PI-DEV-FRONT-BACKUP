// src/components/ui/ActionButton.tsx
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'purple' | 'emerald' | 'orange' | 'indigo';
  className?: string;
}

const VARIANT_STYLES = {
  primary: {
    bg: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600',
    text: 'text-blue-900',
    subtext: 'text-blue-600',
  },
  success: {
    bg: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
    border: 'border-green-200',
    iconBg: 'bg-green-600',
    text: 'text-green-900',
    subtext: 'text-green-600',
  },
  danger: {
    bg: 'from-red-50 to-red-100 hover:from-red-100 hover:to-red-200',
    border: 'border-red-200',
    iconBg: 'bg-red-600',
    text: 'text-red-900',
    subtext: 'text-red-600',
  },
  warning: {
    bg: 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
    border: 'border-orange-200',
    iconBg: 'bg-orange-600',
    text: 'text-orange-900',
    subtext: 'text-orange-600',
  },
  info: {
    bg: 'from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-600',
    text: 'text-cyan-900',
    subtext: 'text-cyan-600',
  },
  secondary: {
    bg: 'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200',
    border: 'border-gray-200',
    iconBg: 'bg-gray-700',
    text: 'text-gray-900',
    subtext: 'text-gray-600',
  },
  purple: {
    bg: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
    border: 'border-purple-200',
    iconBg: 'bg-purple-600',
    text: 'text-purple-900',
    subtext: 'text-purple-600',
  },
  emerald: {
    bg: 'from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-600',
    text: 'text-emerald-900',
    subtext: 'text-emerald-600',
  },
  orange: {
    bg: 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
    border: 'border-orange-200',
    iconBg: 'bg-orange-600',
    text: 'text-orange-900',
    subtext: 'text-orange-600',
  },
  indigo: {
    bg: 'from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
    text: 'text-indigo-900',
    subtext: 'text-indigo-600',
  },
};

export function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
}: ActionButtonProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`group relative overflow-hidden bg-gradient-to-br ${styles.bg} border ${styles.border} rounded-xl p-4 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-left">
          <div className={`font-semibold ${styles.text} text-sm`}>
            {loading ? 'Chargement...' : label}
          </div>
          <div className={`text-xs ${styles.subtext}`}>{description}</div>
        </div>
      </div>
    </button>
  );
}

interface ActionSectionProps {
  title: string;
  variant?: 'default' | 'danger';
  children: ReactNode;
}

export function ActionSection({ title, variant = 'default', children }: ActionSectionProps) {
  const borderColor = variant === 'danger' ? 'border-red-100' : 'border-gray-100';
  const titleColor = variant === 'danger' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${borderColor}`}>
      <div className={`text-xs font-semibold ${titleColor} uppercase tracking-wide mb-3`}>
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}
