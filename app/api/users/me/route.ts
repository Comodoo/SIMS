import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword, verifyPassword } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../auth/session/route';

// GET /api/users/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get enrollments
    const enrollments = db.enrollments.findByUser(user.id);
    
    // Get certificates
    const certificates = db.certificates.findByUser(user.id);

    // Get unread notifications count
    const unreadNotifications = db.notifications.findUnreadByUser(user.id).length;

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      stats: {
        enrolledCourses: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        certificates: certificates.length,
        unreadNotifications,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Fields that can be updated
    const allowedFields = [
      'name', 'phone', 'country', 'timezone', 'preferredLanguage',
      'bio', 'headline', 'website', 'linkedIn', 'twitter',
      'notificationPreferences',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updatedUser = db.users.update(user.id, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { passwordHash: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// POST /api/users/me/change-password - Change password
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    db.users.update(user.id, {
      passwordHash: hashPassword(newPassword),
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
