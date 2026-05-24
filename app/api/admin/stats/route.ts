import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../auth/session/route';

// GET /api/admin/stats - Get platform statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const allUsers = db.users.findAll();
    const allCourses = db.courses.findAll();
    const allEnrollments = db.enrollments.findAll();
    const allPayments = db.payments.findAll();

    // Calculate revenue
    const totalRevenue = allPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const platformFees = allPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.platformFee, 0);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = allUsers.filter(u => new Date(u.createdAt) >= today).length;
    const todayEnrollments = allEnrollments.filter(e => new Date(e.enrolledAt) >= today).length;
    const todayRevenue = allPayments
      .filter(p => p.status === 'completed' && new Date(p.createdAt) >= today)
      .reduce((sum, p) => sum + p.amount, 0);

    // Get monthly stats (last 12 months)
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const monthUsers = allUsers.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= startDate && createdAt < endDate;
      }).length;

      const monthEnrollments = allEnrollments.filter(e => {
        const enrolledAt = new Date(e.enrolledAt);
        return enrolledAt >= startDate && enrolledAt < endDate;
      }).length;

      const monthRevenue = allPayments
        .filter(p => {
          const createdAt = new Date(p.createdAt);
          return p.status === 'completed' && createdAt >= startDate && createdAt < endDate;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      monthlyStats.push({
        month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        users: monthUsers,
        enrollments: monthEnrollments,
        revenue: monthRevenue,
      });
    }

    // Course stats
    const publishedCourses = allCourses.filter(c => c.status === 'published');
    const pendingReview = allCourses.filter(c => c.status === 'pending_review');

    // User stats by country
    const usersByCountry = allUsers.reduce((acc, u) => {
      const country = u.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top countries
    const topCountries = Object.entries(usersByCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top courses by revenue
    const topCourses = [...publishedCourses]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        title: c.title,
        students: c.totalStudents,
        revenue: c.totalRevenue,
        rating: c.averageRating,
      }));

    // Payment method breakdown
    const paymentMethods = allPayments
      .filter(p => p.status === 'completed')
      .reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      overview: {
        totalUsers: allUsers.length,
        totalStudents: allUsers.filter(u => u.role === 'student').length,
        totalInstructors: allUsers.filter(u => u.role === 'instructor').length,
        totalCourses: allCourses.length,
        publishedCourses: publishedCourses.length,
        pendingReview: pendingReview.length,
        totalEnrollments: allEnrollments.length,
        activeEnrollments: allEnrollments.filter(e => e.status === 'active').length,
        completedEnrollments: allEnrollments.filter(e => e.status === 'completed').length,
        totalRevenue,
        platformFees,
      },
      today: {
        newUsers: todayUsers,
        newEnrollments: todayEnrollments,
        revenue: todayRevenue,
      },
      monthlyStats,
      topCountries,
      topCourses,
      paymentMethods,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
