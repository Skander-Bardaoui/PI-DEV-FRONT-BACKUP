// src/components/stock/StockCard.tsx
import { LucideIcon } from 'lucide-react';

interface StockCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'indigo' | 'red' | 'yellow' | 'green';
  change?: string;
  trend?: 'up' | 'down';
}

export default function StockCard({ title, value, icon: Icon, color, change, trend }: StockCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${
          color === 'indigo' ? 'bg-indigo-100' :
          color === 'red' ? 'bg-red-100' :
          color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          <Icon className={`h-6 w-6 ${
            color === 'indigo' ? 'text-indigo-600' :
            color === 'red' ? 'text-red-600' :
            color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
          }`} />
        </div>
        {change && (
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}
