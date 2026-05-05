import axiosInstance from './axiosInstance';

export interface CreateCheckinDto {
  businessId: string;
  taskIds: string[];
  note?: string;
  skipped: boolean;
}

export interface CheckinStatus {
  hasCheckedIn: boolean;
}

export interface MemberCheckinStatus {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: 'checked_in' | 'skipped' | 'pending';
  tasks: any[];
  note: string | null;
}

export interface BusinessCheckinsResponse {
  members: MemberCheckinStatus[];
  summary: {
    checkedIn: number;
    skipped: number;
    pending: number;
  };
}

export const checkinsApi = {
  // Create a check-in
  async create(data: CreateCheckinDto) {
    const response = await axiosInstance.post('/checkins', data);
    return response.data;
  },

  // Check if user has checked in today
  async hasCheckedInToday(): Promise<CheckinStatus> {
    const response = await axiosInstance.get('/checkins/today');
    return response.data;
  },

  // Get business check-ins for today (OWNER/ADMIN only)
  async getBusinessCheckinsToday(businessId: string): Promise<BusinessCheckinsResponse> {
    const response = await axiosInstance.get(`/checkins/business/${businessId}/today`);
    return response.data;
  },
};
