'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Course,
  Section,
  Lesson,
  Material,
  Enrollment,
  User,
  Review,
  ReviewStatus,
  Note,
  CourseFormData,
  SectionFormData,
  LessonFormData,
  StudentProfile,
  Skill,
  Education,
  Certification,
  WorkExperience,
  Project,
  CourseRecommendation,
  LearningPath,
  StudentEnrollmentInfo,
  InstitutionUser,
  InstitutionUserRole,
  InstitutionUserStatus,
  ROLE_PRESETS,
  CartItem,
  Coupon,
  Order,
  Question,
  Answer,
  Announcement,
  Certificate,
  SAMPLE_COUPONS,
} from './types';
import { generateId, generateSlug, sampleCourses, sampleUsers, sampleInstitutionUsers } from './sample-data';

interface LMSContextType {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: 'instructor' | 'student') => void;

  // Courses
  courses: Course[];
  getCourse: (id: string) => Course | undefined;
  getCourseBySlug: (slug: string) => Course | undefined;
  getInstructorCourses: (instructorId: string) => Course[];
  createCourse: (data: CourseFormData) => Course;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  publishCourse: (id: string) => void;
  archiveCourse: (id: string) => void;

  // Sections
  addSection: (courseId: string, data: SectionFormData) => Section;
  updateSection: (courseId: string, sectionId: string, data: SectionFormData) => void;
  deleteSection: (courseId: string, sectionId: string) => void;
  reorderSections: (courseId: string, sectionIds: string[]) => void;

  // Lessons
  addLesson: (courseId: string, sectionId: string, data: LessonFormData) => Lesson;
  updateLesson: (courseId: string, sectionId: string, lessonId: string, data: Partial<Lesson>) => void;
  deleteLesson: (courseId: string, sectionId: string, lessonId: string) => void;
  reorderLessons: (courseId: string, sectionId: string, lessonIds: string[]) => void;

  // Materials
  addMaterial: (courseId: string, sectionId: string, lessonId: string, material: Omit<Material, 'id' | 'lessonId'>) => void;
  deleteMaterial: (courseId: string, sectionId: string, lessonId: string, materialId: string) => void;

  // Enrollments
  enrollments: Enrollment[];
  enrollInCourse: (courseId: string) => void;
  getEnrollment: (courseId: string) => Enrollment | undefined;
  getUserEnrollments: () => Enrollment[];
  updateProgress: (enrollmentId: string, lessonId: string) => void;
  markLessonComplete: (enrollmentId: string, lessonId: string) => void;

  // Reviews
  reviews: Review[];
  addReview: (courseId: string, rating: number, comment: string) => void;
  getCourseReviews: (courseId: string) => Review[];
  getApprovedCourseReviews: (courseId: string) => Review[];
  getInstructorReviews: (instructorId: string) => Review[];
  approveReview: (reviewId: string) => void;
  rejectReview: (reviewId: string, reason?: string) => void;
  replyToReview: (reviewId: string, reply: string) => void;
  deleteReview: (reviewId: string) => void;
  updateReview: (reviewId: string, data: Partial<Review>) => void;

  // Student management
  getInstructorStudents: (instructorId: string) => StudentEnrollmentInfo[];
  removeStudentFromCourse: (userId: string, courseId: string) => void;

  // Institution user / team management
  institutionUsers: InstitutionUser[];
  createInstitutionUser: (data: Omit<InstitutionUser, 'id' | 'institutionId' | 'invitedBy' | 'joinedAt' | 'createdAt' | 'updatedAt'>) => InstitutionUser;
  updateInstitutionUser: (id: string, data: Partial<InstitutionUser>) => void;
  deleteInstitutionUser: (id: string) => void;
  getInstitutionUser: (id: string) => InstitutionUser | undefined;
  assignUserToCourse: (userId: string, courseId: string) => void;
  unassignUserFromCourse: (userId: string, courseId: string) => void;
  getCourseAssignedUsers: (courseId: string) => InstitutionUser[];
  getUserAssignedCourses: (userId: string) => Course[];

  // Notes
  notes: Note[];
  addNote: (lessonId: string, content: string, timestamp?: number) => void;
  updateNote: (noteId: string, content: string) => void;
  deleteNote: (noteId: string) => void;
  getLessonNotes: (lessonId: string) => Note[];

  // Student Profile
  studentProfile: StudentProfile | null;
  updateStudentProfile: (data: Partial<StudentProfile>) => void;
  completeOnboardingStep: (step: number) => void;
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  removeSkill: (skillId: string) => void;
  updateSkill: (skillId: string, data: Partial<Skill>) => void;
  addEducation: (education: Omit<Education, 'id'>) => void;
  removeEducation: (educationId: string) => void;
  updateEducation: (educationId: string, data: Partial<Education>) => void;
  addWorkExperience: (experience: Omit<WorkExperience, 'id'>) => void;
  removeWorkExperience: (experienceId: string) => void;
  updateWorkExperience: (experienceId: string, data: Partial<WorkExperience>) => void;
  addCertification: (certification: Omit<Certification, 'id'>) => void;
  removeCertification: (certificationId: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;

  // Course Recommendations
  getRecommendedCourses: () => CourseRecommendation[];
  getCoursePool: () => Course[];
  getLearningPaths: () => LearningPath[];

  // Cart & Checkout
  cart: CartItem[];
  addToCart: (courseId: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  getCartTotal: () => { subtotal: number; discount: number; total: number };
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  checkout: (paymentMethod: Order['paymentMethod']) => Order;
  orders: Order[];

  // Q&A Discussion
  questions: Question[];
  answers: Answer[];
  addQuestion: (courseId: string, title: string, content: string, lessonId?: string) => Question;
  updateQuestion: (questionId: string, data: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  upvoteQuestion: (questionId: string) => void;
  getCourseQuestions: (courseId: string) => Question[];
  addAnswer: (questionId: string, content: string) => Answer;
  updateAnswer: (answerId: string, content: string) => void;
  deleteAnswer: (answerId: string) => void;
  upvoteAnswer: (answerId: string) => void;
  acceptAnswer: (answerId: string) => void;
  getQuestionAnswers: (questionId: string) => Answer[];

  // Announcements
  announcements: Announcement[];
  addAnnouncement: (courseId: string, title: string, content: string, priority?: Announcement['priority']) => Announcement;
  deleteAnnouncement: (announcementId: string) => void;
  markAnnouncementRead: (announcementId: string) => void;
  getCourseAnnouncements: (courseId: string) => Announcement[];
  getUnreadAnnouncements: () => Announcement[];

  // Certificates
  certificates: Certificate[];
  generateCertificate: (courseId: string, lessonId?: string) => Certificate;
  getCertificate: (courseId: string) => Certificate | undefined;
  getUserCertificates: () => Certificate[];
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const createInitialProfile = (user: User): StudentProfile => ({
  id: generateId(),
  userId: user.id,
  firstName: user.name.split(' ')[0] || '',
  lastName: user.name.split(' ').slice(1).join(' ') || '',
  email: user.email,
  headline: '',
  summary: '',
  location: '',
  careerGoals: [],
  yearsOfExperience: 0,
  employmentStatus: 'student',
  desiredRoles: [],
  remotePreference: 'any',
  willingToRelocate: false,
  skills: [],
  interests: [],
  preferredCategories: [],
  learningGoals: [],
  education: [],
  certifications: [],
  workExperience: [],
  projects: [],
  onboardingCompleted: false,
  onboardingStep: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export function LMSProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(sampleCourses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(sampleUsers[0]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [institutionUsers, setInstitutionUsers] = useState<InstitutionUser[]>([]);
  
  // New state for cart, Q&A, announcements, certificates
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [coupons] = useState<Coupon[]>(SAMPLE_COUPONS);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCourses = localStorage.getItem('lms-courses');
      const savedEnrollments = localStorage.getItem('lms-enrollments');
      const savedReviews = localStorage.getItem('lms-reviews');
      const savedNotes = localStorage.getItem('lms-notes');
      const savedProfile = localStorage.getItem('lms-student-profile');
      const savedInstitutionUsers = localStorage.getItem('lms-institution-users');
      
      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedEnrollments) setEnrollments(JSON.parse(savedEnrollments));
      if (savedReviews) setReviews(JSON.parse(savedReviews));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedInstitutionUsers) {
        setInstitutionUsers(JSON.parse(savedInstitutionUsers));
      } else {
        // Load sample institution users by default
        setInstitutionUsers(sampleInstitutionUsers);
      }
      if (savedProfile) {
        setStudentProfile(JSON.parse(savedProfile));
      } else if (currentUser && currentUser.role === 'student') {
        setStudentProfile(createInitialProfile(currentUser));
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms-courses', JSON.stringify(courses));
    }
  }, [courses]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms-enrollments', JSON.stringify(enrollments));
    }
  }, [enrollments]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms-reviews', JSON.stringify(reviews));
    }
  }, [reviews]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms-notes', JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    if (typeof window !== 'undefined' && studentProfile) {
      localStorage.setItem('lms-student-profile', JSON.stringify(studentProfile));
    }
  }, [studentProfile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms-institution-users', JSON.stringify(institutionUsers));
    }
  }, [institutionUsers]);

  const switchRole = useCallback((role: 'instructor' | 'student') => {
    const user = sampleUsers.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      if (role === 'student' && !studentProfile) {
        setStudentProfile(createInitialProfile(user));
      }
    }
  }, [studentProfile]);

  // Course operations
  const getCourse = useCallback((id: string) => courses.find(c => c.id === id), [courses]);
  
  const getCourseBySlug = useCallback((slug: string) => courses.find(c => c.slug === slug), [courses]);

  const getInstructorCourses = useCallback(
    (instructorId: string) => courses.filter(c => c.instructorId === instructorId),
    [courses]
  );

  const createCourse = useCallback((data: CourseFormData): Course => {
    const newCourse: Course = {
      id: generateId(),
      ...data,
      slug: generateSlug(data.title),
      instructorId: currentUser?.id || 'instructor-1',
      instructorName: currentUser?.name || 'Instructor',
      status: 'draft',
      duration: 0,
      totalLessons: 0,
      totalStudents: 0,
      rating: 0,
      reviewsCount: 0,
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  }, [currentUser]);

  const updateCourse = useCallback((id: string, data: Partial<Course>) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === id
          ? { ...course, ...data, updatedAt: new Date() }
          : course
      )
    );
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(course => course.id !== id));
  }, []);

  const publishCourse = useCallback((id: string) => {
    updateCourse(id, { status: 'published' });
  }, [updateCourse]);

  const archiveCourse = useCallback((id: string) => {
    updateCourse(id, { status: 'archived' });
  }, [updateCourse]);

  // Section operations
  const addSection = useCallback((courseId: string, data: SectionFormData): Section => {
    const newSection: Section = {
      id: generateId(),
      courseId,
      ...data,
      order: 0,
      lessons: [],
    };

    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          const newOrder = course.sections.length;
          return {
            ...course,
            sections: [...course.sections, { ...newSection, order: newOrder }],
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );

    return newSection;
  }, []);

  const updateSection = useCallback((courseId: string, sectionId: string, data: SectionFormData) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          return {
            ...course,
            sections: course.sections.map(section =>
              section.id === sectionId ? { ...section, ...data } : section
            ),
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );
  }, []);

  const deleteSection = useCallback((courseId: string, sectionId: string) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          return {
            ...course,
            sections: course.sections.filter(s => s.id !== sectionId),
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );
  }, []);

  const reorderSections = useCallback((courseId: string, sectionIds: string[]) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          const reorderedSections = sectionIds.map((id, index) => {
            const section = course.sections.find(s => s.id === id);
            return section ? { ...section, order: index } : null;
          }).filter(Boolean) as Section[];
          return {
            ...course,
            sections: reorderedSections,
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );
  }, []);

  // Lesson operations
  const addLesson = useCallback((courseId: string, sectionId: string, data: LessonFormData): Lesson => {
    const newLesson: Lesson = {
      id: generateId(),
      sectionId,
      ...data,
      order: 0,
      materials: [],
    };

    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          let totalLessons = 0;
          let totalDuration = 0;
          const newSections = course.sections.map(section => {
            if (section.id === sectionId) {
              const newOrder = section.lessons.length;
              const updatedLessons = [...section.lessons, { ...newLesson, order: newOrder }];
              totalLessons += updatedLessons.length;
              totalDuration += updatedLessons.reduce((acc, l) => acc + l.duration, 0);
              return { ...section, lessons: updatedLessons };
            }
            totalLessons += section.lessons.length;
            totalDuration += section.lessons.reduce((acc, l) => acc + l.duration, 0);
            return section;
          });
          return {
            ...course,
            sections: newSections,
            totalLessons,
            duration: totalDuration,
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );

    return newLesson;
  }, []);

  const updateLesson = useCallback((courseId: string, sectionId: string, lessonId: string, data: Partial<Lesson>) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          let totalDuration = 0;
          const newSections = course.sections.map(section => {
            if (section.id === sectionId) {
              const updatedLessons = section.lessons.map(lesson =>
                lesson.id === lessonId ? { ...lesson, ...data } : lesson
              );
              totalDuration += updatedLessons.reduce((acc, l) => acc + l.duration, 0);
              return { ...section, lessons: updatedLessons };
            }
            totalDuration += section.lessons.reduce((acc, l) => acc + l.duration, 0);
            return section;
          });
          return {
            ...course,
            sections: newSections,
            duration: totalDuration,
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );
  }, []);

  const deleteLesson = useCallback((courseId: string, sectionId: string, lessonId: string) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          let totalLessons = 0;
          let totalDuration = 0;
          const newSections = course.sections.map(section => {
            if (section.id === sectionId) {
              const filteredLessons = section.lessons.filter(l => l.id !== lessonId);
              totalLessons += filteredLessons.length;
              totalDuration += filteredLessons.reduce((acc, l) => acc + l.duration, 0);
              return { ...section, lessons: filteredLessons };
            }
            totalLessons += section.lessons.length;
            totalDuration += section.lessons.reduce((acc, l) => acc + l.duration, 0);
            return section;
          });
          return {
            ...course,
            sections: newSections,
            totalLessons,
            duration: totalDuration,
            updatedAt: new Date(),
          };
        }
        return course;
      })
    );
  }, []);

  const reorderLessons = useCallback((courseId: string, sectionId: string, lessonIds: string[]) => {
    setCourses(prev =>
      prev.map(course => {
        if (course.id === courseId) {
          const newSections = course.sections.map(section => {
            if (section.id === sectionId) {
              const reorderedLessons = lessonIds.map((id, index) => {
                const lesson = section.lessons.find(l => l.id === id);
                return lesson ? { ...lesson, order: index } : null;
              }).filter(Boolean) as Lesson[];
              return { ...section, lessons: reorderedLessons };
            }
            return section;
          });
          return { ...course, sections: newSections, updatedAt: new Date() };
        }
        return course;
      })
    );
  }, []);

  // Material operations
  const addMaterial = useCallback(
    (courseId: string, sectionId: string, lessonId: string, material: Omit<Material, 'id' | 'lessonId'>) => {
      const newMaterial: Material = {
        id: generateId(),
        lessonId,
        ...material,
      };

      setCourses(prev =>
        prev.map(course => {
          if (course.id === courseId) {
            const newSections = course.sections.map(section => {
              if (section.id === sectionId) {
                const updatedLessons = section.lessons.map(lesson =>
                  lesson.id === lessonId
                    ? { ...lesson, materials: [...lesson.materials, newMaterial] }
                    : lesson
                );
                return { ...section, lessons: updatedLessons };
              }
              return section;
            });
            return { ...course, sections: newSections, updatedAt: new Date() };
          }
          return course;
        })
      );
    },
    []
  );

  const deleteMaterial = useCallback(
    (courseId: string, sectionId: string, lessonId: string, materialId: string) => {
      setCourses(prev =>
        prev.map(course => {
          if (course.id === courseId) {
            const newSections = course.sections.map(section => {
              if (section.id === sectionId) {
                const updatedLessons = section.lessons.map(lesson =>
                  lesson.id === lessonId
                    ? { ...lesson, materials: lesson.materials.filter(m => m.id !== materialId) }
                    : lesson
                );
                return { ...section, lessons: updatedLessons };
              }
              return section;
            });
            return { ...course, sections: newSections, updatedAt: new Date() };
          }
          return course;
        })
      );
    },
    []
  );

  // Enrollment operations
  const enrollInCourse = useCallback((courseId: string) => {
    if (!currentUser) return;

    const existing = enrollments.find(e => e.courseId === courseId && e.userId === currentUser.id);
    if (existing) return;

    const newEnrollment: Enrollment = {
      id: generateId(),
      userId: currentUser.id,
      courseId,
      status: 'active',
      progress: 0,
      completedLessons: [],
      enrolledAt: new Date(),
    };

    setEnrollments(prev => [...prev, newEnrollment]);
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, totalStudents: course.totalStudents + 1 }
          : course
      )
    );
  }, [currentUser, enrollments]);

  const getEnrollment = useCallback(
    (courseId: string) => {
      if (!currentUser) return undefined;
      return enrollments.find(e => e.courseId === courseId && e.userId === currentUser.id);
    },
    [currentUser, enrollments]
  );

  const getUserEnrollments = useCallback(() => {
    if (!currentUser) return [];
    return enrollments.filter(e => e.userId === currentUser.id);
  }, [currentUser, enrollments]);

  const updateProgress = useCallback((enrollmentId: string, lessonId: string) => {
    setEnrollments(prev =>
      prev.map(enrollment => {
        if (enrollment.id === enrollmentId) {
          return { ...enrollment, currentLessonId: lessonId };
        }
        return enrollment;
      })
    );
  }, []);

  const markLessonComplete = useCallback((enrollmentId: string, lessonId: string) => {
    setEnrollments(prev =>
      prev.map(enrollment => {
        if (enrollment.id === enrollmentId) {
          const completedLessons = enrollment.completedLessons.includes(lessonId)
            ? enrollment.completedLessons
            : [...enrollment.completedLessons, lessonId];

          // Calculate progress
          const course = courses.find(c => c.id === enrollment.courseId);
          const totalLessons = course?.sections.reduce((acc, s) => acc + s.lessons.length, 0) || 1;
          const progress = Math.round((completedLessons.length / totalLessons) * 100);

          return {
            ...enrollment,
            completedLessons,
            progress,
            completedAt: progress === 100 ? new Date() : undefined,
            status: progress === 100 ? 'completed' : 'active',
          };
        }
        return enrollment;
      })
    );
  }, [courses]);

  // Review operations
  const addReview = useCallback((courseId: string, rating: number, comment: string) => {
    if (!currentUser) return;

    const newReview: Review = {
      id: generateId(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      courseId,
      rating,
      comment,
      status: 'pending',
      createdAt: new Date(),
    };

    setReviews(prev => [...prev, newReview]);
    // Rating is NOT updated here — only approved reviews affect rating
  }, [currentUser]);

  const getCourseReviews = useCallback(
    (courseId: string) => reviews.filter(r => r.courseId === courseId),
    [reviews]
  );

  const getApprovedCourseReviews = useCallback(
    (courseId: string) => reviews.filter(r => r.courseId === courseId && r.status === 'approved'),
    [reviews]
  );

  const getInstructorReviews = useCallback(
    (instructorId: string) => {
      const instructorCourseIds = new Set(
        courses.filter(c => c.instructorId === instructorId).map(c => c.id)
      );
      return reviews.filter(r => instructorCourseIds.has(r.courseId));
    },
    [reviews, courses]
  );

  const recalculateCourseRating = useCallback((courseId: string, updatedReviews: Review[]) => {
    const approved = updatedReviews.filter(r => r.courseId === courseId && r.status === 'approved');
    const avgRating = approved.length > 0
      ? approved.reduce((acc, r) => acc + r.rating, 0) / approved.length
      : 0;
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, rating: Math.round(avgRating * 10) / 10, reviewsCount: approved.length }
          : course
      )
    );
  }, []);

  const approveReview = useCallback((reviewId: string) => {
    setReviews(prev => {
      const updated = prev.map(r =>
        r.id === reviewId ? { ...r, status: 'approved' as ReviewStatus } : r
      );
      const review = updated.find(r => r.id === reviewId);
      if (review) recalculateCourseRating(review.courseId, updated);
      return updated;
    });
  }, [recalculateCourseRating]);

  const rejectReview = useCallback((reviewId: string, reason?: string) => {
    setReviews(prev => {
      const updated = prev.map(r =>
        r.id === reviewId ? { ...r, status: 'rejected' as ReviewStatus, rejectionReason: reason } : r
      );
      const review = updated.find(r => r.id === reviewId);
      if (review) recalculateCourseRating(review.courseId, updated);
      return updated;
    });
  }, [recalculateCourseRating]);

  const replyToReview = useCallback((reviewId: string, reply: string) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId ? { ...r, instructorReply: reply, repliedAt: new Date() } : r
      )
    );
  }, []);

  const deleteReview = useCallback((reviewId: string) => {
    setReviews(prev => {
      const review = prev.find(r => r.id === reviewId);
      const updated = prev.filter(r => r.id !== reviewId);
      if (review) recalculateCourseRating(review.courseId, updated);
      return updated;
    });
  }, [recalculateCourseRating]);

  const updateReview = useCallback((reviewId: string, data: Partial<Review>) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...data } : r));
  }, []);

  // Student management
  const getInstructorStudents = useCallback(
    (instructorId: string): StudentEnrollmentInfo[] => {
      const instructorCourses = courses.filter(c => c.instructorId === instructorId);
      const result: StudentEnrollmentInfo[] = [];
      for (const course of instructorCourses) {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        for (const enrollment of courseEnrollments) {
          const user = sampleUsers.find(u => u.id === enrollment.userId);
          if (user) {
            result.push({
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userAvatar: user.avatar,
              courseId: course.id,
              courseTitle: course.title,
              enrolledAt: new Date(enrollment.enrolledAt),
              progress: enrollment.progress,
              status: enrollment.status,
              completedLessons: enrollment.completedLessons.length,
              totalLessons: course.sections.reduce((acc, s) => acc + s.lessons.length, 0),
              lastActivity: enrollment.completedLessons.length > 0 ? new Date() : undefined,
            });
          }
        }
      }
      return result;
    },
    [courses, enrollments]
  );

  const removeStudentFromCourse = useCallback((userId: string, courseId: string) => {
    setEnrollments(prev => prev.filter(e => !(e.userId === userId && e.courseId === courseId)));
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, totalStudents: Math.max(0, course.totalStudents - 1) }
          : course
      )
    );
  }, []);

  // ─── Institution User / Team Management ──────────────────────────────────────

  const createInstitutionUser = useCallback(
    (data: Omit<InstitutionUser, 'id' | 'institutionId' | 'invitedBy' | 'joinedAt' | 'createdAt' | 'updatedAt'>): InstitutionUser => {
      const now = new Date();
      const newUser: InstitutionUser = {
        ...data,
        id: generateId(),
        institutionId: currentUser?.id || 'instructor-1',
        invitedBy: currentUser?.id || 'instructor-1',
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      setInstitutionUsers(prev => [...prev, newUser]);
      return newUser;
    },
    [currentUser]
  );

  const updateInstitutionUser = useCallback((id: string, data: Partial<InstitutionUser>) => {
    setInstitutionUsers(prev =>
      prev.map(u => u.id === id ? { ...u, ...data, updatedAt: new Date() } : u)
    );
  }, []);

  const deleteInstitutionUser = useCallback((id: string) => {
    // Remove from any course assignments first
    setCourses(prev =>
      prev.map(course => ({
        ...course,
        assignedUserIds: (course.assignedUserIds || []).filter(uid => uid !== id),
      }))
    );
    setInstitutionUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const getInstitutionUser = useCallback(
    (id: string) => institutionUsers.find(u => u.id === id),
    [institutionUsers]
  );

  const assignUserToCourse = useCallback((userId: string, courseId: string) => {
    // Update course's assignedUserIds
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, assignedUserIds: Array.from(new Set([...(course.assignedUserIds || []), userId])) }
          : course
      )
    );
    // Update user's assignedCourseIds
    setInstitutionUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, assignedCourseIds: Array.from(new Set([...u.assignedCourseIds, courseId])), updatedAt: new Date() }
          : u
      )
    );
  }, []);

  const unassignUserFromCourse = useCallback((userId: string, courseId: string) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId
          ? { ...course, assignedUserIds: (course.assignedUserIds || []).filter(id => id !== userId) }
          : course
      )
    );
    setInstitutionUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, assignedCourseIds: u.assignedCourseIds.filter(id => id !== courseId), updatedAt: new Date() }
          : u
      )
    );
  }, []);

  const getCourseAssignedUsers = useCallback(
    (courseId: string) => {
      // Check both course.assignedUserIds and user.assignedCourseIds for robustness
      return institutionUsers.filter(u => 
        u.assignedCourseIds.includes(courseId) || 
        courses.find(c => c.id === courseId)?.assignedUserIds?.includes(u.id)
      );
    },
    [courses, institutionUsers]
  );

  const getUserAssignedCourses = useCallback(
    (userId: string) => {
      const user = institutionUsers.find(u => u.id === userId);
      if (!user?.assignedCourseIds?.length) return [];
      return courses.filter(c => user.assignedCourseIds.includes(c.id));
    },
    [courses, institutionUsers]
  );

  // ─────────────────────────────────────────────────────────────────────────────

  // Note operations
  const addNote = useCallback((lessonId: string, content: string, timestamp?: number) => {
    if (!currentUser) return;

    const newNote: Note = {
      id: generateId(),
      userId: currentUser.id,
      lessonId,
      content,
      timestamp,
      createdAt: new Date(),
    };

    setNotes(prev => [...prev, newNote]);
  }, [currentUser]);

  const updateNote = useCallback((noteId: string, content: string) => {
    setNotes(prev =>
      prev.map(note => (note.id === noteId ? { ...note, content } : note))
    );
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  const getLessonNotes = useCallback(
    (lessonId: string) => {
      if (!currentUser) return [];
      return notes.filter(n => n.lessonId === lessonId && n.userId === currentUser.id);
    },
    [currentUser, notes]
  );

  // Student Profile Functions
  const updateStudentProfile = useCallback((data: Partial<StudentProfile>) => {
    setStudentProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date() } : null);
  }, []);

  const completeOnboardingStep = useCallback((step: number) => {
    setStudentProfile(prev => {
      if (!prev) return null;
      const isComplete = step >= 5;
      return {
        ...prev,
        onboardingStep: step,
        onboardingCompleted: isComplete,
        updatedAt: new Date(),
      };
    });
  }, []);

  const addSkill = useCallback((skill: Omit<Skill, 'id'>) => {
    const newSkill: Skill = { ...skill, id: generateId() };
    setStudentProfile(prev => prev ? {
      ...prev,
      skills: [...prev.skills, newSkill],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeSkill = useCallback((skillId: string) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const updateSkill = useCallback((skillId: string, data: Partial<Skill>) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      skills: prev.skills.map(s => s.id === skillId ? { ...s, ...data } : s),
      updatedAt: new Date(),
    } : null);
  }, []);

  const addEducation = useCallback((education: Omit<Education, 'id'>) => {
    const newEducation: Education = { ...education, id: generateId() };
    setStudentProfile(prev => prev ? {
      ...prev,
      education: [...prev.education, newEducation],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeEducation = useCallback((educationId: string) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      education: prev.education.filter(e => e.id !== educationId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const updateEducation = useCallback((educationId: string, data: Partial<Education>) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      education: prev.education.map(e => e.id === educationId ? { ...e, ...data } : e),
      updatedAt: new Date(),
    } : null);
  }, []);

  const addWorkExperience = useCallback((experience: Omit<WorkExperience, 'id'>) => {
    const newExperience: WorkExperience = { ...experience, id: generateId() };
    setStudentProfile(prev => prev ? {
      ...prev,
      workExperience: [...prev.workExperience, newExperience],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeWorkExperience = useCallback((experienceId: string) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      workExperience: prev.workExperience.filter(e => e.id !== experienceId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const updateWorkExperience = useCallback((experienceId: string, data: Partial<WorkExperience>) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      workExperience: prev.workExperience.map(e => e.id === experienceId ? { ...e, ...data } : e),
      updatedAt: new Date(),
    } : null);
  }, []);

  const addCertification = useCallback((certification: Omit<Certification, 'id'>) => {
    const newCertification: Certification = { ...certification, id: generateId() };
    setStudentProfile(prev => prev ? {
      ...prev,
      certifications: [...prev.certifications, newCertification],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeCertification = useCallback((certificationId: string) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      certifications: prev.certifications.filter(c => c.id !== certificationId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject: Project = { ...project, id: generateId() };
    setStudentProfile(prev => prev ? {
      ...prev,
      projects: [...prev.projects, newProject],
      updatedAt: new Date(),
    } : null);
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      updatedAt: new Date(),
    } : null);
  }, []);

  const updateProject = useCallback((projectId: string, data: Partial<Project>) => {
    setStudentProfile(prev => prev ? {
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, ...data } : p),
      updatedAt: new Date(),
    } : null);
  }, []);

  // Course Recommendation Engine
  const getRecommendedCourses = useCallback((): CourseRecommendation[] => {
    if (!studentProfile) return [];
    
    const publishedCourses = courses.filter(c => c.status === 'published');
    const recommendations: CourseRecommendation[] = [];
    
    publishedCourses.forEach(course => {
      let score = 0;
      const reasons: string[] = [];
      const matchedSkills: string[] = [];
      const matchedGoals: string[] = [];
      
      // Match by preferred categories
      if (studentProfile.preferredCategories.includes(course.category)) {
        score += 30;
        reasons.push(`Matches your interest in ${course.category}`);
      }
      
      // Match by skills - find courses that teach skills user wants to learn
      const courseSkillTags = course.tags.map(t => t.toLowerCase());
      studentProfile.learningGoals.forEach(goal => {
        if (courseSkillTags.some(tag => tag.includes(goal.toLowerCase()) || goal.toLowerCase().includes(tag))) {
          score += 25;
          matchedGoals.push(goal);
        }
      });
      
      // Match by career goals
      studentProfile.desiredRoles.forEach(role => {
        if (course.title.toLowerCase().includes(role.toLowerCase()) ||
            course.description.toLowerCase().includes(role.toLowerCase())) {
          score += 20;
          reasons.push(`Relevant for ${role} career path`);
        }
      });
      
      // Match by skill level
      const userLevel = studentProfile.yearsOfExperience < 1 ? 'beginner' :
                        studentProfile.yearsOfExperience < 3 ? 'intermediate' : 'advanced';
      if (course.level === userLevel) {
        score += 15;
        reasons.push(`Matches your experience level`);
      }
      
      // Boost by rating
      if (course.rating >= 4.5) {
        score += 10;
        reasons.push('Highly rated course');
      }
      
      // Match existing skills for advanced courses
      studentProfile.skills.forEach(skill => {
        if (courseSkillTags.some(tag => tag.includes(skill.name.toLowerCase()))) {
          matchedSkills.push(skill.name);
          if (skill.level === 'beginner' || skill.level === 'intermediate') {
            score += 15;
            reasons.push(`Build on your ${skill.name} skills`);
          }
        }
      });

      if (score > 0 || matchedGoals.length > 0) {
        recommendations.push({
          courseId: course.id,
          score,
          reasons: reasons.slice(0, 3),
          matchedSkills,
          matchedGoals,
          priority: score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low',
        });
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score);
  }, [courses, studentProfile]);

  const getCoursePool = useCallback((): Course[] => {
    const recommendations = getRecommendedCourses();
    const recommendedIds = new Set(recommendations.map(r => r.courseId));
    const publishedCourses = courses.filter(c => c.status === 'published');
    
    // Return recommended courses first, then other published courses
    const recommendedCourses = recommendations
      .map(r => courses.find(c => c.id === r.courseId))
      .filter(Boolean) as Course[];
    
    const otherCourses = publishedCourses.filter(c => !recommendedIds.has(c.id));
    
    return [...recommendedCourses, ...otherCourses];
  }, [courses, getRecommendedCourses]);

  const getLearningPaths = useCallback((): LearningPath[] => {
    if (!studentProfile) return [];
    
    const paths: LearningPath[] = [];
    
    // Generate learning paths based on desired roles
    studentProfile.desiredRoles.forEach(role => {
      const relevantCourses = courses.filter(c => 
        c.status === 'published' &&
        (c.title.toLowerCase().includes(role.toLowerCase()) ||
         c.tags.some(t => t.toLowerCase().includes(role.toLowerCase())))
      );
      
      if (relevantCourses.length > 0) {
        const sortedCourses = [...relevantCourses].sort((a, b) => {
          const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return levelOrder[a.level] - levelOrder[b.level];
        });
        
        paths.push({
          id: generateId(),
          title: `${role} Career Path`,
          description: `Complete learning path to become a ${role}`,
          targetRole: role,
          courses: sortedCourses.slice(0, 5).map(c => c.id),
          estimatedDuration: sortedCourses.slice(0, 5).reduce((acc, c) => acc + c.duration, 0),
          difficulty: 'beginner',
          skills: sortedCourses.flatMap(c => c.tags).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
        });
      }
    });
    
    return paths;
  }, [courses, studentProfile]);

  // ─── Cart Functions ───────────────────────────────────────────────────────────

  const addToCart = useCallback((courseId: string) => {
    if (!currentUser) return;
    const enrollment = enrollments.find(e => e.userId === currentUser.id && e.courseId === courseId);
    if (enrollment) return; // Already enrolled
    
    setCart(prev => {
      if (prev.some(item => item.courseId === courseId)) return prev;
      const updated = [...prev, { courseId, addedAt: new Date() }];
      localStorage.setItem('lms-cart', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser, enrollments]);

  const removeFromCart = useCallback((courseId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.courseId !== courseId);
      localStorage.setItem('lms-cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('lms-cart');
  }, []);

  const isInCart = useCallback((courseId: string) => {
    return cart.some(item => item.courseId === courseId);
  }, [cart]);

  const getCartTotal = useCallback(() => {
    const cartCourses = cart.map(item => courses.find(c => c.id === item.courseId)).filter(Boolean) as Course[];
    const subtotal = cartCourses.reduce((acc, course) => acc + (course.discountPrice || course.price), 0);
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discount = subtotal * (appliedCoupon.discountValue / 100);
        if (appliedCoupon.maxDiscount) {
          discount = Math.min(discount, appliedCoupon.maxDiscount);
        }
      } else {
        discount = appliedCoupon.discountValue;
      }
    }
    
    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [cart, courses, appliedCoupon]);

  const applyCoupon = useCallback((code: string): { success: boolean; message: string } => {
    const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    
    if (!coupon) {
      return { success: false, message: 'Invalid coupon code' };
    }
    
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { success: false, message: 'This coupon has expired' };
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, message: 'This coupon has reached its usage limit' };
    }
    
    const { subtotal } = getCartTotal();
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return { success: false, message: `Minimum purchase of $${coupon.minPurchase} required` };
    }
    
    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon "${coupon.code}" applied!` };
  }, [coupons, getCartTotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const checkout = useCallback((paymentMethod: Order['paymentMethod']): Order => {
    if (!currentUser) throw new Error('Must be logged in');
    
    const { subtotal, discount, total } = getCartTotal();
    const cartCourses = cart.map(item => courses.find(c => c.id === item.courseId)).filter(Boolean) as Course[];
    
    const order: Order = {
      id: generateId(),
      userId: currentUser.id,
      items: cartCourses.map(course => ({
        courseId: course.id,
        courseTitle: course.title,
        price: course.price,
        discountPrice: course.discountPrice,
      })),
      subtotal,
      discount,
      couponId: appliedCoupon?.id,
      couponCode: appliedCoupon?.code,
      total,
      paymentMethod,
      paymentStatus: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
    };
    
    // Add order to history
    setOrders(prev => {
      const updated = [...prev, order];
      localStorage.setItem('lms-orders', JSON.stringify(updated));
      return updated;
    });
    
    // Enroll in all courses
    cartCourses.forEach(course => {
      const newEnrollment: Enrollment = {
        id: generateId(),
        userId: currentUser.id,
        courseId: course.id,
        status: 'active',
        progress: 0,
        completedLessons: [],
        enrolledAt: new Date(),
      };
      setEnrollments(prev => {
        const updated = [...prev, newEnrollment];
        localStorage.setItem('lms-enrollments', JSON.stringify(updated));
        return updated;
      });
      
      // Update course student count
      setCourses(prev => prev.map(c => 
        c.id === course.id ? { ...c, totalStudents: c.totalStudents + 1 } : c
      ));
    });
    
    // Clear cart
    clearCart();
    
    return order;
  }, [currentUser, cart, courses, appliedCoupon, getCartTotal, clearCart]);

  // ─── Q&A Functions ────────────────────────────────────────────────────────────

  const addQuestion = useCallback((courseId: string, title: string, content: string, lessonId?: string): Question => {
    if (!currentUser) throw new Error('Must be logged in');
    
    const question: Question = {
      id: generateId(),
      courseId,
      lessonId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      title,
      content,
      upvotes: 0,
      upvotedBy: [],
      answerCount: 0,
      isResolved: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setQuestions(prev => {
      const updated = [...prev, question];
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
    
    return question;
  }, [currentUser]);

  const updateQuestion = useCallback((questionId: string, data: Partial<Question>) => {
    setQuestions(prev => {
      const updated = prev.map(q => q.id === questionId ? { ...q, ...data, updatedAt: new Date() } : q);
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestions(prev => {
      const updated = prev.filter(q => q.id !== questionId);
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
    // Also delete related answers
    setAnswers(prev => {
      const updated = prev.filter(a => a.questionId !== questionId);
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const upvoteQuestion = useCallback((questionId: string) => {
    if (!currentUser) return;
    
    setQuestions(prev => {
      const updated = prev.map(q => {
        if (q.id !== questionId) return q;
        const hasUpvoted = q.upvotedBy.includes(currentUser.id);
        return {
          ...q,
          upvotes: hasUpvoted ? q.upvotes - 1 : q.upvotes + 1,
          upvotedBy: hasUpvoted 
            ? q.upvotedBy.filter(id => id !== currentUser.id)
            : [...q.upvotedBy, currentUser.id],
        };
      });
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const getCourseQuestions = useCallback((courseId: string) => {
    return questions.filter(q => q.courseId === courseId);
  }, [questions]);

  const addAnswer = useCallback((questionId: string, content: string): Answer => {
    if (!currentUser) throw new Error('Must be logged in');
    
    const question = questions.find(q => q.id === questionId);
    const course = question ? courses.find(c => c.id === question.courseId) : null;
    const isInstructor = course?.instructorId === currentUser.id;
    
    const answer: Answer = {
      id: generateId(),
      questionId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isInstructor,
      content,
      upvotes: 0,
      upvotedBy: [],
      isAccepted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setAnswers(prev => {
      const updated = [...prev, answer];
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
    
    // Update answer count on question
    setQuestions(prev => {
      const updated = prev.map(q => q.id === questionId ? { ...q, answerCount: q.answerCount + 1 } : q);
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
    
    return answer;
  }, [currentUser, questions, courses]);

  const updateAnswer = useCallback((answerId: string, content: string) => {
    setAnswers(prev => {
      const updated = prev.map(a => a.id === answerId ? { ...a, content, updatedAt: new Date() } : a);
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAnswer = useCallback((answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    setAnswers(prev => {
      const updated = prev.filter(a => a.id !== answerId);
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
    
    // Update answer count on question
    setQuestions(prev => {
      const updated = prev.map(q => q.id === answer.questionId ? { ...q, answerCount: Math.max(0, q.answerCount - 1) } : q);
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
  }, [answers]);

  const upvoteAnswer = useCallback((answerId: string) => {
    if (!currentUser) return;
    
    setAnswers(prev => {
      const updated = prev.map(a => {
        if (a.id !== answerId) return a;
        const hasUpvoted = a.upvotedBy.includes(currentUser.id);
        return {
          ...a,
          upvotes: hasUpvoted ? a.upvotes - 1 : a.upvotes + 1,
          upvotedBy: hasUpvoted 
            ? a.upvotedBy.filter(id => id !== currentUser.id)
            : [...a.upvotedBy, currentUser.id],
        };
      });
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const acceptAnswer = useCallback((answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Unaccept all other answers for this question and accept this one
    setAnswers(prev => {
      const updated = prev.map(a => {
        if (a.questionId !== answer.questionId) return a;
        return { ...a, isAccepted: a.id === answerId };
      });
      localStorage.setItem('lms-answers', JSON.stringify(updated));
      return updated;
    });
    
    // Mark question as resolved
    setQuestions(prev => {
      const updated = prev.map(q => q.id === answer.questionId ? { ...q, isResolved: true } : q);
      localStorage.setItem('lms-questions', JSON.stringify(updated));
      return updated;
    });
  }, [answers]);

  const getQuestionAnswers = useCallback((questionId: string) => {
    return answers.filter(a => a.questionId === questionId);
  }, [answers]);

  // ─── Announcement Functions ───────────────────────────────────────────────────

  const addAnnouncement = useCallback((courseId: string, title: string, content: string, priority: Announcement['priority'] = 'normal'): Announcement => {
    if (!currentUser) throw new Error('Must be logged in');
    
    const announcement: Announcement = {
      id: generateId(),
      courseId,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      title,
      content,
      priority,
      isRead: false,
      readBy: [],
      createdAt: new Date(),
    };
    
    setAnnouncements(prev => {
      const updated = [...prev, announcement];
      localStorage.setItem('lms-announcements', JSON.stringify(updated));
      return updated;
    });
    
    return announcement;
  }, [currentUser]);

  const deleteAnnouncement = useCallback((announcementId: string) => {
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== announcementId);
      localStorage.setItem('lms-announcements', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAnnouncementRead = useCallback((announcementId: string) => {
    if (!currentUser) return;
    
    setAnnouncements(prev => {
      const updated = prev.map(a => {
        if (a.id !== announcementId) return a;
        if (a.readBy.includes(currentUser.id)) return a;
        return { ...a, readBy: [...a.readBy, currentUser.id] };
      });
      localStorage.setItem('lms-announcements', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const getCourseAnnouncements = useCallback((courseId: string) => {
    return announcements.filter(a => a.courseId === courseId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [announcements]);

  const getUnreadAnnouncements = useCallback(() => {
    if (!currentUser) return [];
    const userEnrollments = enrollments.filter(e => e.userId === currentUser.id);
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    
    return announcements.filter(a => 
      enrolledCourseIds.includes(a.courseId) && !a.readBy.includes(currentUser.id)
    );
  }, [currentUser, enrollments, announcements]);

  // ─── Certificate Functions ────────────────────────────────────────────────────

  const generateCertificate = useCallback((courseId: string, lessonId?: string): Certificate => {
    if (!currentUser) throw new Error('Must be logged in');
    
    const course = courses.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');
    
    const certificate: Certificate = {
      id: generateId(),
      userId: currentUser.id,
      courseId,
      lessonId,
      type: lessonId ? 'exam_pass' : 'course_completion',
      title: lessonId ? `${course.title} - Exam Completion` : course.title,
      issuedAt: new Date(),
      verificationCode: `CERT-${generateId().toUpperCase().slice(0, 8)}`,
    };
    
    setCertificates(prev => {
      const updated = [...prev, certificate];
      localStorage.setItem('lms-certificates', JSON.stringify(updated));
      return updated;
    });
    
    return certificate;
  }, [currentUser, courses]);

  const getCertificate = useCallback((courseId: string) => {
    if (!currentUser) return undefined;
    return certificates.find(c => c.userId === currentUser.id && c.courseId === courseId && c.type === 'course_completion');
  }, [currentUser, certificates]);

  const getUserCertificates = useCallback(() => {
    if (!currentUser) return [];
    return certificates.filter(c => c.userId === currentUser.id);
  }, [currentUser, certificates]);

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        courses,
        getCourse,
        getCourseBySlug,
        getInstructorCourses,
        createCourse,
        updateCourse,
        deleteCourse,
        publishCourse,
        archiveCourse,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addLesson,
        updateLesson,
        deleteLesson,
        reorderLessons,
        addMaterial,
        deleteMaterial,
        enrollments,
        enrollInCourse,
        getEnrollment,
        getUserEnrollments,
        updateProgress,
        markLessonComplete,
        reviews,
        addReview,
        getCourseReviews,
        getApprovedCourseReviews,
        getInstructorReviews,
        approveReview,
        rejectReview,
        replyToReview,
        deleteReview,
        updateReview,
        getInstructorStudents,
        removeStudentFromCourse,
        institutionUsers,
        createInstitutionUser,
        updateInstitutionUser,
        deleteInstitutionUser,
        getInstitutionUser,
        assignUserToCourse,
        unassignUserFromCourse,
        getCourseAssignedUsers,
        getUserAssignedCourses,
        notes,
        addNote,
        updateNote,
        deleteNote,
        getLessonNotes,
        studentProfile,
        updateStudentProfile,
        completeOnboardingStep,
        addSkill,
        removeSkill,
        updateSkill,
        addEducation,
        removeEducation,
        updateEducation,
        addWorkExperience,
        removeWorkExperience,
        updateWorkExperience,
        addCertification,
        removeCertification,
        addProject,
        removeProject,
        updateProject,
        getRecommendedCourses,
        getCoursePool,
        getLearningPaths,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        getCartTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        checkout,
        orders,
        questions,
        answers,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        upvoteQuestion,
        getCourseQuestions,
        addAnswer,
        updateAnswer,
        deleteAnswer,
        upvoteAnswer,
        acceptAnswer,
        getQuestionAnswers,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        markAnnouncementRead,
        getCourseAnnouncements,
        getUnreadAnnouncements,
        certificates,
        generateCertificate,
        getCertificate,
        getUserCertificates,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
}

export function useLMS() {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within LMSProvider');
  }
  return context;
}
