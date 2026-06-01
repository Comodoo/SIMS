import { gql } from '@apollo/client';

// User queries
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      userId
      username
      email
      role
      firstName
      lastName
      phone
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: ID!) {
    user(userId: $userId) {
      userId
      username
      email
      role
      firstName
      lastName
      phone
      createdAt
    }
  }
`;

// Student queries
export const GET_STUDENT_PROFILE = gql`
  query GetStudentProfile($studentId: ID!) {
    student(studentId: $studentId) {
      studentId
      user {
        userId
        username
        email
        firstName
        lastName
      }
      dateOfBirth
      address
      grades
      enrollmentDate
    }
  }
`;

export const GET_STUDENT_ENROLLMENTS = gql`
  query GetStudentEnrollments($studentId: ID!) {
    enrollments(studentId: $studentId) {
      enrollmentId
      student {
        studentId
      }
      course {
        courseId
        courseCode
        name
        credits
        description
      }
      semester
      grade
      enrolledAt
    }
  }
`;

// Staff queries
export const GET_STAFF_PROFILE = gql`
  query GetStaffProfile($staffId: ID!) {
    staff(staffId: $staffId) {
      staffId
      user {
        userId
        username
        email
        firstName
        lastName
      }
      position
      department
      hireDate
      salary
    }
  }
`;

export const GET_STAFF_COURSES = gql`
  query GetStaffCourses($staffId: ID!) {
    coursesByStaff(staffId: $staffId) {
      courseId
      courseCode
      name
      description
      credits
      status
      level
    }
  }
`;

// Course queries
export const GET_ALL_COURSES = gql`
  query GetAllCourses {
    courses {
      courseId
      courseCode
      name
      description
      credits
      status
      level
    }
  }
`;

export const GET_COURSE_BY_ID = gql`
  query GetCourseById($courseId: ID!) {
    course(courseId: $courseId) {
      courseId
      courseCode
      name
      description
      credits
      status
      level
      staff {
        staffId
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

// Assignment queries
export const GET_ASSIGNMENTS_BY_COURSE = gql`
  query GetAssignmentsByCourse($courseId: ID!) {
    assignmentsByCourse(courseId: $courseId) {
      assignmentId
      title
      description
      dueDate
      fileUrl
      maxPoints
      course {
        courseId
        name
      }
    }
  }
`;

export const GET_SUBMISSIONS_BY_ASSIGNMENT = gql`
  query GetSubmissionsByAssignment($assignmentId: ID!) {
    submissionsByAssignment(assignmentId: $assignmentId) {
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
      fileUrl
      submittedAt
      grade
    }
  }
`;

// Attendance queries
export const GET_USER_ATTENDANCE = gql`
  query GetUserAttendance($userId: ID!) {
    attendanceByUser(userId: $userId) {
      attId
      user {
        userId
        firstName
        lastName
      }
      timestamp
      status
      isLate
      notes
    }
  }
`;

export const GET_TODAY_ATTENDANCE = gql`
  query GetTodayAttendance {
    todayAttendance {
      attId
      user {
        userId
        firstName
        lastName
        role
      }
      timestamp
      status
      isLate
    }
  }
`;

// Leave queries
export const GET_LEAVE_REQUESTS = gql`
  query GetLeaveRequests($staffId: ID!) {
    leavesByStaff(staffId: $staffId) {
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
      totalDays
      reason
      status
      createdAt
    }
  }
`;

export const GET_ALL_LEAVE_REQUESTS = gql`
  query GetAllLeaveRequests {
    leaves {
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
      totalDays
      reason
      status
      createdAt
    }
  }
`;

// Announcement queries
export const GET_ANNOUNCEMENTS = gql`
  query GetAnnouncements {
    announcements {
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
      isActive
    }
  }
`;

export const GET_ANNOUNCEMENTS_BY_ROLE = gql`
  query GetAnnouncementsByRole($targetRole: String!) {
    announcementsByRole(targetRole: $targetRole) {
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
      isActive
    }
  }
`;

// Notification queries
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: ID!) {
    notificationsByUser(userId: $userId) {
      notificationId
      user {
        userId
      }
      title
      message
      type
      isRead
      createdAt
    }
  }
`;

// Report queries
export const GET_REPORTS = gql`
  query GetReports {
    reports {
      reportId
      title
      description
      reportType
      format
      status
      generatedBy {
        userId
        firstName
        lastName
      }
      generatedAt
      data
      fileUrl
    }
  }
`;

// Subject-Teacher queries
export const GET_SUBJECT_TEACHERS = gql`
  query GetSubjectTeachers($subjectId: ID, $teacherId: ID) {
    subjectTeachers(subjectId: $subjectId, teacherId: $teacherId) {
      id
      subjectId
      subjectName
      isPrimary
      assignedAt
      teacher {
        id
        staffNumber
        position
        user {
          firstName
          lastName
          email
        }
      }
    }
  }
`;

// Timetable queries
export const GET_TIMETABLE = gql`
  query GetTimetable($semesterId: ID, $classGroup: String, $teacherId: ID, $dayOfWeek: String) {
    timetable(semesterId: $semesterId, classGroup: $classGroup, teacherId: $teacherId, dayOfWeek: $dayOfWeek) {
      id
      classGroup
      dayOfWeek
      startTime
      endTime
      room
      semesterName
      subject {
        id
        name
        courseCode
      }
      teacher {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

// Result card queries
export const GET_RESULT_CARDS = gql`
  query GetResultCards($studentId: ID, $semesterId: ID, $subjectId: ID) {
    resultCards(studentId: $studentId, semesterId: $semesterId, subjectId: $subjectId) {
      id
      semesterName
      cat1Score
      cat2Score
      examScore
      totalScore
      gradeLetter
      remarks
      computedAt
      student {
        id
        studentNumber
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
`;

export const GET_STUDENT_ATTENDANCE_BY_SUBJECT = gql`
  query GetStudentAttendance($studentId: ID, $dateFrom: String, $dateTo: String) {
    studentAttendanceRecords(studentId: $studentId, dateFrom: $dateFrom, dateTo: $dateTo) {
      id
      studentId
      courseId
      date
      status
    }
  }
`;
