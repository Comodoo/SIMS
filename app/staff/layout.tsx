'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import {
    Award,
    Bell,
    BookOpen,
    Calendar,
    ChevronDown,
    Fingerprint,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/shared/protected-route';

const navigation = [
  { name: 'Dashboard', href: '/staff', icon: LayoutDashboard },
  { name: 'My Subjects', href: '/staff/subjects', icon: BookOpen },
  { name: 'Timetable', href: '/staff/timetable', icon: Calendar },
  { name: 'Grade Submissions', href: '/staff/grading', icon: Award },
  { name: 'Biometric Attendance', href: '/staff/attendance', icon: Fingerprint },
  { name: 'My Profile', href: '/staff/profile', icon: User },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayUser = authUser ? { 
    name: `${authUser.first_name} ${authUser.last_name}`, 
    email: authUser.email 
  } : { name: 'Teacher', email: 'teacher@example.com' };

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <ProtectedRoute allowedRoles={['staff']}>
      <div className="min-h-screen bg-muted/30">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Teacher Portal</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <NavItems />
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    {displayUser.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Teacher</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
            {/* Mobile menu button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center gap-2 border-b px-6">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">Teacher Portal</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <NavItems mobile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Page title */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold lg:hidden">Staff</h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <ThemeToggle variant="icon" />

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  2
                </span>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                        {displayUser.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-medium">{displayUser.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{authUser?.role ?? 'staff'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayUser.name}</p>
                    <p className="text-xs text-muted-foreground">{displayUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/staff/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
