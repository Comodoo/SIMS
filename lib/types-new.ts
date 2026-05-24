// ============================================================================
// Integrated Student Information & Staff Attendance Management System
// TypeScript Type Definitions (Matching schema.txt requirements)
// ============================================================================

// ============================================================================
// 1. CORE USER MANAGEMENT (Users Table)
// ============================================================================

export type UserRole = 'admin' | 'staff' | 'student' | 'parent';

export interface User {
  user_id: string;
  username: string;
  email: string;
  password: string; // Encrypted with AES-256
  role: UserRole;
  biometric_hash?: string; // Fingerprint template (mathematical string, not image)
  phone?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// 2. STUDENT MANAGEMENT (Students Table)
// ============================================================================

export interface Student {
  student_id: string;
  user_id: string; // FK to Users
  student_number: string; // Unique student ID
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  address?: string;
  enrollment_date: Date;
  graduation_date?: Date;
  status: 'active' | 'graduated' | 'suspended' | 'withdrawn';
  grade_level?: string;
  section?: string;
  // JSON field for flexible grade storage
  academic_records?: {
    gpa?: number;
    total_credits?: number;
    academic_standing?: 'good' | 'probation' | 'suspension';
    [key: string]: unknown;
  };
  // Relations
  user?: User;
  enrollments?: Enrollment[];
  parents?: Parent[];
  attendance_records?: StudentAttendance[];
}

// ============================================================================
// 3. STAFF MANAGEMENT (Staff Table)
// ============================================================================

export type StaffPosition = 'teacher' | 'administrator' | 'support' | 'principal' | 'hr';
export type Department = 'academics' | 'administration' | 'finance' | 'hr' | 'it' | 'maintenance';

export interface Staff {
  staff_id: string;
  user_id: string; // FK to Users
  staff_number: string;
  position: StaffPosition;
  department: Department;
  hire_date: Date;
  termination_date?: Date;
  salary?: number; // Optional, encrypted
  shift_start_time: string; // Format: "HH:MM" (e.g., "08:00")
  shift_end_time: string; // Format: "HH:MM" (e.g., "17:00")
  late_threshold_minutes: number; // Default 15 minutes
  is_active: boolean;
  // Relations
  user?: User;
  courses?: Course[];
  attendance_records?: Attendance[];
  leave_requests?: Leave[];
}

// ============================================================================
// 4. BIOMETRIC ATTENDANCE SYSTEM (Attendance Table)
// ============================================================================

export type AttendanceStatus = 'in' | 'out';
export type AttendanceMethod = 'biometric' | 'manual' | 'card';

export interface Attendance {
  att_id: string;
  user_id: string; // FK to Users (staff primarily)
  staff_id?: string; // FK to Staff
  timestamp: Date;
  status: AttendanceStatus; // 'in' or 'out'
  method: AttendanceMethod;
  is_late: boolean;
  late_minutes?: number;
  notes?: string;
  verified_by?: string; // Admin who verified (for manual entries)
  biometric_match_score?: number; // Confidence score from fingerprint scanner
  device_id?: string; // ID of the biometric device used
  location?: string; // GPS coordinates or location name
  // Relations
  user?: User;
  staff?: Staff;
}

// Student-specific attendance (separate from staff attendance)
export interface StudentAttendance {
  student_att_id: string;
  student_id: string; // FK to Students
  course_id?: string; // FK to Courses (optional - for course-specific attendance)
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string; // Staff ID who marked attendance
  marked_at: Date;
  notes?: string;
  // Parent notification tracking
  parent_notified: boolean;
  notification_sent_at?: Date;
  // Relations
  student?: Student;
  course?: Course;
}

// ============================================================================
// 5. COURSE MANAGEMENT (Courses Table)
// ============================================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'active' | 'inactive' | 'archived';

export interface Course {
  course_id: string;
  course_code: string;
  name: string;
  description?: string;
  staff_id: string; // FK to Staff (instructor)
  credits: number;
  level: CourseLevel;
  status: CourseStatus;
  semester?: string;
  academic_year?: string;
  start_date?: Date;
  end_date?: Date;
  max_students?: number;
  schedule?: {
    day: string;
    start_time: string;
    end_time: string;
    room?: string;
  }[];
  created_at: Date;
  updated_at: Date;
  // Relations
  instructor?: Staff;
  enrollments?: Enrollment[];
  assignments?: Assignment[];
  student_attendance?: StudentAttendance[];
}

// ============================================================================
// 6. ENROLLMENT MANAGEMENT (Enrollment Table)
// ============================================================================

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'withdrawn';

export interface Enrollment {
  enrollment_id: string;
  student_id: string; // FK to Students
  course_id: string; // FK to Courses
  semester: string;
  academic_year: string;
  enrollment_date: Date;
  status: EnrollmentStatus;
  // Grading
  midterm_grade?: string;
  final_grade?: string;
  numeric_grade?: number; // 0-100
  grade_points?: number; // GPA contribution
  passed: boolean;
  // Attendance tracking
  attendance_percentage?: number;
  // Relations
  student?: Student;
  course?: Course;
}

// ============================================================================
// 7. ANNOUNCEMENTS SYSTEM (Announcements Table)
// ============================================================================

export type AnnouncementTarget = 'all' | 'students' | 'staff' | 'parents' | 'specific_course';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  ann_id: string;
  title: string;
  content: string;
  date: Date;
  author_id: string; // FK to Users
  target_role: AnnouncementTarget;
  course_id?: string; // If target is specific_course
  priority: AnnouncementPriority;
  is_active: boolean;
  expiry_date?: Date;
  requires_acknowledgment: boolean;
  created_at: Date;
  updated_at: Date;
  // Relations
  author?: User;
  course?: Course;
  read_receipts?: AnnouncementRead[];
}

export interface AnnouncementRead {
  read_id: string;
  announcement_id: string;
  user_id: string;
  read_at: Date;
  acknowledged: boolean;
  // Relations
  announcement?: Announcement;
  user?: User;
}

// ============================================================================
// 8. LEAVE MANAGEMENT (Leaves Table)
// ============================================================================

export type LeaveType = 'sick' | 'annual' | 'emergency' | 'maternity' | 'paternity' | 'unpaid' | 'study';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Leave {
  leave_id: string;
  staff_id: string; // FK to Staff
  leave_type: LeaveType;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason?: string;
  status: LeaveStatus;
  applied_at: Date;
  approved_by?: string; // Admin ID
  approved_at?: Date;
  rejection_reason?: string;
  supporting_documents?: string[]; // URLs to uploaded files
  // Relations
  staff?: Staff;
  approver?: User;
}

// ============================================================================
// 9. ASSIGNMENTS (Assignments Table)
// ============================================================================

export interface Assignment {
  assign_id: string;
  course_id: string; // FK to Courses
  title: string;
  description?: string;
  instructions?: string;
  total_marks: number;
  due_date: Date;
  allow_late_submission: boolean;
  late_penalty_percent?: number;
  file_url?: string; // Assignment material
  attachment_type?: 'pdf' | 'doc' | 'link' | 'none';
  created_by: string; // Staff ID
  created_at: Date;
  updated_at: Date;
  // Relations
  course?: Course;
  submissions?: Submission[];
  creator?: Staff;
}

// ============================================================================
// 10. SUBMISSIONS (Submissions Table)
// ============================================================================

export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'late';

export interface Submission {
  sub_id: string;
  student_id: string; // FK to Students
  assign_id: string; // FK to Assignments
  file_url: string;
  file_name?: string;
  file_size?: number;
  submitted_at: Date;
  status: SubmissionStatus;
  // Grading
  grade?: number;
  max_grade?: number;
  feedback?: string;
  graded_by?: string; // Staff ID
  graded_at?: Date;
  // Relations
  student?: Student;
  assignment?: Assignment;
  grader?: Staff;
}

// ============================================================================
// 11. PARENTS (Parents Table)
// ============================================================================

export interface Parent {
  parent_id: string;
  user_id?: string; // Optional FK to Users (if parent has portal access)
  first_name: string;
  last_name: string;
  phone: string; // Primary contact for SMS
  email?: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  address?: string;
  emergency_contact: boolean;
  // Relations - Parents can have multiple students
  students?: Student[];
  // Notification preferences
  notification_prefs?: {
    absence_alerts: boolean;
    grade_updates: boolean;
    general_announcements: boolean;
  };
}

// Link table for Parent-Student relationship
export interface ParentStudentLink {
  link_id: string;
  parent_id: string;
  student_id: string;
  is_primary: boolean;
  // Relations
  parent?: Parent;
  student?: Student;
}

// ============================================================================
// 12. REPORTS (Reports Table)
// ============================================================================

export type ReportType = 
  | 'attendance_monthly' 
  | 'attendance_daily' 
  | 'enrollment_trends' 
  | 'grades_summary' 
  | 'staff_performance' 
  | 'financial_summary'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportStatus = 'generating' | 'completed' | 'failed';

export interface Report {
  report_id: string;
  type: ReportType;
  title: string;
  description?: string;
  generated_by: string; // FK to Users
  generated_at: Date;
  date_from?: Date;
  date_to?: Date;
  filters?: Record<string, unknown>; // JSON filter criteria used
  format: ReportFormat;
  file_url?: string;
  file_size?: number;
  status: ReportStatus;
  error_message?: string;
  // Relations
  generator?: User;
}

// ============================================================================
// ADDITIONAL SUPPORTING TYPES
// ============================================================================

// Biometric Device Management
export interface BiometricDevice {
  device_id: string;
  name: string;
  location: string;
  device_type: 'fingerprint' | 'facial' | 'card';
  is_active: boolean;
  last_sync?: Date;
  ip_address?: string;
}

// Audit Logging
export interface AuditLog {
  log_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

// Dashboard Statistics
export interface DashboardStats {
  // General
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  
  // Attendance (Today)
  staffPresent: number;
  staffAbsent: number;
  staffLate: number;
  studentsPresent: number;
  studentsAbsent: number;
  
  // Pending Actions
  pendingLeaves: number;
  pendingSubmissions: number;
  ungradedAssignments: number;
  
  // Trends
  attendanceTrend: { date: string; present: number; absent: number }[];
  enrollmentTrend: { month: string; count: number }[];
}

// Real-time WebSocket Events
export interface AttendanceEvent {
  type: 'clock_in' | 'clock_out';
  user_id: string;
  staff_name: string;
  timestamp: Date;
  is_late: boolean;
  department?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// Filter Types
export interface AttendanceFilter extends PaginationParams {
  user_id?: string;
  staff_id?: string;
  date_from?: Date;
  date_to?: Date;
  status?: AttendanceStatus;
  is_late?: boolean;
  department?: Department;
}

export interface LeaveFilter extends PaginationParams {
  staff_id?: string;
  status?: LeaveStatus;
  leave_type?: LeaveType;
  date_from?: Date;
  date_to?: Date;
}

export interface EnrollmentFilter extends PaginationParams {
  student_id?: string;
  course_id?: string;
  semester?: string;
  academic_year?: string;
  status?: EnrollmentStatus;
}
