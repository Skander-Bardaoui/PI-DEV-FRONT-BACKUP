const API_BASE = import.meta.env.VITE_API_URL ?? 'https://pi-dev-backend.onrender.com';

export interface Activity {
  id: string;
  type: 'SUBTASK_COMPLETED' | 'SUBTASK_COMPLETED_OVERDUE' | 'SUBTASK_COMPLETED_ON_TIME' | 'TASK_BLOCKED' | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';
  businessId: string;
  userId: string;
  taskId?: string;
  subtaskId?: string;
  description?: string;
  isOverdue: boolean;
  isOnTime: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  task?: {
    id: string;
    title: string;
  };
  subtask?: {
    id: string;
    title: string;
  };
}

export const activitiesApi = {
  async getByBusiness(businessId: string): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/activities/business/${businessId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    return response.json();
  },
};
