// User and Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

/**
 * Sign-in result. The session token is not part of this payload — it arrives
 * as an HttpOnly cookie that JavaScript cannot read, so it can never be
 * exfiltrated by an XSS bug or written into localStorage.
 */
export interface AuthResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // ADMIN is not self-assignable; the backend rejects it.
  role?: 'INSTRUCTOR' | 'STUDENT';
}



// Course types
export interface Course {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;

  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    materials: number;
    questions: number;
  };
}

export interface CreateCourseData {
  name: string;
  description?: string;
}

// Material types
export interface Material {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  courseId: string;
  createdAt: string;
  uploadedById?: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Question types
export interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
  questionId: string;
}

export interface Question {
  id: string;
  content: string;
  hint?: string;
  contentType?: 'text' | 'image';
  imageUrl?: string;
  aiGenerated: boolean;
  approved: boolean;
  courseId: string;
  createdById?: string;
  createdAt: string;
  answers: Answer[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateQuestionData {
  content: string;
  hint?: string;
  courseId: string;
  answers: { content: string; isCorrect: boolean }[];
}

export interface GenerateQuestionsData {
  courseId: string;
  topic: string;
  count?: number;
  materialId?: string;
}

// Attempt types
export interface Attempt {
  id: string;
  isCorrect: boolean;
  createdAt: string;
  question: Question;
  selectedAnswerIds: string[];
}

export interface AttemptResult {
  id: string;
  isCorrect: boolean;
  selectedAnswerIds: string[];
  correctAnswerIds: string[];
  hint?: string;
  question: {
    id: string;
    content: string;
  };
}

export interface AttemptStats {
  overall: {
    total: number;
    correct: number;
    percentage: number;
  };
  byCourse: Record<string, { total: number; correct: number }>;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  totalQuestions: number;
  answered: number;
  correct: number;
  remaining: number;
  percentage: number;
  isCompleted?: boolean;
}

export interface QuizProgress {
  id: string;
  userId: string;
  courseId: string;
  currentIndex: number;
  isCompleted: boolean;
  lastAnsweredAt: string;
  createdAt: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  userId: string | null;
}

export interface LeaderboardResponse {
  courseName: string;
  entries: LeaderboardEntry[];
}

// Billing types
export interface SubscriptionStatus {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  subscription: {
    id: string;
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}
