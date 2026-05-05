import axiosInstance from './axiosInstance';
import type { Subtask, CreateSubtaskDto, UpdateSubtaskDto, GenerateSubtasksDto } from '../types/subtask';

const API_BASE = '/subtasks';

export const subtasksApi = {
  async getByTask(taskId: string): Promise<Subtask[]> {
    const response = await axiosInstance.get(`${API_BASE}/task/${taskId}`);
    return response.data;
  },

  async getTaskProgress(taskId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const response = await axiosInstance.get(`${API_BASE}/task/${taskId}/progress`);
    return response.data;
  },

  async create(data: CreateSubtaskDto): Promise<Subtask> {
    const response = await axiosInstance.post(API_BASE, data);
    return response.data;
  },

  async update(id: string, data: UpdateSubtaskDto): Promise<Subtask> {
    const response = await axiosInstance.patch(`${API_BASE}/${id}`, data);
    return response.data;
  },

  async markCompleteByTeamMember(id: string, businessId: string): Promise<Subtask> {
    const response = await axiosInstance.post(`${API_BASE}/${id}/mark-complete`, { businessId });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`${API_BASE}/${id}`);
  },

  async generate(data: GenerateSubtasksDto): Promise<string[]> {
    const response = await axiosInstance.post(`${API_BASE}/generate`, data);
    return response.data;
  },
};
