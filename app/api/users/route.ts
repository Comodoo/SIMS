import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-store';
import { getUserFromSession } from '../auth/session/route';

// GET /api/users - List users (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'student' | 'instructor' | 'admin' | null;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let users = db.users.findAll();

    // Filter by role
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Filter by status
    if (status) {
      users = users.filter(u => u.status === status);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    users = users.slice(offset, offset + limit);

    // Remove passwords
    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);

    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total: db.users.count(),
        students: db.users.findByRole('student').length,
        instructors: db.users.findByRole('instructor').length,
        admins: db.users.findByRole('admin').length,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
