import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { subtasksApi } from '../api/subtasks.api';

interface SubtaskProgressProps {
  taskId: string;
  compact?: boolean;
}

export default function SubtaskProgress({ taskId, compact = false }: SubtaskProgressProps) {
  const [progress, setProgress] = useState<{ completed: number; total: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [taskId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await subtasksApi.getTaskProgress(taskId);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load subtask progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress || progress.total === 0) {
    return null;
  }

  if (compact) {
    // Version compacte pour les cartes Kanban
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {progress.completed}/{progress.total}
          </span>
        </div>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{progress.percentage}%</span>
      </div>
    );
  }

  // Version complète pour les modals
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Subtasks Progress</span>
        </div>
        <span className="text-gray-600">
          {progress.completed}/{progress.total} ({progress.percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  );
}
