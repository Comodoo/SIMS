'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import {
  Award, BookOpen, GraduationCap, Settings, Shield, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DASH_QUERY = `
  query ITTechDashboard {
    students(limit: 5000) { id status }
    staffMembers(limit: 1000) { id }
    courses(limit: 1000) { id status }
    users(limit: 5000) { id role is_active }
    classGroups { id name parentId }
  }
`;

interface Stat { label: string; value: number | string; icon: React.ElementType; color: string; bg: string; href: string; }

export default function ITTechnicianDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    students: 0, activeStudents: 0,
    teachers: 0, admins: 0, totalUsers: 0,
    subjects: 0, classGroups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    query<any>(DASH_QUERY, {}, token)
      .then(data => {
        const users: any[] = data.users ?? [];
        const students: any[] = data.students ?? [];
        setStats({
          students: students.length,
          activeStudents: students.filter((s: any) => s.status === 'active').length,
          teachers: users.filter((u: any) => u.role === 'staff').length,
          admins: users.filter((u: any) => u.role === 'admin').length,
          totalUsers: users.length,
          subjects: (data.courses ?? []).filter((c: any) => c.status === 'active').length,
          classGroups: (data.classGroups ?? []).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const cards: Stat[] = [
    { label: 'Total Students',   value: stats.students,       icon: GraduationCap, color: 'text-green-600',  bg: 'bg-gradient-to-br from-green-50 to-emerald-100',  href: '/it_technician/students' },
    { label: 'Active Students',  value: stats.activeStudents, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-green-100', href: '/it_technician/students' },
    { label: 'Teachers',         value: stats.teachers,       icon: Users,         color: 'text-blue-600',   bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',    href: '/it_technician/users' },
    { label: 'Total Users',      value: stats.totalUsers,     icon: Users,         color: 'text-indigo-600', bg: 'bg-gradient-to-br from-indigo-50 to-purple-100',  href: '/it_technician/users' },
    { label: 'Active Subjects',  value: stats.subjects,       icon: BookOpen,      color: 'text-amber-600',  bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',   href: '/admin/subjects' },
    { label: 'Class Groups',     value: stats.classGroups,    icon: Award,         color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-violet-100',  href: '/it_technician/students' },
  ];

  const quickLinks = [
    { label: 'Manage Users',     href: '/it_technician/users',    icon: Users,    desc: 'Register and manage all user accounts',       color: 'text-blue-600',   border: 'border-blue-200' },
    { label: 'Manage Students',  href: '/it_technician/students', icon: GraduationCap, desc: 'View and update student profiles',        color: 'text-green-600',  border: 'border-green-200' },
    { label: 'Subjects',         href: '/admin/subjects',         icon: BookOpen, desc: 'Manage subjects and class assignments',         color: 'text-amber-600',  border: 'border-amber-200' },
    { label: 'Timetable',        href: '/admin/timetable',        icon: Award,    desc: 'Build and manage class schedules',              color: 'text-purple-600', border: 'border-purple-200' },
    { label: 'Security',         href: '/admin/security',         icon: Shield,   desc: 'Monitor sessions and audit logs',               color: 'text-red-600',    border: 'border-red-200' },
    { label: 'Reports',          href: '/admin/reports',          icon: Settings, desc: 'Generate and download system reports',          color: 'text-gray-600',   border: 'border-gray-200' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">IT Technician Dashboard</h1>
        <p className="text-muted-foreground">System overview and management tools</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className={`${bg} border-0 hover:shadow-md transition-shadow cursor-pointer`}>
              <CardContent className="pt-5 pb-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-white/60`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{loading ? '…' : value}</p>
                  <p className="text-xs text-gray-600 font-medium">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(({ label, href, icon: Icon, desc, color, border }) => (
            <Link key={label} href={href}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer border ${border} h-full`}>
                <CardContent className="pt-5 pb-5 flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl bg-muted/50 flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
