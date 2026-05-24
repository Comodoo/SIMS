'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  GraduationCap,
  Users,
  Briefcase,
  LayoutGrid,
  FlaskConical,
  Trophy,
  MessageSquare,
  Bot,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNavItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Skills', href: '/skills', icon: Trophy },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'More', href: '/more', icon: LayoutGrid },
];

const instructorNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/instructor', icon: Home },
  { name: 'Courses', href: '/instructor/courses', icon: BookOpen },
  { name: 'Students', href: '/instructor/students', icon: Users },
  { name: 'Analytics', href: '/instructor/analytics', icon: GraduationCap },
  { name: 'More', href: '/instructor/settings', icon: LayoutGrid },
];

interface MobileBottomNavProps {
  variant?: 'student' | 'instructor';
}

export function MobileBottomNav({ variant = 'student' }: MobileBottomNavProps) {
  const pathname = usePathname();
  const navItems = variant === 'student' ? studentNavItems : instructorNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = 
            pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/instructor' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// More menu sheet content for mobile
export function MobileMoreMenu({ variant = 'student' }: MobileBottomNavProps) {
  const pathname = usePathname();
  
  const studentMoreItems = [
    { name: 'My Learning', href: '/my-learning', icon: BookOpen },
    { name: 'Cohorts', href: '/cohorts', icon: Users },
    { name: 'Labs', href: '/labs', icon: FlaskConical },
    { name: 'Careers', href: '/careers', icon: Briefcase },
    { name: 'Certifications', href: '/certifications', icon: GraduationCap },
    { name: 'Subscription', href: '/subscription', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: Users },
  ];

  const instructorMoreItems = [
    { name: 'Create Course', href: '/instructor/courses/create', icon: BookOpen },
    { name: 'Assignments', href: '/instructor/assignments', icon: GraduationCap },
    { name: 'Team', href: '/instructor/team', icon: Users },
    { name: 'Advanced Analytics', href: '/instructor/advanced-analytics', icon: Trophy },
    { name: 'Revenue', href: '/instructor/revenue', icon: Briefcase },
    { name: 'Reviews', href: '/instructor/reviews', icon: MessageSquare },
    { name: 'Business Profile', href: '/instructor/business-profile', icon: Users },
  ];

  const moreItems = variant === 'student' ? studentMoreItems : instructorMoreItems;

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {moreItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium text-center">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
