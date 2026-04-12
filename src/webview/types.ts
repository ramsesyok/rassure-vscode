export interface Comment {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  description: string;
  target: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
  reporter: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export interface Settings {
  folderPath: string;
}

export const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: '未着手',
  in_progress: '対応中',
  resolved: '解決済',
  closed: 'クローズ'
};

export const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低'
};
