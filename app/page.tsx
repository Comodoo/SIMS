'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowRight,
    Bell,
    Clock,
    FileText,
    Fingerprint,
    GraduationCap,
    Shield,
    Users
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    title: 'Student Management',
    description: 'Complete student profiles, enrollment tracking, and academic records.',
  },
  {
    icon: Shield,
    title: 'Biometric Attendance',
    description: 'Secure fingerprint-based attendance system with real-time tracking.',
  },
  {
    icon: Clock,
    title: 'Staff Management',
    description: 'Comprehensive staff profiles, leave management, and performance tracking.',
  },
  {
    icon: FileText,
    title: 'Academic Records',
    description: 'Course management, assignments, grading, and report generation.',
  },
  {
    icon: Bell,
    title: 'Communication',
    description: 'Announcements, notifications, and parental alerts system.',
  },
  {
    icon: Fingerprint,
    title: 'Security',
    description: 'Role-based access control and encrypted sensitive data.',
  },
];

export default function SIMSLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SIMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Student Information and Staff
              <span className="text-primary block">Attendance Management System</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              A comprehensive solution for educational institutions. Manage students, staff, 
              attendance, academics, and communications in one unified platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login">
                  Access Portal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive School Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your educational institution efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">Student Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Access courses, assignments, and grades</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/student">Login</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">Staff Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage courses, grading, and attendance</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/staff">Login</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">Admin Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Full system management and reports</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/admin">Login</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-semibold mb-2">Parent Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Monitor child's attendance and progress</p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/parent">Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">SIMS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Student Information Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
