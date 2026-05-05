import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableTaskCard from './DraggableTaskCard';

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

interface DroppableColumnProps {
  label: string;
  icon: React.ReactNode;
  status: Task['status'];
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void; // Optional: for viewing subtasks
  onOpenChat: (task: Task) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
}

export default function DroppableColumn({
  label,
  icon,
  status,
  tasks,
  onUpdateStatus,
  onDelete,
  onEdit,
  onView,
  onOpenChat,
  canManage,
  teamMembers,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
        <span className="text-sm text-gray-500">({tasks.length})</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-indigo-50 border-2 border-indigo-300 border-dashed' : 'border-2 border-transparent'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 group">
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onOpenChat={onOpenChat}
                canManage={canManage}
                teamMembers={teamMembers}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
