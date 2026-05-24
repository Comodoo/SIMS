/**
 * GraphQL Queries and Mutations for SIMS Frontend
 * Pre-defined queries/mutations for common operations
 */

import { query, mutate } from './graphql';

// ==================== AUTH ====================

export const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!, $role: String) {
    login(username: $username, password: $password, role: $role) {
      success
      message
      user {
        id
        username
        email
        first_name
        last_name
        role
        phone
        is_active
      }
      token
    }
  }
`;

export async function login(username: string, password: string, role?: string) {
  return mutate('login', LOGIN_MUTATION, { username, password, role });
}

// ==================== STUDENTS ====================

export const STUDENT_PROFILE_QUERY = `
  query StudentProfile {
    studentByNumber(studentNumber: "STU001") {
      id
      student_number
      first_name
      last_name
      date_of_birth
      address
      enrollment_date
      status
      grade_level
      section
      user {
        username
        email
        role
      }
    }
  }
`;

export const STUDENT_ATTENDANCE_QUERY = `
  query StudentAttendance($studentId: ID!) {
    studentAttendanceRecords(studentId: $studentId, limit: 50) {
      id
      date
      status
      course
      marked_by {
        username
        first_name
        last_name
      }
      marked_at
      notes
      parent_notified
    }
  }
`;

export const STUDENT_BIOMETRIC_ATTENDANCE_MUTATION = `
  mutation MarkStudentBiometricAttendance($studentId: ID!, $courseId: ID!, $biometricHash: String!) {
    markStudentBiometricAttendance(studentId: $studentId, courseId: $courseId, biometricHash: $biometricHash) {
      success
      message
    }
  }
`;

// ==================== STAFF ====================

export const STAFF_PROFILE_QUERY = `
  query StaffProfile {
    staffByNumber(staffNumber: "STA001") {
      id
      staff_number
      position
      department
      hire_date
      shift_start_time
      shift_end_time
      late_threshold_minutes
      is_active
      user {
        username
        email
        first_name
        last_name
        role
      }
    }
  }
`;

export const STAFF_ATTENDANCE_QUERY = `
  query StaffAttendance($userId: ID!) {
    attendanceRecords(userId: $userId, limit: 50) {
      id
      timestamp
      status
      method
      is_late
      late_minutes
      notes
      device_id
      location
    }
  }
`;

export const CLOCK_IN_MUTATION = `
  mutation ClockIn($userId: ID!, $method: String, $deviceId: String, $location: String) {
    clockIn(input: { user_id: $userId, method: $method, device_id: $deviceId, location: $location }) {
      success
      message
      attendance {
        id
        timestamp
        status
        is_late
        late_minutes
      }
    }
  }
`;

export const CLOCK_OUT_MUTATION = `
  mutation ClockOut($userId: ID!, $method: String, $deviceId: String, $location: String) {
    clockOut(input: { user_id: $userId, method: $method, device_id: $deviceId, location: $location }) {
      success
      message
      attendance {
        id
        timestamp
        status
      }
    }
  }
`;

// ==================== ACADEMICS ====================

export const COURSES_QUERY = `
  query Courses {
    courses(limit: 50) {
      id
      course_code
      name
      description
      credits
      status
      level
      department
      schedule
      semester
      academic_year
      max_students
    }
  }
`;

export const ASSIGNMENTS_QUERY = `
  query Assignments($courseId: ID) {
    assignments(limit: 50) {
      id
      title
      description
      assignment_type
      due_date
      total_marks
      attachment_url
      is_published
      allow_late_submission
      course {
        id
        course_code
        name
      }
    }
  }
`;

export const CREATE_ASSIGNMENT_MUTATION = `
  mutation CreateAssignment($input: AssignmentInput!) {
    createAssignment(input: $input) {
      success
      message
      assignment {
        id
        title
        description
        due_date
        total_marks
        is_published
      }
    }
  }
`;

export const SUBMIT_ASSIGNMENT_MUTATION = `
  mutation SubmitAssignment($input: SubmissionInput!) {
    submitAssignment(input: $input) {
      success
      message
      submission {
        id
        submitted_at
        status
        file_url
      }
    }
  }
`;

export const GRADE_SUBMISSION_MUTATION = `
  mutation GradeSubmission($input: GradeSubmissionInput!) {
    gradeSubmission(input: $input) {
      success
      message
      submission {
        id
        grade
        feedback
        graded_at
      }
    }
  }
`;

export const ENROLLMENTS_QUERY = `
  query Enrollments($studentId: ID) {
    enrollments(limit: 50) {
      id
      semester
      academic_year
      status
      midterm_grade
      final_grade
      letter_grade
      student {
        id
        student_number
        first_name
        last_name
      }
      course {
        id
        course_code
        name
        credits
      }
    }
  }
`;

export const ENROLL_STUDENT_MUTATION = `
  mutation EnrollStudent($input: EnrollmentInput!) {
    enrollStudent(input: $input) {
      success
      message
    }
  }
`;

// ==================== USERS ====================

export const USERS_QUERY = `
  query Users($role: String, $isActive: Boolean) {
    users(role: $role, is_active: $isActive, limit: 50) {
      id
      username
      email
      first_name
      last_name
      role
      phone
      is_active
      created_at
    }
  }
`;

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
      success
      message
      user {
        id
        username
        email
        first_name
        last_name
        role
      }
    }
  }
`;

export const CREATE_STUDENT_MUTATION = `
  mutation CreateStudent($input: StudentInput!) {
    createStudent(input: $input) {
      success
      message
      student {
        id
        student_number
        first_name
        last_name
        grade_level
        section
      }
    }
  }
`;

export const CREATE_STAFF_MUTATION = `
  mutation CreateStaff($input: StaffInput!) {
    createStaff(input: $input) {
      success
      message
      staff {
        id
        staff_number
        position
        department
        hire_date
      }
    }
  }
`;

// ==================== PARENTS ====================

export const PARENTS_QUERY = `
  query Parents($relationship: String, $emergencyContact: Boolean) {
    parents(relationship: $relationship, emergency_contact: $emergencyContact, limit: 50) {
      id
      first_name
      last_name
      phone
      email
      relationship
      emergency_contact
    }
  }
`;
