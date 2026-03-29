

import { FileDown, Loader2 } from 'lucide-react';

interface Props {
  onClick:   (e?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  loading?:  boolean;
  label?:    string;
  variant?:  'primary' | 'ghost' | 'icon';
  className?: string;
}

export default function PDFButton({
  onClick,
  loading  = false,
  label    = 'PDF',
  variant  = 'ghost',
  className = '',
}: Props) {

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        title={label}
        className={`p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ${className}`}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <FileDown className="h-4 w-4" />
        }
      </button>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <FileDown className="h-4 w-4" />
        }
        {label}
      </button>
    );
  }

  // ghost (défaut)
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm transition-colors disabled:opacity-50 ${className}`}
    >
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <FileDown className="h-4 w-4" />
      }
      {label}
    </button>
  );
}