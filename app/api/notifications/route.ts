import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-store';
import { getUserFromSession } from '../auth/session/route';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let notifications = db.notifications.findByUser(user.id);

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    const total = notifications.length;
    notifications = notifications.slice(offset, offset + limit);

    return NextResponse.json({
      notifications,
      total,
      unreadCount: db.notifications.findUnreadByUser(user.id).length,
      hasMore: offset + notifications.length < total,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
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
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      db.notifications.markAllAsRead(user.id);
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      notificationIds.forEach(id => {
        const notification = db.notifications.findById(id);
        if (notification && notification.userId === user.id) {
          db.notifications.markAsRead(id);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && Array.isArray(notificationIds)) {
      notificationIds.forEach(id => {
        const notification = db.notifications.findById(id);
        if (notification && notification.userId === user.id) {
          db.notifications.delete(id);
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted',
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
