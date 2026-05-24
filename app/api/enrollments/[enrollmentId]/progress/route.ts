import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../../auth/session/route';
import type { DBLessonProgress, DBCertificate } from '@/lib/db/schema';

// POST /api/enrollments/[enrollmentId]/progress - Update lesson progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { enrollmentId } = await params;
    const enrollment = db.enrollments.findById(enrollmentId);

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (enrollment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessonId, progressPercent, watchedSeconds, quizScore, completed } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Get or create lesson progress
    let progress = db.lessonProgress.findByEnrollmentAndLesson(enrollmentId, lessonId);

    if (!progress) {
      const newProgress: DBLessonProgress = {
        id: generateId(),
        enrollmentId,
        lessonId,
        userId: user.id,
        courseId: enrollment.courseId,
        status: 'in_progress',
        progressPercent: progressPercent || 0,
        watchedSeconds: watchedSeconds || 0,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      };
      progress = db.lessonProgress.create(newProgress);
    } else {
      // Update existing progress
      const updates: Partial<DBLessonProgress> = {
        lastAccessedAt: new Date(),
      };

      if (progressPercent !== undefined) {
        updates.progressPercent = progressPercent;
      }

      if (watchedSeconds !== undefined) {
        updates.watchedSeconds = watchedSeconds;
      }

      if (quizScore !== undefined) {
        updates.quizAttempts = (progress.quizAttempts || 0) + 1;
        updates.quizLastAttemptAt = new Date();
        if (!progress.quizBestScore || quizScore > progress.quizBestScore) {
          updates.quizBestScore = quizScore;
        }
      }

      if (completed || progressPercent === 100) {
        updates.status = 'completed';
        updates.completedAt = new Date();
        updates.progressPercent = 100;
      }

      progress = db.lessonProgress.update(progress.id, updates);
    }

    // Update enrollment progress
    const course = db.courses.findById(enrollment.courseId);
    const allLessons = db.lessons.findByCourse(enrollment.courseId);
    const completedLessonsSet = new Set(enrollment.completedLessons);

    if (completed || progressPercent === 100) {
      completedLessonsSet.add(lessonId);
    }

    const completedLessons = Array.from(completedLessonsSet);
    const overallProgress = allLessons.length > 0 
      ? Math.round((completedLessons.length / allLessons.length) * 100)
      : 0;

    const enrollmentUpdates: Partial<typeof enrollment> = {
      progressPercent: overallProgress,
      completedLessons,
      lastAccessedLessonId: lessonId,
      lastAccessedAt: new Date(),
    };

    // Check if course is completed
    if (overallProgress === 100 && enrollment.status === 'active') {
      enrollmentUpdates.status = 'completed';
      enrollmentUpdates.completedAt = new Date();

      // Generate certificate
      const certificateId = generateId();
      const verificationCode = `AFRI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const instructor = db.users.findById(course!.instructorId);

      const certificate: DBCertificate = {
        id: certificateId,
        verificationCode,
        userId: user.id,
        courseId: enrollment.courseId,
        enrollmentId,
        recipientName: user.name,
        courseTitle: course!.title,
        instructorName: instructor?.name || 'AfriLearn Instructor',
        completionDate: new Date(),
        isRevoked: false,
        viewCount: 0,
        downloadCount: 0,
        issuedAt: new Date(),
      };

      db.certificates.create(certificate);
      enrollmentUpdates.certificateId = certificateId;

      // Create notification
      db.notifications.create({
        id: generateId(),
        userId: user.id,
        type: 'course_completed',
        title: 'Congratulations! Course Completed',
        message: `You have completed "${course!.title}". Your certificate is ready!`,
        data: { courseId: enrollment.courseId, certificateId },
        actionUrl: `/certifications`,
        isRead: false,
        createdAt: new Date(),
      });
    }

    db.enrollments.update(enrollmentId, enrollmentUpdates);

    return NextResponse.json({
      success: true,
      progress,
      enrollment: {
        progressPercent: overallProgress,
        completedLessons: completedLessons.length,
        totalLessons: allLessons.length,
        isCompleted: overallProgress === 100,
      },
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
