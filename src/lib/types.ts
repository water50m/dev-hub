// lib/types.ts
export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  subtasks: Task[];   
  isExpanded?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string; // Documentation/Notes
  tasks: Task[];
  isDefault: boolean;
  isDeleted: boolean; // Soft Delete status
  createdAt: string;
}

export type Theme = 'cyberpunk' | 'forest' | 'electric' | 'midnight';