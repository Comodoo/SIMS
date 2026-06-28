'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { useAuth } from '@/lib/auth-context';
import {
  Award, Bell, BookOpen, Calendar, ChevronDown,
  Fingerprint, GraduationCap, LayoutDashboard, LogOut,
  Menu, Settings, Shield, Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard',   href: '/it_technician',           icon: LayoutDashboard },
  { name: 'Users',       href: '/it_technician/users',     icon: Users },
  { name: 'Students',    href: '/it_technician/students',  icon: GraduationCap },
  { name: 'Subjects',    href: '/admin/subjects',          icon: BookOpen },
  { name: 'Timetable',   href: '/admin/timetable',         icon: Calendar },
  { name: 'Attendance',  href: '/admin/attendance',        icon: Bell },
  { name: 'Biometric',   href: '/admin/biometric',         icon: Fingerprint },
  { name: 'Results',     href: '/admin/results',           icon: Award },
  { name: 'Reports',     href: '/admin/reports',           icon: Award },
  { name: 'Security',    href: '/admin/security',          icon: Shield },
];

export default function ITTechnicianLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayUser = authUser
    ? { name: `${authUser.first_name} ${authUser.last_name}`, email: authUser.email }
    : { name: 'IT Technician', email: '' };

  const initials = displayUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
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
    <ProtectedRoute allowedRoles={['it_technician']}>
      <div className="min-h-screen bg-muted/30">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">IT Technician</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavItems />
            </div>
            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 mb-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">IT Technician</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm" className="w-full text-destructive hover:text-destructive"
                onClick={() => { logout(); router.push('/login'); }}
              >
                <LogOut className="h-4 w-4 mr-2" />Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center gap-2 border-b px-6">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold">IT Technician</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4"><NavItems mobile /></div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white font-semibold text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-medium">{displayUser.name}</span>
                      <span className="text-xs text-muted-foreground">IT Technician</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{displayUser.name}</p>
                    <p className="text-xs text-muted-foreground">{displayUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { logout(); router.push('/login'); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
