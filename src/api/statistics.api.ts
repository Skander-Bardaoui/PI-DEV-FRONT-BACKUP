const API_BASE = import.meta.env.VITE_API_URL ?? 'https://pi-dev-backend.onrender.com';

export interface MemberStats {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  assigned: number;
  completed: number;
  overdue: number;
  inTime: number;
  completionRate: number;
  overdueRate: number;
  activityScore: number;
}

export interface TeamStatistics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inTimeTasks: number;
    completionRate: number;
    overdueRate: number;
  };
  byStatus: {
    TODO: number;
    IN_PROGRESS: number;
    DONE: number;
    BLOCKED: number;
  };
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  members: MemberStats[];
}

export const statisticsApi = {
  async getTeamStatistics(businessId: string): Promise<TeamStatistics> {
    const response = await fetch(`${API_BASE}/statistics/team/${businessId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch team statistics');
    }
    return response.json();
  },
};
