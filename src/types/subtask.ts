export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  isCompletedByTeamMember: boolean; // Pour la progression visible
  order: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskDto {
  title: string;
  taskId: string;
  order?: number;
}

export interface UpdateSubtaskDto {
  title?: string;
  isCompleted?: boolean;
}

export interface GenerateSubtasksDto {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
}
