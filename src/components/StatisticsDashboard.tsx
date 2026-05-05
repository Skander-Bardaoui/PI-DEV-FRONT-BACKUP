import { useState, useEffect } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  Loader2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { statisticsApi, TeamStatistics, MemberStats } from '../api/statistics.api';
import MemberDetailModal from './MemberDetailModal';

interface StatisticsDashboardProps {
  businessId: string;
}

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

const STATUS_COLORS = {
  TODO: '#9CA3AF',
  IN_PROGRESS: '#3B82F6',
  DONE: '#10B981',
  BLOCKED: '#EF4444',
};

const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function StatisticsDashboard({ businessId }: StatisticsDashboardProps) {
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadStatistics();
  }, [businessId]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statisticsApi.getTeamStatistics(businessId);
      setStatistics(data);
      
      // Fetch tasks for member details
      const tasksRes = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/tasks/business/${businessId}`, {
        credentials: 'include',
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || []);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = statistics?.members.filter((member) => {
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

  const handleMemberClick = (member: MemberStats) => {
    setSelectedMember(member);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const statusData = [
    { name: 'To Do', value: statistics.byStatus.TODO, color: STATUS_COLORS.TODO },
    { name: 'In Progress', value: statistics.byStatus.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
    { name: 'Done', value: statistics.byStatus.DONE, color: STATUS_COLORS.DONE },
    { name: 'Blocked', value: statistics.byStatus.BLOCKED, color: STATUS_COLORS.BLOCKED },
  ];

  const priorityData = [
    { name: 'Low', value: statistics.byPriority.LOW, fill: PRIORITY_COLORS.LOW },
    { name: 'Medium', value: statistics.byPriority.MEDIUM, fill: PRIORITY_COLORS.MEDIUM },
    { name: 'High', value: statistics.byPriority.HIGH, fill: PRIORITY_COLORS.HIGH },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{statistics.overview.totalTasks}</p>
            </div>
            <BarChart2 className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{statistics.overview.completedTasks}</p>
              <p className="text-xs text-green-600 mt-1">{statistics.overview.completionRate}% completion rate</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Overdue</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{statistics.overview.overdueTasks}</p>
              <p className="text-xs text-red-600 mt-1">{statistics.overview.overdueRate}% overdue rate</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">In Time</p>
              <p className="text-3xl font-bold text-purple-700 mt-2">{statistics.overview.inTimeTasks}</p>
              <p className="text-xs text-purple-600 mt-1">Completed on time</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="BUSINESS_ADMIN">Admin</option>
              <option value="BUSINESS_OWNER">Owner</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member, index) => {
                const color = avatarColors[index % avatarColors.length];
                const progressColor =
                  member.activityScore >= 70
                    ? 'bg-green-500'
                    : member.activityScore >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500';

                return (
                  <tr
                    key={member.memberId}
                    onClick={() => handleMemberClick(member)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                        >
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{member.assigned}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-green-600">{member.completed}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {member.overdue > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          {member.overdue}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-purple-600">{member.inTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`${progressColor} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${member.activityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">
                          {member.assigned > 0 ? `${member.activityScore}%` : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No members found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          tasks={tasks.filter((task) =>
            task.assignedTo?.some((user: any) => user.id === selectedMember.userId)
          )}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
