// User and Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  organizationId: string;
  organizationName: string;
}

export interface AuthResponse {
  accessToken: string;
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
  organizationName?: string;
  role?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  userCount: number;
  courseCount: number;
}

export interface PlanLimits {
  maxCourses: number;
  maxQuestions: number;
  maxUsers: number;
}

// Course types
export interface Course {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  organizationId: string;
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
  uploadedBy: {
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
  aiGenerated: boolean;
  approved: boolean;
  courseId: string;
  createdAt: string;
  answers: Answer[];
  createdBy: {
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
