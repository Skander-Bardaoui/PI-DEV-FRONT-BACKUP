import { useState, useEffect, KeyboardEvent } from 'react';
import { Sparkles, Check, Trash2, Loader2, X } from 'lucide-react';
import { subtasksApi } from '../api/subtasks.api';
import type { Subtask } from '../types/subtask';
import { toast } from 'sonner';
import { useAIAccess } from '../hooks/useAIAccess';

interface SubtaskListProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  businessId: string; // Required for marking complete
  userRole?: string; // Deprecated: kept for backward compatibility
  canManageSubtasks?: boolean; // Deprecated: kept for backward compatibility
  canMarkComplete?: boolean; // Deprecated: kept for backward compatibility
  currentMember?: {
    role: string;
    collaboration_permissions?: {
      create_subtask?: boolean;
      update_subtask?: boolean;
      delete_subtask?: boolean;
      mark_complete_subtask?: boolean;
      [key: string]: boolean | undefined; // Allow other permission keys
    };
  };
  onProgressUpdate?: () => void; // Callback pour notifier le parent
}

export default function SubtaskList({ 
  taskId, 
  taskTitle, 
  taskDescription,
  businessId,
  userRole, 
  canManageSubtasks, 
  canMarkComplete: canMarkCompleteProp,
  currentMember,
  onProgressUpdate 
}: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const { hasAIAccess, loading: aiLoading } = useAIAccess();

  // Determine permissions based on currentMember if provided, otherwise fall back to legacy props
  const isOwner = currentMember?.role === 'BUSINESS_OWNER' || userRole === 'BUSINESS_OWNER';
  const collab = currentMember?.collaboration_permissions;
  
  // Enforce granular permissions
  const canCreateSubtask = isOwner || collab?.create_subtask === true;
  const canUpdateSubtask = isOwner || collab?.update_subtask === true;
  const canDeleteSubtask = isOwner || collab?.delete_subtask === true;
  const canMarkCompleteSubtask = isOwner || collab?.mark_complete_subtask === true;
  
  // Legacy fallback for backward compatibility
  const canGenerate = (currentMember ? canCreateSubtask : (canManageSubtasks ?? (userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN'))) && hasAIAccess; // Only allow if has AI access
  const canCreate = currentMember ? canCreateSubtask : (canManageSubtasks ?? (userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN'));
  const canDelete = currentMember ? canDeleteSubtask : (canManageSubtasks ?? (userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN'));
  const canToggle = currentMember ? canUpdateSubtask : (canManageSubtasks ?? (userRole === 'BUSINESS_OWNER' || userRole === 'BUSINESS_ADMIN'));
  // TEAM_MEMBER peut marquer comme complété (différent de cocher)
  const canMarkComplete = currentMember ? canMarkCompleteSubtask : (canMarkCompleteProp ?? (userRole === 'TEAM_MEMBER' || userRole === 'ACCOUNTANT'));

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const loadSubtasks = async () => {
    try {
      setLoading(true);
      const data = await subtasksApi.getByTask(taskId);
      setSubtasks(data);
    } catch (error) {
      console.error('Failed to load subtasks:', error);
      toast.error('Failed to load subtasks');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!taskDescription || taskDescription.trim() === '') {
      toast.error('Task description is required for AI generation');
      return;
    }

    try {
      setGenerating(true);
      console.log('🤖 Generating subtasks for:', { taskId, taskTitle, taskDescription: taskDescription.substring(0, 50) });
      
      const generated = await subtasksApi.generate({
        taskId,
        taskTitle,
        taskDescription,
      });
      
      console.log('✅ Generated subtasks:', generated);
      setSuggestions(generated);
      toast.success(`Generated ${generated.length} subtask suggestions`);
    } catch (error: any) {
      console.error('❌ Failed to generate subtasks:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate subtasks';
      toast.error(`AI Generation Error: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptAll = async () => {
    try {
      setLoading(true);
      const promises = suggestions.map((title, index) =>
        subtasksApi.create({
          title,
          taskId,
          order: subtasks.length + index,
        })
      );
      await Promise.all(promises);
      setSuggestions([]);
      await loadSubtasks();
      toast.success('All subtasks added successfully');
      
      // Notifier le parent pour rafraîchir la progression
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Failed to add subtasks:', error);
      toast.error('Failed to add subtasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (subtask: Subtask) => {
    if (!canToggle) {
      toast.error('Only managers can check/uncheck subtasks directly');
      return;
    }

    try {
      await subtasksApi.update(subtask.id, {
        isCompleted: !subtask.isCompleted,
      });
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? { ...s, isCompleted: !s.isCompleted } : s
        )
      );
      
      // Notifier le parent pour rafraîchir la progression
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleMarkComplete = async (subtask: Subtask) => {
    if (!canMarkComplete) {
      toast.error('You don\'t have permission to mark subtasks as complete');
      return;
    }

    if (subtask.isCompletedByTeamMember) {
      toast.info('This subtask is already completed by a team member');
      return;
    }

    try {
      const updated = await subtasksApi.markCompleteByTeamMember(subtask.id, businessId);
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? updated : s
        )
      );
      toast.success('Subtask marked as complete');
      
      // Notifier le parent pour rafraîchir la progression
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error: any) {
      console.error('Failed to mark subtask as complete:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark subtask as complete';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('Only Business Owner and Admin can delete subtasks');
      return;
    }

    try {
      await subtasksApi.delete(id);
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subtask deleted');
      
      // Notifier le parent pour rafraîchir la progression
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  const handleAddManual = async () => {
    if (!canCreate) {
      toast.error('Only Business Owner and Admin can create subtasks');
      return;
    }

    if (!newSubtaskTitle.trim()) return;

    try {
      const created = await subtasksApi.create({
        title: newSubtaskTitle.trim(),
        taskId,
        order: subtasks.length,
      });
      setSubtasks((prev) => [...prev, created]);
      setNewSubtaskTitle('');
      toast.success('Subtask added');
      
      // Notifier le parent pour rafraîchir la progression
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddManual();
    }
  };

  const completedCount = subtasks.filter((s) => s.isCompletedByTeamMember).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Subtasks</h3>
        {!aiLoading && canGenerate && (
          <button
            onClick={handleGenerate}
            disabled={!taskDescription || taskDescription.trim() === '' || generating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </>
            )}
          </button>
        )}
      </div>

      {/* AI Suggestions Preview */}
      {suggestions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-purple-900">AI Suggestions</h4>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptAll}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Accept all
              </button>
              <button
                onClick={() => setSuggestions([])}
                className="px-3 py-1 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-50"
              >
                Dismiss
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-purple-800">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>
              {completedCount}/{totalCount} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Info message for TEAM_MEMBER */}
      {canMarkComplete && !canToggle && totalCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
          <span className="font-medium">✓ Team Member View:</span> Click "Mark Complete" on each subtask as you finish them. Your progress will be tracked automatically.
        </div>
      )}

      {/* Subtasks List */}
      {loading && subtasks.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group"
            >
              {/* Pour OWNER/ADMIN : Checkbox cliquable */}
              {canToggle && (
                <button
                  onClick={() => handleToggle(subtask)}
                  className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                    subtask.isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-green-500 cursor-pointer'
                  }`}
                >
                  {subtask.isCompleted && <Check className="h-3 w-3 text-white" />}
                </button>
              )}

              {/* Pour TEAM_MEMBER : Icône de statut (non cliquable) */}
              {canMarkComplete && !canToggle && (
                <div
                  className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center ${
                    subtask.isCompleted
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {subtask.isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
              )}

              <span
                className={`flex-1 text-sm ${
                  subtask.isCompleted
                    ? 'line-through text-gray-400'
                    : 'text-gray-700'
                }`}
              >
                {subtask.title}
              </span>

              {/* Pour TEAM_MEMBER : Bouton "Marquer comme complété" */}
              {canMarkComplete && !subtask.isCompletedByTeamMember && (
                <button
                  onClick={() => handleMarkComplete(subtask)}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
              )}

              {/* Message si déjà complété par team member */}
              {canMarkComplete && subtask.isCompletedByTeamMember && (
                <span className="flex-shrink-0 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                  ✓ Completed
                </span>
              )}

              {/* Pour OWNER/ADMIN : Bouton supprimer */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(subtask.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Input - Only for OWNER/ADMIN */}
      {canCreate && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a subtask..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleAddManual}
            disabled={!newSubtaskTitle.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
