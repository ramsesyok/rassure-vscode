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

export interface WebviewRequest<T = unknown> {
  requestId: number;
  type: string;
  payload?: T;
}

export interface HostResponse<T = unknown> {
  requestId: number;
  type: string;
  data?: T;
  error?: string;
}
