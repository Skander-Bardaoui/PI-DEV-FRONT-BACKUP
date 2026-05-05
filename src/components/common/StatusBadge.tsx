/**
 * Reusable Status Badge Component
 * Reduces code duplication for status displays
 */

import { STATUS_COLORS } from '../../constants';

type Status = keyof typeof STATUS_COLORS;

interface StatusBadgeProps {
  status: Status | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const color = STATUS_COLORS[status as Status] || 'gray';
  const colorClass = colorMap[color] || colorMap.gray;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClasses[size]}`}
      role="status"
    >
      {displayLabel}
    </span>
  );
}
