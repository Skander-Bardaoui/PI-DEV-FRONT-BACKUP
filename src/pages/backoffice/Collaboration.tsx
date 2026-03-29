import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  Users,
  Bell,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Mail,
  MessageSquare,
  FileText,
  Settings,
  Filter,
  Loader2,
  Trash2,
  Edit,
} from 'lucide-react';
import TaskChat from '../../components/TaskChat';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Business {
  id: string;
  name: string;
  tenant_id: string;
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

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// ─── Mock data for activity ───────────────────────────────────────────────────

const activityData = [
  { id: 1, user: 'Ahmed Ben Ali', action: 'created task', target: 'Design new landing page', time: '2 hours ago', icon: Plus, color: 'text-indigo-600' },
  { id: 2, user: 'Salma Mansouri', action: 'completed task', target: 'Update user profile UI', time: '4 hours ago', icon: CheckCircle2, color: 'text-green-600' },
  { id: 3, user: 'Mohamed Trabelsi', action: 'commented on', target: 'Fix authentication bug', time: '5 hours ago', icon: MessageSquare, color: 'text-blue-600' },
  { id: 4, user: 'Fatma Khelifi', action: 'started working on', target: 'Implement payment gateway', time: '6 hours ago', icon: Clock, color: 'text-yellow-600' },
  { id: 5, user: 'Karim Bouazizi', action: 'uploaded file to', target: 'Test documentation', time: '1 day ago', icon: FileText, color: 'text-purple-600' },
  { id: 6, user: 'Nadia Hamdi', action: 'completed task', target: 'Deploy to production', time: '1 day ago', icon: CheckCircle2, color: 'text-green-600' },
  { id: 7, user: 'Ahmed Ben Ali', action: 'blocked task', target: 'Database migration', time: '2 days ago', icon: XCircle, color: 'text-red-600' },
];

// ─── Mock data for notifications ──────────────────────────────────────────────

const initialNotifications = [
  { id: 1, title: 'New task assigned', message: 'Ahmed assigned you to "Design new landing page"', time: '10 min ago', read: false },
  { id: 2, title: 'Task completed', message: 'Salma completed "Update user profile UI"', time: '1 hour ago', read: false },
  { id: 3, title: 'Comment added', message: 'Mohamed commented on your task', time: '2 hours ago', read: false },
  { id: 4, title: 'Deadline approaching', message: 'Task "Fix authentication bug" is due tomorrow', time: '3 hours ago', read: true },
  { id: 5, title: 'Team member joined', message: 'Nadia Hamdi joined the team', time: '1 day ago', read: true },
  { id: 6, title: 'Task blocked', message: 'Database migration is blocked', time: '2 days ago', read: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// Avatar colors pool — assigned by index so each member gets a stable color
const avatarColors = [
  'bg-indigo-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

function ensureArray<T>(data: any, key?: string): T[] {
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data[key])) return data[key];
  return [];
}

function getMemberName(member: TeamMember): string {
  if (member.user.firstName || member.user.lastName) {
    return `${member.user.firstName ?? ''} ${member.user.lastName ?? ''}`.trim();
  }
  return member.user.name ?? member.user.email ?? 'Unknown';
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── API calls ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function fetchMyBusinesses(): Promise<Business[]> {
  const res = await fetch(`${API_BASE}/businesses/my`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch businesses');
  const data = await res.json();
  return ensureArray<Business>(data, 'businesses');
}

async function fetchBusinessMembers(businessId: string): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE}/businesses/${businessId}/members`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch members');
  const data = await res.json();
  return ensureArray<TeamMember>(data, 'members');
}

async function fetchTasks(businessId: string): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks/business/${businessId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data = await res.json();
  return ensureArray<Task>(data, 'tasks');
}

async function createTask(taskData: Partial<Task>): Promise<Task> {
  const payload = {
    ...taskData,
    assignedToIds: taskData.assignedTo?.map(u => u.id) || [],
  };
  delete (payload as any).assignedTo;
  
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const payload = {
    ...updates,
    assignedToIds: updates.assignedTo?.map(u => u.id),
  };
  delete (payload as any).assignedTo;
  
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Collaboration() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Chat state
  const [chatTask, setChatTask] = useState<Task | null>(null);

  // New task form state
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Task['priority'],
    assignedToIds: [] as string[],
    dueDate: '',
  });

  // Check if user can manage tasks
  const canManageTasks = currentUser?.role === 'BUSINESS_OWNER' || currentUser?.role === 'BUSINESS_ADMIN';

  // ── Load current user, businesses, members, and tasks on mount ─────────────
  useEffect(() => {
    async function loadData() {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
      } catch (err: any) {
        console.error('Failed to load user:', err);
      }

      setLoadingMembers(true);
      setMembersError(null);
      try {
        const fetchedBusinesses = await fetchMyBusinesses();
        if (fetchedBusinesses.length === 0) {
          setMembersError('Aucun business trouvé pour votre compte.');
          return;
        }
        setBusinesses(fetchedBusinesses);
        const business = fetchedBusinesses[0];
        setCurrentBusiness(business);
        const members = await fetchBusinessMembers(business.id);
        setTeamMembers(members);

        // Load tasks
        setLoadingTasks(true);
        setTasksError(null);
        try {
          const fetchedTasks = await fetchTasks(business.id);
          setTasks(fetchedTasks);
        } catch (err: any) {
          setTasksError(err.message ?? 'Failed to load tasks');
        } finally {
          setLoadingTasks(false);
        }
      } catch (err: any) {
        setMembersError(err.message ?? 'Erreur lors du chargement des membres.');
      } finally {
        setLoadingMembers(false);
      }
    }
    loadData();
  }, []);

  // ── Filtered members by search ────────────────────────────────────────────
  const filteredMembers = teamMembers.filter((m) => {
    const name = getMemberName(m).toLowerCase();
    const email = (m.user.email ?? '').toLowerCase();
    const role = m.role.toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || role.includes(q);
  });

  // ── Tasks by status ────────────────────────────────────────────────────────
  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // ── Handle create task ─────────────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (!currentBusiness) {
      alert('No business selected');
      return;
    }

    try {
      const assignedUsers = newTaskForm.assignedToIds
        .map(id => teamMembers.find(m => m.user_id === id)?.user)
        .filter(Boolean) as User[];

      const taskData: Partial<Task> = {
        title: newTaskForm.title,
        description: newTaskForm.description || undefined,
        priority: newTaskForm.priority,
        assignedTo: assignedUsers,
        dueDate: newTaskForm.dueDate || undefined,
        status: 'TODO',
        businessId: currentBusiness.id,
      };
      const created = await createTask(taskData);
      setTasks([...tasks, created]);
      setShowNewTask(false);
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedToIds: [],
        dueDate: '',
      });
    } catch (err: any) {
      alert(err.message ?? 'Failed to create task');
    }
  };

  // ── Handle update task status ──────────────────────────────────────────────
  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (err: any) {
      alert(err.message ?? 'Failed to update task');
    }
  };

  // ── Handle delete task ─────────────────────────────────────────────────────
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete task');
    }
  };

  // ── Handle edit task ───────────────────────────────────────────────────────
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignedToIds: task.assignedTo?.map(u => u.id) || [],
      dueDate: task.dueDate || '',
    });
    setShowNewTask(true);
  };

  // ── Handle update task ─────────────────────────────────────────────────────
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!newTaskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const assignedUsers = newTaskForm.assignedToIds
        .map(id => teamMembers.find(m => m.user_id === id)?.user)
        .filter(Boolean) as User[];

      const updates: Partial<Task> = {
        title: newTaskForm.title,
        description: newTaskForm.description || undefined,
        priority: newTaskForm.priority,
        assignedTo: assignedUsers,
        dueDate: newTaskForm.dueDate || undefined,
      };
      const updated = await updateTask(editingTask.id, updates);
      setTasks(tasks.map((t) => (t.id === editingTask.id ? updated : t)));
      setShowNewTask(false);
      setEditingTask(null);
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedToIds: [],
        dueDate: '',
      });
    } catch (err: any) {
      alert(err.message ?? 'Failed to update task');
    }
  };

  // ── Close modal ────────────────────────────────────────────────────────────
  const handleCloseTaskModal = () => {
    setShowNewTask(false);
    setEditingTask(null);
    setNewTaskForm({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedToIds: [],
      dueDate: '',
    });
  };

  // ── Toggle assigned member ─────────────────────────────────────────────────
  const toggleAssignedMember = (userId: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(userId)
        ? prev.assignedToIds.filter(id => id !== userId)
        : [...prev.assignedToIds, userId],
    }));
  };

  // ── Handle business change ─────────────────────────────────────────────────
  const handleBusinessChange = async (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;

    setCurrentBusiness(business);
    setLoadingMembers(true);
    setLoadingTasks(true);
    setMembersError(null);
    setTasksError(null);

    try {
      const members = await fetchBusinessMembers(businessId);
      setTeamMembers(members);
    } catch (err: any) {
      setMembersError(err.message ?? 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }

    try {
      const fetchedTasks = await fetchTasks(businessId);
      setTasks(fetchedTasks);
    } catch (err: any) {
      setTasksError(err.message ?? 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-500">
            {currentBusiness ? `Business : ${currentBusiness.name}` : 'Manage tasks, activity and teamwork'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {businesses.length > 1 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <select
                value={currentBusiness?.id || ''}
                onChange={(e) => handleBusinessChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer min-w-[200px]"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {canManageTasks && (
            <button
              onClick={() => setShowNewTask(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {['tasks', 'team', 'activity', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors relative ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'notifications' && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">

          {/* ── Tasks Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {loadingTasks && (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <span>Loading tasks...</span>
                </div>
              )}

              {!loadingTasks && tasksError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{tasksError}</span>
                </div>
              )}

              {!loadingTasks && !tasksError && (
                <div className="grid lg:grid-cols-4 gap-4">
                  <KanbanColumn
                    label="TODO"
                    icon={<Circle className="h-5 w-5 text-gray-400" />}
                    tasks={tasksByStatus.TODO}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenChat={setChatTask}
                    canManage={canManageTasks}
                    teamMembers={teamMembers}
                  />
                  <KanbanColumn
                    label="IN PROGRESS"
                    icon={<Clock className="h-5 w-5 text-blue-500" />}
                    tasks={tasksByStatus.IN_PROGRESS}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenChat={setChatTask}
                    canManage={canManageTasks}
                    teamMembers={teamMembers}
                  />
                  <KanbanColumn
                    label="DONE"
                    icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    tasks={tasksByStatus.DONE}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenChat={setChatTask}
                    canManage={canManageTasks}
                    teamMembers={teamMembers}
                  />
                  <KanbanColumn
                    label="BLOCKED"
                    icon={<XCircle className="h-5 w-5 text-red-500" />}
                    tasks={tasksByStatus.BLOCKED}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenChat={setChatTask}
                    canManage={canManageTasks}
                    teamMembers={teamMembers}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Team Tab ────────────────────────────────────────────────────── */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un membre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowInviteMember(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-5 w-5" />
                  Invite Member
                </button>
              </div>

              {/* Loading state */}
              {loadingMembers && (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <span>Chargement des membres...</span>
                </div>
              )}

              {/* Error state */}
              {!loadingMembers && membersError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{membersError}</span>
                </div>
              )}

              {/* Empty state */}
              {!loadingMembers && !membersError && filteredMembers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                  <Users className="h-12 w-12" />
                  <p className="text-lg font-medium text-gray-500">
                    {searchQuery ? 'Aucun membre ne correspond à votre recherche.' : 'Aucun membre dans ce business.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowInviteMember(true)}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Inviter le premier membre
                    </button>
                  )}
                </div>
              )}

              {/* Members table */}
              {!loadingMembers && !membersError && filteredMembers.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nom</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rôle</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rejoint le</th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMembers.map((member, index) => {
                        const name = getMemberName(member);
                        const initials = getInitials(name);
                        const color = avatarColors[index % avatarColors.length];
                        const joinedDate = member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString('fr-TN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—';

                        return (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                                >
                                  {initials}
                                </div>
                                <span className="font-medium text-gray-900">{name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {formatRole(member.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {member.user.email}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
                                  member.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    member.is_active ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                />
                                {member.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {joinedDate}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                    {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''} au total
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Activity Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="relative">
                {activityData.map((activity, index) => (
                  <div key={activity.id} className="relative pl-8 pb-8 last:pb-0">
                    {index !== activityData.length - 1 && (
                      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                    )}
                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      <activity.icon className={`h-3 w-3 ${activity.color}`} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium text-indigo-600">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notifications Tab ─────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Tout est lu !'}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read ? 'bg-white border-gray-200' : 'bg-indigo-50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-indigo-100'}`}>
                          <Bell className={`h-5 w-5 ${notification.read ? 'text-gray-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── New/Edit Task Modal ─────────────────────────────────────────────────────── */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={handleCloseTaskModal} className="text-gray-400 hover:text-gray-500">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign To (Multiple)</label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No team members available</p>
                  ) : (
                    teamMembers.map((member) => {
                      const name = getMemberName(member);
                      const initials = getInitials(name);
                      const isChecked = newTaskForm.assignedToIds.includes(member.user_id);
                      
                      return (
                        <label
                          key={member.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssignedMember(member.user_id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {newTaskForm.assignedToIds.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {newTaskForm.assignedToIds.length} member{newTaskForm.assignedToIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCloseTaskModal}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Member Modal ───────────────────────────────────────────────── */}
      {showInviteMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setShowInviteMember(false)} className="text-gray-400 hover:text-gray-500">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select role</option>
                  <option value="BUSINESS_ADMIN">Business Admin</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowInviteMember(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task Chat Modal ────────────────────────────────────────────────────── */}
      {chatTask && currentUser && (
        <TaskChat
          taskId={chatTask.id}
          taskTitle={chatTask.title}
          currentUserId={currentUser.id}
          onClose={() => setChatTask(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KanbanColumn({
  label,
  icon,
  tasks,
  onUpdateStatus,
  onDelete,
  onEdit,
  onOpenChat,
  canManage,
  teamMembers,
}: {
  label: string;
  icon: React.ReactNode;
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenChat: (task: Task) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
        <span className="text-sm text-gray-500">({tasks.length})</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
            onEdit={onEdit}
            onOpenChat={onOpenChat}
            canManage={canManage}
            teamMembers={teamMembers}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onUpdateStatus,
  onDelete,
  onEdit,
  onOpenChat,
  canManage,
  teamMembers,
}: {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenChat: (task: Task) => void;
  canManage: boolean;
  teamMembers: TeamMember[];
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusOptions: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChat(task)}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title="Open chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
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
              )}
            </div>
          )}
        </div>
        
      </div>
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
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
