import { create } from 'zustand';

// Types
interface User {
  userId: string;
  username: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  firstName: string;
  lastName: string;
}

interface Course {
  courseId: string;
  name: string;
  description: string;
  credits: number;
}

interface Assignment {
  assignmentId: string;
  title: string;
  dueDate: string;
  course: Course;
}

interface LeaveRequest {
  leaveId: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'annual';
  status: 'pending' | 'approved' | 'rejected';
}

interface AttendanceRecord {
  attId: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  isLate: boolean;
}

interface Announcement {
  annId: string;
  title: string;
  content: string;
  date: string;
  is_active: boolean;
}

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Courses state
  courses: Course[];
  enrolledCourses: Course[];
  setCourses: (courses: Course[]) => void;
  setEnrolledCourses: (courses: Course[]) => void;
  
  // Assignments state
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  
  // Leave requests state
  leaveRequests: LeaveRequest[];
  setLeaveRequests: (requests: LeaveRequest[]) => void;
  
  // Attendance state
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  
  // Announcements state
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Reset state
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial user state
  user: null,
  setUser: (user) => set({ user }),
  
  // Initial courses state
  courses: [],
  enrolledCourses: [],
  setCourses: (courses) => set({ courses }),
  setEnrolledCourses: (enrolledCourses) => set({ enrolledCourses }),
  
  // Initial assignments state
  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  
  // Initial leave requests state
  leaveRequests: [],
  setLeaveRequests: (leaveRequests) => set({ leaveRequests }),
  
  // Initial attendance state
  attendanceRecords: [],
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  
  // Initial announcements state
  announcements: [],
  setAnnouncements: (announcements) => set({ announcements }),
  
  // Initial UI state
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  // Reset all state
  reset: () => set({
    user: null,
    courses: [],
    enrolledCourses: [],
    assignments: [],
    leaveRequests: [],
    attendanceRecords: [],
    announcements: [],
    sidebarOpen: true,
  }),
}));
