'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import {
  BookOpen, GraduationCap, Settings, Shield, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DASH_Q = `
  query AdminDashboard {
    students(limit: 5000) { id status }
    staffMembers(limit: 1000) { id }
    courses(limit: 1000) { id status }
    users(limit: 5000) { id role is_active }
  }
`;

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0, activeStudents: 0,
    totalTeachers: 0, totalITTechs: 0,
    totalUsers: 0, activeCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    query<any>(DASH_Q, {}, token)
      .then(r => {
        const users: any[] = r.users ?? [];
        const students: any[] = r.students ?? [];
        setStats({
          totalStudents:  students.length,
          activeStudents: students.filter((s: any) => s.status === 'active').length,
          totalTeachers:  users.filter((u: any) => u.role === 'staff').length,
          totalITTechs:   users.filter((u: any) => u.role === 'it_technician').length,
          totalUsers:     users.length,
          activeCourses:  (r.courses ?? []).filter((c: any) => c.status === 'active').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, token]);

  const statCards = [
    { label: 'Total Students',    value: stats.totalStudents,  icon: GraduationCap, color: 'text-green-600',  bg: 'bg-gradient-to-br from-green-50 to-emerald-100' },
    { label: 'Active Students',   value: stats.activeStudents, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-green-100' },
    { label: 'Teachers',          value: stats.totalTeachers,  icon: Users,         color: 'text-blue-600',   bg: 'bg-gradient-to-br from-blue-50 to-indigo-100' },
    { label: 'IT Technicians',    value: stats.totalITTechs,   icon: Settings,      color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-violet-100' },
    { label: 'Total Users',       value: stats.totalUsers,     icon: Shield,        color: 'text-indigo-600', bg: 'bg-gradient-to-br from-indigo-50 to-purple-100' },
    { label: 'Active Subjects',   value: stats.activeCourses,  icon: BookOpen,      color: 'text-amber-600',  bg: 'bg-gradient-to-br from-amber-50 to-yellow-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview. Manage IT Technicians below.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={`${bg} border-0`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-white/60">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{loading ? '…' : value}</p>
                <p className="text-xs text-gray-600 font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* IT Technicians management prompt */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">IT Technician Management</p>
                <p className="text-sm text-muted-foreground">
                  Add, view, and manage IT Technician accounts. They handle all system administration.
                </p>
              </div>
            </div>
            <Link href="/admin/it-technicians">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Settings className="h-4 w-4 mr-2" />Manage IT Technicians
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
