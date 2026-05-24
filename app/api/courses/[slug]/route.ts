import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../auth/session/route';

// GET /api/courses/[slug] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const course = db.courses.findBySlug(slug);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has access (for unpublished courses)
    const user = getUserFromSession(request);
    if (course.status !== 'published') {
      if (!user || (user.id !== course.instructorId && user.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
    }

    // Get instructor
    const instructor = db.users.findById(course.instructorId);

    // Get sections and lessons
    const sections = db.sections.findByCourse(course.id).map(section => ({
      ...section,
      lessons: db.lessons.findBySection(section.id).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.videoDurationSeconds,
        isPreview: lesson.isPreview,
      })),
    }));

    // Get reviews
    const reviews = db.reviews.findByCourse(course.id);

    // Check if user is enrolled
    let enrollment = null;
    if (user) {
      enrollment = db.enrollments.findByUserAndCourse(user.id, course.id);
    }

    return NextResponse.json({
      course: {
        ...course,
        instructor: instructor ? {
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
          headline: instructor.headline,
          bio: instructor.bio,
        } : null,
        sections,
        reviewsSummary: {
          total: reviews.length,
          average: course.averageRating,
          distribution: {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length,
          },
        },
        recentReviews: reviews.slice(0, 5),
      },
      enrollment,
      isOwner: user?.id === course.instructorId,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[slug] - Update course (instructor only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const course = db.courses.findBySlug(slug);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to edit this course' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Fields that can be updated
    const allowedFields = [
      'title', 'description', 'shortDescription', 'thumbnail', 'previewVideoUrl',
      'category', 'subcategory', 'tags', 'language', 'subtitles',
      'price', 'currency', 'discountPrice', 'discountExpiresAt',
      'level', 'status', 'isPublic',
      'prerequisites', 'targetAudience', 'learningOutcomes',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If publishing, set publishedAt
    if (updates.status === 'published' && !course.publishedAt) {
      updates.publishedAt = new Date();
    }

    const updatedCourse = db.courses.update(course.id, updates);

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[slug] - Delete course (instructor only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const course = db.courses.findBySlug(slug);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (course.instructorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to delete this course' },
        { status: 403 }
      );
    }

    // Don't allow deletion if course has enrollments
    const enrollments = db.enrollments.findByCourse(course.id);
    if (enrollments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments. Archive it instead.' },
        { status: 400 }
      );
    }

    db.courses.delete(course.id);

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
