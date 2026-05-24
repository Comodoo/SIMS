'use server';

// Database Schema Types for AfriLearn LMS
// This file defines the database structure that can be used with any database provider

export interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin' | 'employer';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  phone?: string;
  country?: string;
  timezone?: string;
  preferredLanguage: string;
  
  // Profile
  bio?: string;
  headline?: string;
  website?: string;
  linkedIn?: string;
  twitter?: string;
  
  // Settings
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Subscription
  subscriptionTier: 'free' | 'basic' | 'pro' | 'career_track';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'expired';
  subscriptionExpiresAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface DBCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  instructorId: string;
  
  // Content
  thumbnail: string;
  previewVideoUrl?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  language: string;
  subtitles: string[];
  
  // Pricing
  price: number;
  currency: string;
  discountPrice?: number;
  discountExpiresAt?: Date;
  
  // Settings
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  status: 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived';
  isPublic: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  
  // Requirements
  prerequisites: string[];
  targetAudience: string[];
  learningOutcomes: string[];
  
  // Stats (denormalized for performance)
  totalStudents: number;
  totalRatings: number;
  averageRating: number;
  totalRevenue: number;
  completionRate: number;
  
  // Duration
  totalDurationMinutes: number;
  totalLessons: number;
  totalSections: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface DBSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBLesson {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'live' | 'download';
  orderIndex: number;
  
  // Content
  videoUrl?: string;
  videoDurationSeconds?: number;
  articleContent?: string;
  attachments: { name: string; url: string; size: number }[];
  
  // Settings
  isPreview: boolean;
  isPublished: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DBQuiz {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  showAnswersAfter: 'immediately' | 'after_submission' | 'after_deadline' | 'never';
  createdAt: Date;
  updatedAt: Date;
}

export interface DBQuizQuestion {
  id: string;
  quizId: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  orderIndex: number;
  createdAt: Date;
}

export interface DBEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'expired' | 'refunded';
  
  // Progress
  progressPercent: number;
  completedLessons: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt?: Date;
  
  // Payment
  paymentId?: string;
  paidAmount: number;
  currency: string;
  paymentMethod: string;
  
  // Completion
  completedAt?: Date;
  certificateId?: string;
  finalGrade?: number;
  
  // Timestamps
  enrolledAt: Date;
  expiresAt?: Date;
}

export interface DBLessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  userId: string;
  courseId: string;
  
  // Progress
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  watchedSeconds?: number;
  
  // Quiz
  quizAttempts?: number;
  quizBestScore?: number;
  quizLastAttemptAt?: Date;
  
  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface DBPayment {
  id: string;
  userId: string;
  type: 'course' | 'subscription' | 'cohort';
  referenceId: string; // courseId, subscriptionId, or cohortId
  
  // Amount
  amount: number;
  currency: string;
  platformFee: number;
  instructorPayout: number;
  
  // Payment details
  method: 'card' | 'mpesa' | 'mtn_momo' | 'airtel_money' | 'paypal' | 'bank_transfer';
  providerTransactionId?: string;
  providerResponse?: Record<string, unknown>;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
  failureReason?: string;
  
  // Billing
  billingName?: string;
  billingEmail?: string;
  billingCountry?: string;
  billingAddress?: string;
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

export interface DBCertificate {
  id: string;
  verificationCode: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  
  // Details
  recipientName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  grade?: number;
  
  // Verification
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  
  // Stats
  viewCount: number;
  downloadCount: number;
  
  // Timestamps
  issuedAt: Date;
  expiresAt?: Date;
}

export interface DBReview {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  
  rating: number;
  title?: string;
  content: string;
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderatedAt?: Date;
  moderatorNote?: string;
  
  // Instructor response
  instructorResponse?: string;
  instructorRespondedAt?: Date;
  
  // Engagement
  helpfulCount: number;
  reportCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DBConversation {
  id: string;
  type: 'direct' | 'course' | 'support' | 'group';
  title?: string;
  courseId?: string;
  participantIds: string[];
  
  // Settings
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  
  // Stats
  unreadCounts: Record<string, number>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

export interface DBMessage {
  id: string;
  conversationId: string;
  senderId: string;
  
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  content: string;
  attachments?: { name: string; url: string; type: string; size: number }[];
  
  // Reply
  replyToId?: string;
  
  // Status
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: { participantId: string; readAt: Date }[];
  
  // Editing
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  
  // Timestamps
  createdAt: Date;
}

export interface DBNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
  expiresAt?: Date;
}

export interface DBCohort {
  id: string;
  courseId: string;
  instructorId: string;
  name: string;
  description: string;
  
  // Schedule
  startDate: Date;
  endDate: Date;
  enrollmentDeadline: Date;
  
  // Capacity
  maxStudents: number;
  currentStudents: number;
  
  // Pricing
  price: number;
  currency: string;
  
  // Status
  status: 'upcoming' | 'enrolling' | 'in_progress' | 'completed' | 'cancelled';
  
  // Features
  hasLiveSessions: boolean;
  hasGroupAssignments: boolean;
  hasMentor: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DBJobPosting {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  
  linkedCourseIds: string[];
  
  status: 'open' | 'closed' | 'paused';
  applicationDeadline?: Date;
  applicantCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DBJobApplication {
  id: string;
  jobId: string;
  userId: string;
  
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  
  matchScore: number;
  
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected';
  statusNote?: string;
  
  appliedAt: Date;
  updatedAt: Date;
}

// Audit log for tracking changes
export interface DBAuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
