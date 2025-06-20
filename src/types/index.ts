export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  password: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  boardIds: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'created' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeIds: string[];
  creatorId: string;
  boardId: string;
  deadline?: string;
  isPinned: boolean;
  attachments: Attachment[];
  comments: Comment[];
  voiceMessages: VoiceMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface VoiceMessage {
  id: string;
  userId: string;
  url: string;
  duration: number;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'board_added' | 'admin_assigned' | 'task_assigned' | 'task_deadline' | 'task_completed';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  boards: Board[];
  notifications: Notification[];
  currentBoardId: string | null;
  isAuthenticated: boolean;
  savedCredentials: { username: string; password: string } | null;
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  createdTasks: number;
}