import { X, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { MemberStats } from '../api/statistics.api';

interface Task {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  dueDate?: string;
}

interface MemberDetailModalProps {
  member: MemberStats;
  tasks: Task[];
  onClose: () => void;
}

const priorityColors = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isOverdue(task: Task): boolean {
  if (task.status === 'DONE' || !task.dueDate) return false;
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export default function MemberDetailModal({ member, tasks, onClose }: MemberDetailModalProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
  };

  const progressColor =
    member.activityScore >= 70
      ? 'bg-green-500'
      : member.activityScore >= 40
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-xl">
              {getInitials(member.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {formatRole(member.role)}
                </span>
                <span className="text-sm text-gray-500">{member.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Assigned</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{member.assigned}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{member.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{member.overdue}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">In Time</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{member.inTime}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Activity Score */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Activity Score</span>
              <span className="text-sm font-bold text-gray-900">{member.activityScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`${progressColor} h-3 rounded-full transition-all duration-300`}
                style={{ width: `${member.activityScore}%` }}
              />
            </div>
          </div>

          {/* Tasks by Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Tasks</h3>
            {member.assigned === 0 ? (
              <p className="text-center text-gray-500 py-8">No tasks assigned</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
                  if (statusTasks.length === 0) return null;
                  return (
                    <div key={status}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {statusLabels[status as keyof typeof statusLabels]} ({statusTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {statusTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                {task.dueDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                    priorityColors[task.priority]
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                {isOverdue(task) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                    <AlertCircle className="h-3 w-3" />
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
