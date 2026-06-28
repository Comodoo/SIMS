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
import { useAuth } from '@/lib/auth-context';
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
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const adminNavigation = [
  { name: 'Dashboard',       href: '/admin',                 icon: LayoutDashboard },
  { name: 'IT Technicians',  href: '/admin/it-technicians',  icon: Users },
  { name: 'Security',        href: '/admin/security',        icon: Shield },
];

const itTechNavigation = [
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isITTech = authUser?.role === 'it_technician';
  const navigation = isITTech ? itTechNavigation : adminNavigation;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayUser = authUser
    ? { name: `${authUser.first_name} ${authUser.last_name}`, email: authUser.email }
    : { name: isITTech ? 'IT Technician' : 'Admin User', email: '' };

  const initials = displayUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/it_technician' && item.href !== '/admin' && pathname.startsWith(item.href + '/'));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? isITTech ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'
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

  const SidebarHeader = () => isITTech ? (
    <div className="flex h-16 items-center gap-2 border-b px-6">
      <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
        <Settings className="h-4 w-4 text-white" />
      </div>
      <span className="text-lg font-bold">IT Technician</span>
    </div>
  ) : (
    <div className="flex h-16 items-center gap-2 border-b px-6">
      <Shield className="h-6 w-6 text-primary" />
      <span className="text-lg font-bold">Admin Panel</span>
    </div>
  );

  const avatarBg = isITTech ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground';
  const roleBadge = isITTech ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

  return (
    <ProtectedRoute allowedRoles={['admin', 'it_technician']}>
      <div className="min-h-screen bg-muted/30">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
          <div className="flex h-full flex-col">
            <SidebarHeader />
            <div className="flex-1 overflow-y-auto p-4">
              <NavItems />
            </div>
            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={`font-semibold text-sm ${avatarBg}`}>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{isITTech ? 'IT Technician' : 'Administrator'}</p>
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
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col">
                  <SidebarHeader />
                  <div className="flex-1 overflow-y-auto p-4">
                    <NavItems mobile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              <h1 className="text-lg font-semibold lg:hidden">{isITTech ? 'IT Technician' : 'Admin'}</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" />

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`font-semibold text-xs ${avatarBg}`}>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-medium">{displayUser.name}</span>
                      <span className="text-xs text-muted-foreground">{isITTech ? 'IT Technician' : 'Administrator'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 py-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`font-bold ${avatarBg}`}>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{displayUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
                      <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge}`}>
                        {isITTech ? 'IT Technician' : 'Administrator'}
                      </span>
                    </div>
                  </div>
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
