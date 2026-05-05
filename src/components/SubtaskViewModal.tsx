import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { subtasksApi } from '../api/subtasks.api';
import type { Subtask } from '../types/subtask';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  dueDate?: string;
}

interface SubtaskViewModalProps {
  task: Task;
  businessId: string;
  onClose: () => void;
  onProgressUpdate?: () => void;
}

export default function SubtaskViewModal({ task, businessId, onClose, onProgressUpdate }: SubtaskViewModalProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    loadSubtasks();
  }, [task.id]);

  const loadSubtasks = async () => {
    console.log('📡 DEBUG loadSubtasks:', {
      taskId: task.id,
      taskTitle: task.title,
      businessId
    });
    
    try {
      setLoading(true);
      const data = await subtasksApi.getByTask(task.id);
      console.log('✅ DEBUG Subtasks loaded successfully:', {
        count: data.length,
        subtasks: data
      });
      setSubtasks(data);
    } catch (error) {
      console.error('❌ DEBUG Failed to load subtasks:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load subtasks');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (subtask: Subtask) => {
    if (subtask.isCompletedByTeamMember) {
      toast.info('This subtask is already completed');
      return;
    }

    try {
      setMarkingId(subtask.id);
      const updated = await subtasksApi.markCompleteByTeamMember(subtask.id, businessId);
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? updated : s))
      );
      toast.success('Subtask marked as complete');

      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Failed to mark subtask as complete:', error);
      toast.error('Failed to mark subtask as complete');
    } finally {
      setMarkingId(null);
    }
  };

  const completedCount = subtasks.filter((s) => s.isCompletedByTeamMember).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const priorityColors = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  };

  const priorityLabels = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h2>
              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border ${
                    priorityColors[task.priority]
                  }`}
                >
                  {priorityLabels[task.priority]}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Info Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Team Member View</p>
                <p className="text-xs text-green-700 mt-1">
                  Click "Mark Complete" on each subtask as you finish them. Your progress will be tracked automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Your Progress</span>
                <span className="text-gray-600">
                  {completedCount}/{totalCount} ({Math.round(progressPercentage)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtasks List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : subtasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No subtasks for this task yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                The manager will add subtasks soon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    subtask.isCompletedByTeamMember
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Status Icon */}
                  <div
                    className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      subtask.isCompletedByTeamMember
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {subtask.isCompletedByTeamMember && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Title */}
                  <span
                    className={`flex-1 text-sm font-medium ${
                      subtask.isCompletedByTeamMember
                        ? 'line-through text-gray-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {subtask.title}
                  </span>

                  {/* Action Button */}
                  {subtask.isCompletedByTeamMember ? (
                    <span className="flex-shrink-0 px-4 py-2 text-xs font-medium text-green-700 bg-green-100 rounded-lg">
                      ✓ Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(subtask)}
                      disabled={markingId === subtask.id}
                      className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {markingId === subtask.id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Marking...
                        </span>
                      ) : (
                        'Mark Complete'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
