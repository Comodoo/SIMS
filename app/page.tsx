'use client';

import { Button } from '@/components/ui/button';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: GraduationCap, title: 'Student Management',    desc: 'Complete student profiles, enrollment tracking, and academic records in one place.',      color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: Fingerprint,   title: 'Biometric Attendance',  desc: 'Secure fingerprint-based attendance system with real-time tracking and reporting.',        color: 'text-green-600',  bg: 'bg-green-50' },
  { icon: BookOpen,      title: 'Subject & Timetable',   desc: 'Manage subjects, class assignments, and build weekly timetables with ease.',                color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Award,         title: 'Grading & Results',     desc: 'Record assignments, grade submissions, and generate full result cards per student.',         color: 'text-amber-600',  bg: 'bg-amber-50' },
  { icon: BarChart3,     title: 'Reports & Analytics',   desc: 'Generate attendance, academic, and system reports with advanced filters and export.',       color: 'text-red-600',    bg: 'bg-red-50' },
  { icon: Shield,        title: 'Security Center',       desc: 'Role-based access control, audit logs, active session monitoring, and user blocking.',      color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const portals = [
  {
    role: 'Admin',
    href: '/admin',
    icon: Shield,
    gradient: 'from-purple-500 to-violet-600',
    lightBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    desc: 'System overview and IT Technician management',
    badge: 'Administrator',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    role: 'IT Technician',
    href: '/it_technician',
    icon: Settings,
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    desc: 'Manage users, students, subjects, and system settings',
    badge: 'IT Technician',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    role: 'Teacher',
    href: '/staff',
    icon: BookOpen,
    gradient: 'from-cyan-500 to-teal-600',
    lightBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    desc: 'Manage subjects, grade students, and track attendance',
    badge: 'Teacher',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    role: 'Student',
    href: '/student',
    icon: GraduationCap,
    gradient: 'from-green-500 to-emerald-600',
    lightBg: 'bg-green-50',
    iconColor: 'text-green-600',
    desc: 'View subjects, results, timetable, and attendance',
    badge: 'Student',
    badgeColor: 'bg-green-100 text-green-700',
  },
];

export default function SIMSLandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold leading-none">SIMS</span>
              <p className="text-[10px] text-muted-foreground leading-none">School Management</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Get Started <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-50/40 dark:to-purple-950/10" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
              Student Information and Teacher{' '}
              <span className="text-primary">Attendance</span>{' '}
              Management System at Bwejuu School 
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Manage students, teachers, attendance, results, and timetables — all in one unified platform built for your school.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link href="/login">
                  Access Portal
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link href="/signup">Student Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Student Profiles',     value: '100%', sub: 'Digitally managed' },
              { label: 'Biometric Attendance', value: 'Real-time', sub: 'Fingerprint accuracy' },
              { label: 'User Roles',           value: '4',    sub: 'Admin, IT Tech, Teacher, Student' },
              { label: 'Reports & Analytics',  value: '∞',    sub: 'Filterable exports' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm font-semibold mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything Your School Needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete suite of tools to run your school efficiently, from biometric clocks to full result reports.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
                <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal Access ── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Portal</h2>
            <p className="text-muted-foreground">Each role has a dedicated workspace tailored to their needs.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {portals.map(p => (
              <div key={p.role} className="rounded-2xl border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                <div className={`h-2 w-full bg-gradient-to-r ${p.gradient}`} />
                <div className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${p.lightBg} flex items-center justify-center mb-4`}>
                    <p.icon className={`h-6 w-6 ${p.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${p.badgeColor}`}>{p.badge}</span>
                  <h3 className="font-bold text-base mt-2 mb-1">{p.role} Portal</h3>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{p.desc}</p>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                    <Link href="/login">Sign In <ChevronRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground shadow-xl">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-primary-foreground/80 mb-7">
              Log in to your portal or sign up as a student to access the system.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                <Link href="/signup">Student Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">SIMS</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} School Information Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
