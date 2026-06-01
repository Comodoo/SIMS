import { gql } from '@apollo/client';

// User mutations
export const CREATE_USER = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
      user {
        userId
        username
        email
        role
        firstName
        lastName
      }
      success
      message
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      user {
        userId
        username
        email
        role
        firstName
        lastName
      }
      token
      success
      message
    }
  }
`;

// Student mutations
export const CREATE_STUDENT = gql`
  mutation CreateStudent($input: StudentInput!) {
    createStudent(input: $input) {
      student {
        studentId
        user {
          userId
          username
          email
        }
        dateOfBirth
        address
        enrollmentDate
      }
      success
      message
    }
  }
`;

// Staff mutations
export const CREATE_STAFF = gql`
  mutation CreateStaff($input: StaffInput!) {
    createStaff(input: $input) {
      staff {
        staffId
        user {
          userId
          username
          email
        }
        position
        department
        hireDate
      }
      success
      message
    }
  }
`;

// Attendance mutations
export const CLOCK_IN = gql`
  mutation ClockIn($input: AttendanceInput!) {
    clockIn(input: $input) {
      attendance {
        attId
        user {
          userId
          firstName
          lastName
        }
        timestamp
        status
        isLate
      }
      success
      message
    }
  }
`;

export const CLOCK_OUT = gql`
  mutation ClockOut($input: AttendanceInput!) {
    clockOut(input: $input) {
      attendance {
        attId
        user {
          userId
          firstName
          lastName
        }
        timestamp
        status
      }
      success
      message
    }
  }
`;

export const MARK_STUDENT_ATTENDANCE = gql`
  mutation MarkStudentAttendance($studentId: ID!, $courseId: ID!, $status: String!, $date: String!) {
    markStudentAttendance(studentId: $studentId, courseId: $courseId, status: $status, date: $date) {
      attendance {
        attId
        user {
          userId
          firstName
          lastName
        }
        timestamp
        status
        isLate
      }
      success
      message
    }
  }
`;

// Course mutations
export const CREATE_COURSE = gql`
  mutation CreateCourse($input: CourseInput!) {
    createCourse(input: $input) {
      course {
        courseId
        courseCode
        name
        description
        credits
        status
      }
      success
      message
    }
  }
`;

export const ENROLL_STUDENT = gql`
  mutation EnrollStudent($input: EnrollmentInput!) {
    enrollStudent(input: $input) {
      enrollment {
        enrollmentId
        student {
          studentId
          user {
            firstName
            lastName
          }
        }
        course {
          courseId
          name
        }
        semester
        enrolledAt
      }
      success
      message
    }
  }
`;

// Assignment mutations
export const CREATE_ASSIGNMENT = gql`
  mutation CreateAssignment($input: AssignmentInput!) {
    createAssignment(input: $input) {
      assignment {
        assignmentId
        title
        description
        dueDate
        course {
          courseId
          name
        }
      }
      success
      message
    }
  }
`;

export const SUBMIT_ASSIGNMENT = gql`
  mutation SubmitAssignment($input: SubmissionInput!) {
    submitAssignment(input: $input) {
      submission {
        submissionId
        student {
          studentId
          user {
            firstName
            lastName
          }
        }
        assignment {
          assignmentId
          title
        }
        submittedAt
      }
      success
      message
    }
  }
`;

export const GRADE_SUBMISSION = gql`
  mutation GradeSubmission($input: GradeSubmissionInput!) {
    gradeSubmission(input: $input) {
      submission {
        submissionId
        grade
        gradedAt
      }
      success
      message
    }
  }
`;

// Leave mutations
export const CREATE_LEAVE_REQUEST = gql`
  mutation CreateLeaveRequest($input: LeaveInput!) {
    createLeaveRequest(input: $input) {
      leave {
        leaveId
        staff {
          staffId
          user {
            firstName
            lastName
          }
        }
        leaveType
        startDate
        endDate
        status
      }
      success
      message
    }
  }
`;

export const APPROVE_LEAVE = gql`
  mutation ApproveLeave($input: LeaveApprovalInput!) {
    approveLeave(input: $input) {
      leave {
        leaveId
        status
        approvedAt
        approvedBy {
          userId
          firstName
          lastName
        }
      }
      success
      message
    }
  }
`;

export const REJECT_LEAVE = gql`
  mutation RejectLeave($input: LeaveApprovalInput!) {
    rejectLeave(input: $input) {
      leave {
        leaveId
        status
        rejectionReason
        rejectedAt
        rejectedBy {
          userId
          firstName
          lastName
        }
      }
      success
      message
    }
  }
`;

// Announcement mutations
export const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement($input: AnnouncementInput!) {
    createAnnouncement(input: $input) {
      announcement {
        annId
        title
        content
        author {
          userId
          firstName
          lastName
        }
        targetRole
        priority
        createdAt
      }
      success
      message
    }
  }
`;

export const MARK_ANNOUNCEMENT_READ = gql`
  mutation MarkAnnouncementRead($input: MarkAnnouncementReadInput!) {
    markAnnouncementRead(input: $input) {
      success
      message
    }
  }
`;

// Notification mutations
export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: NotificationInput!) {
    createNotification(input: $input) {
      notification {
        notificationId
        user {
          userId
        }
        title
        message
        type
        createdAt
      }
      success
      message
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($input: MarkNotificationReadInput!) {
    markNotificationRead(input: $input) {
      success
      message
    }
  }
`;

// Report mutations
export const CREATE_REPORT = gql`
  mutation CreateReport($input: ReportInput!) {
    createReport(input: $input) {
      report {
        reportId
        title
        reportType
        format
        generatedBy {
          userId
          firstName
          lastName
        }
        generatedAt
      }
      success
      message
    }
  }
`;

export const CREATE_REPORT_SCHEDULE = gql`
  mutation CreateReportSchedule($input: ReportScheduleInput!) {
    createReportSchedule(input: $input) {
      schedule {
        scheduleId
        report {
          reportId
          title
        }
        frequency
        nextRunAt
      }
      success
      message
    }
  }
`;

// Subject-teacher assignment mutations
export const ASSIGN_TEACHER_TO_SUBJECT = gql`
  mutation AssignTeacherToSubject($input: AssignTeacherInput!, $assignedById: ID!) {
    assignTeacherToSubject(input: $input, assignedById: $assignedById) {
      success
      message
      assignment {
        id
        subjectId
        subjectName
        isPrimary
        assignedAt
        teacher {
          id
          user {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

export const REMOVE_TEACHER_FROM_SUBJECT = gql`
  mutation RemoveTeacherFromSubject($subjectId: ID!, $teacherId: ID!) {
    removeTeacherFromSubject(subjectId: $subjectId, teacherId: $teacherId) {
      success
      message
    }
  }
`;

// Timetable mutations
export const CREATE_TIMETABLE_SLOT = gql`
  mutation CreateTimetableSlot($input: TimetableInput!) {
    createTimetableSlot(input: $input) {
      success
      message
      slot {
        id
        classGroup
        dayOfWeek
        startTime
        endTime
        room
        subject {
          id
          name
          courseCode
        }
        teacher {
          id
          user { firstName lastName }
        }
      }
    }
  }
`;

export const UPDATE_TIMETABLE_SLOT = gql`
  mutation UpdateTimetableSlot($slotId: ID!, $input: TimetableInput!) {
    updateTimetableSlot(slotId: $slotId, input: $input) {
      success
      message
      slot {
        id
        classGroup
        dayOfWeek
        startTime
        endTime
        room
      }
    }
  }
`;

export const DELETE_TIMETABLE_SLOT = gql`
  mutation DeleteTimetableSlot($slotId: ID!) {
    deleteTimetableSlot(slotId: $slotId) {
      success
      message
    }
  }
`;

// Result card mutations
export const COMPUTE_RESULT_CARD = gql`
  mutation ComputeResultCard($input: ResultCardInput!, $computedById: ID!) {
    computeResultCard(input: $input, computedById: $computedById) {
      success
      message
      result {
        id
        semesterName
        cat1Score
        cat2Score
        examScore
        totalScore
        gradeLetter
        remarks
        student {
          id
          firstName
          lastName
        }
        subject {
          id
          name
          courseCode
        }
      }
    }
  }
`;

// Biometric attendance mutation
export const MARK_BIOMETRIC_ATTENDANCE = gql`
  mutation MarkStudentBiometricAttendance($studentId: ID!, $courseId: ID!, $biometricHash: String!) {
    markStudentBiometricAttendance(studentId: $studentId, courseId: $courseId, biometricHash: $biometricHash) {
      success
      message
    }
  }
`;
