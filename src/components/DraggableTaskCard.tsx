import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  GripVertical,
  Eye,
} from 'lucide-react';
import SubtaskProgress from './SubtaskProgress';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  assignedTo?: User[];
  dueDate?: string;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  is_active: boolean;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    role?: string;
  };
}

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

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface DraggableTaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void; // Optional: for viewing subtasks when user can't edit
  onOpenChat: (task: Task) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
}

export default function DraggableTaskCard({
  task,
  onUpdateStatus,
  onDelete,
  onEdit,
  onView,
  onOpenChat,
  canManage,
}: DraggableTaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !canManage, // Désactiver le drag pour TEAM_MEMBER et ACCOUNTANT
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusOptions: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${
        isDragging ? 'shadow-xl scale-105 rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          {/* Drag Handle - visible uniquement pour OWNER/ADMIN */}
          {canManage && (
            <button
              {...attributes}
              {...listeners}
              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <h4 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChat(task)}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title="Open chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          {!canManage && onView && (
            <button
              onClick={() => onView(task)}
              className="text-gray-400 hover:text-green-600 transition-colors"
              title="View subtasks"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onEdit(task);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <div className="px-4 py-2 text-xs font-medium text-gray-500">Change Status</div>
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            onUpdateStatus(task.id, status);
                            setShowMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            task.status === status ? 'text-indigo-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          onDelete(task.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      {/* Subtask Progress */}
      <div className="mb-3">
        <SubtaskProgress taskId={task.id} compact />
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-1 text-xs font-medium rounded border ${
            priorityColors[task.priority]
          }`}
        >
          {priorityLabels[task.priority]}
        </span>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignedTo.slice(0, 3).map((user, index) => {
                const name = user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.email;
                const initials = getInitials(name);
                
                return (
                  <div
                    key={user.id}
                    className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    title={name}
                    style={{ zIndex: task.assignedTo!.length - index }}
                  >
                    {initials}
                  </div>
                );
              })}
              {task.assignedTo.length > 3 && (
                <div
                  className="h-7 w-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  title={`+${task.assignedTo.length - 3} more`}
                >
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
