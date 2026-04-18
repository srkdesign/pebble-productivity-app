export interface Task {
  _dirty?: boolean;
  id: number;
  title: string;
  completed: boolean;
  deleted: boolean;
  time_spent: number;
  is_running: boolean;
  last_start?: number;
  updated_at: number;
  version: number;
  project_id?: number;
  due_date?: number;
  recurring_rule?: {
    pattern: string;
    interval?: number;
  };
  recurring_rule_id?: number;
  completed_at?: number;
}

export interface Project {
  _dirty?: boolean;
  id: number;
  name: string;
  is_default: boolean;
  is_archived: boolean;
  color?: string;
  icon?: string;
  created_at: number;
  updated_at: number;
}
