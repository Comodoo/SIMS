import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';
import { getUserFromSession } from '../auth/session/route';
import type { DBEnrollment, DBPayment } from '@/lib/db/schema';

// GET /api/enrollments - Get user's enrollments
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const enrollments = db.enrollments.findByUser(user.id);

    // Enrich with course data
    const enrichedEnrollments = enrollments.map(enrollment => {
      const course = db.courses.findById(enrollment.courseId);
      const instructor = course ? db.users.findById(course.instructorId) : null;

      return {
        ...enrollment,
        course: course ? {
          id: course.id,
          slug: course.slug,
          title: course.title,
          thumbnail: course.thumbnail,
          totalLessons: course.totalLessons,
          totalDurationMinutes: course.totalDurationMinutes,
        } : null,
        instructor: instructor ? {
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
        } : null,
      };
    });

    return NextResponse.json({
      enrollments: enrichedEnrollments,
      total: enrollments.length,
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, paymentMethod = 'free', couponCode } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check course exists and is published
    const course = db.courses.findById(courseId);
    if (!course || course.status !== 'published') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = db.enrollments.findByUserAndCourse(user.id, courseId);
    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      );
    }

    // Calculate price
    let finalPrice = course.discountPrice || course.price;
    
    // Apply coupon (simplified - implement full coupon system in production)
    if (couponCode === 'AFRILEARN50') {
      finalPrice = Math.round(finalPrice * 0.5);
    }

    // Check subscription (free access for pro users)
    const isFreeWithSubscription = 
      user.subscriptionTier === 'pro' || 
      user.subscriptionTier === 'career_track';

    if (isFreeWithSubscription && course.isPremium) {
      finalPrice = 0;
    }

    // Create payment record (if not free)
    let paymentId: string | undefined;
    if (finalPrice > 0) {
      const platformFee = Math.round(finalPrice * 0.15); // 15% platform fee
      const instructorPayout = finalPrice - platformFee;

      const payment: DBPayment = {
        id: generateId(),
        userId: user.id,
        type: 'course',
        referenceId: courseId,
        amount: finalPrice,
        currency: course.currency,
        platformFee,
        instructorPayout,
        method: paymentMethod as DBPayment['method'],
        status: 'completed', // Simplified - implement payment processing
        billingName: user.name,
        billingEmail: user.email,
        billingCountry: user.country,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      db.payments.create(payment);
      paymentId = payment.id;

      // Update course revenue
      db.courses.update(courseId, {
        totalRevenue: course.totalRevenue + finalPrice,
      });
    }

    // Create enrollment
    const enrollmentId = generateId();
    const enrollment: DBEnrollment = {
      id: enrollmentId,
      userId: user.id,
      courseId,
      status: 'active',
      progressPercent: 0,
      completedLessons: [],
      paymentId,
      paidAmount: finalPrice,
      currency: course.currency,
      paymentMethod: isFreeWithSubscription ? 'subscription' : paymentMethod,
      enrolledAt: new Date(),
    };

    db.enrollments.create(enrollment);

    // Update course student count
    db.courses.update(courseId, {
      totalStudents: course.totalStudents + 1,
    });

    // Create notification for instructor
    db.notifications.create({
      id: generateId(),
      userId: course.instructorId,
      type: 'new_enrollment',
      title: 'New student enrolled',
      message: `${user.name} enrolled in "${course.title}"`,
      data: { courseId, userId: user.id },
      actionUrl: `/instructor/students`,
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      enrollment,
      message: 'Successfully enrolled in the course',
    }, { status: 201 });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}
