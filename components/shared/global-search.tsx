'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  BookOpen,
  User,
  FileText,
  Video,
  Award,
  Users,
  Clock,
  Star,
  TrendingUp,
  History,
  X,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Briefcase,
  MessageCircle,
  Settings,
  HelpCircle,
} from 'lucide-react';

// Mock search data - In production, this would come from an API
const mockCourses = [
  { id: 'python-data', title: 'Python for Data Science', instructor: 'Dr. Amara Nwosu', category: 'Technology', rating: 4.9, students: 12500, price: 49.99 },
  { id: 'web-dev', title: 'Full-Stack Web Development', instructor: 'James Mwangi', category: 'Technology', rating: 4.8, students: 8900, price: 59.99 },
  { id: 'digital-marketing', title: 'Digital Marketing Mastery', instructor: 'Fatima Hassan', category: 'Marketing', rating: 4.7, students: 6700, price: 39.99 },
  { id: 'finance-basics', title: 'Business Finance Fundamentals', instructor: 'Sarah Kimani', category: 'Finance', rating: 4.8, students: 5400, price: 44.99 },
  { id: 'ui-ux', title: 'UI/UX Design Principles', instructor: 'Kofi Mensah', category: 'Design', rating: 4.9, students: 7800, price: 54.99 },
  { id: 'machine-learning', title: 'Machine Learning Fundamentals', instructor: 'Dr. Chidi Okafor', category: 'Technology', rating: 4.8, students: 4200, price: 69.99 },
];

const mockInstructors = [
  { id: 'instructor-1', name: 'Dr. Amara Nwosu', specialty: 'Data Science', courses: 8, students: 45000, rating: 4.9 },
  { id: 'instructor-2', name: 'James Mwangi', specialty: 'Web Development', courses: 12, students: 38000, rating: 4.8 },
  { id: 'instructor-3', name: 'Fatima Hassan', specialty: 'Digital Marketing', courses: 6, students: 28000, rating: 4.7 },
  { id: 'instructor-4', name: 'Sarah Kimani', specialty: 'Finance', courses: 5, students: 22000, rating: 4.8 },
];

const mockLessons = [
  { id: 'lesson-1', title: 'Introduction to Python', courseTitle: 'Python for Data Science', duration: '15:30' },
  { id: 'lesson-2', title: 'Variables and Data Types', courseTitle: 'Python for Data Science', duration: '22:45' },
  { id: 'lesson-3', title: 'HTML & CSS Basics', courseTitle: 'Full-Stack Web Development', duration: '18:20' },
  { id: 'lesson-4', title: 'SEO Fundamentals', courseTitle: 'Digital Marketing Mastery', duration: '25:10' },
];

const quickActions = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: GraduationCap, href: '/dashboard' },
  { id: 'my-learning', label: 'My Learning', icon: BookOpen, href: '/my-learning' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/messages' },
  { id: 'certifications', label: 'Certifications', icon: Award, href: '/certifications' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'Help Center', icon: HelpCircle, href: '/help' },
];

interface GlobalSearchProps {
  trigger?: React.ReactNode;
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const saveSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSelect = (type: string, id: string, value?: string) => {
    if (value) saveSearch(value);
    setOpen(false);
    setQuery('');

    switch (type) {
      case 'course':
        router.push(`/courses/${id}`);
        break;
      case 'instructor':
        router.push(`/instructors/${id}`);
        break;
      case 'lesson':
        router.push(`/learn/${id}`);
        break;
      case 'action':
        const action = quickActions.find(a => a.id === id);
        if (action) router.push(action.href);
        break;
      case 'search':
        router.push(`/search?q=${encodeURIComponent(id)}`);
        break;
    }
  };

  // Filter results based on query
  const filteredCourses = query.length >= 2 
    ? mockCourses.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.instructor.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredInstructors = query.length >= 2
    ? mockInstructors.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.specialty.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredLessons = query.length >= 2
    ? mockLessons.filter(l =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.courseTitle.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredActions = query.length >= 1
    ? quickActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const hasResults = filteredCourses.length > 0 || filteredInstructors.length > 0 || filteredLessons.length > 0 || filteredActions.length > 0;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Search...
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Cmd</span>K
          </kbd>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search courses, instructors, lessons..."
                value={query}
                onValueChange={setQuery}
                className="flex-1"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <CommandList className="max-h-[400px]">
              {/* No query state */}
              {!query && (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <CommandGroup>
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Recent Searches
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground"
                          onClick={clearRecentSearches}
                        >
                          Clear
                        </Button>
                      </div>
                      {recentSearches.map((search) => (
                        <CommandItem
                          key={search}
                          value={search}
                          onSelect={() => handleSelect('search', search, search)}
                        >
                          <History className="mr-2 h-4 w-4 text-muted-foreground" />
                          {search}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Quick Actions */}
                  <CommandGroup heading="Quick Actions">
                    {quickActions.map((action) => (
                      <CommandItem
                        key={action.id}
                        value={action.label}
                        onSelect={() => handleSelect('action', action.id)}
                      >
                        <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {action.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* Trending */}
                  <CommandGroup heading="Trending Courses">
                    {mockCourses.slice(0, 3).map((course) => (
                      <CommandItem
                        key={course.id}
                        value={course.title}
                        onSelect={() => handleSelect('course', course.id, course.title)}
                      >
                        <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{course.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Search Results */}
              {query && !hasResults && (
                <CommandEmpty className="py-6 text-center text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground" />
                    <p>No results found for "{query}"</p>
                    <p className="text-muted-foreground">Try different keywords</p>
                  </div>
                </CommandEmpty>
              )}

              {/* Courses */}
              {filteredCourses.length > 0 && (
                <CommandGroup heading="Courses">
                  {filteredCourses.slice(0, 4).map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.title}
                      onSelect={() => handleSelect('course', course.id, course.title)}
                      className="flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.instructor} • {course.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${course.price}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                  {filteredCourses.length > 4 && (
                    <CommandItem
                      onSelect={() => handleSelect('search', query, query)}
                      className="justify-center text-primary"
                    >
                      View all {filteredCourses.length} courses
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </CommandItem>
                  )}
                </CommandGroup>
              )}

              {/* Instructors */}
              {filteredInstructors.length > 0 && (
                <CommandGroup heading="Instructors">
                  {filteredInstructors.slice(0, 3).map((instructor) => (
                    <CommandItem
                      key={instructor.id}
                      value={instructor.name}
                      onSelect={() => handleSelect('instructor', instructor.id, instructor.name)}
                      className="flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{instructor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {instructor.specialty} • {instructor.courses} courses
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">
                          {(instructor.students / 1000).toFixed(0)}k students
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Lessons */}
              {filteredLessons.length > 0 && (
                <CommandGroup heading="Lessons">
                  {filteredLessons.slice(0, 3).map((lesson) => (
                    <CommandItem
                      key={lesson.id}
                      value={lesson.title}
                      onSelect={() => handleSelect('lesson', lesson.id, lesson.title)}
                      className="flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.courseTitle}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Clock className="mr-1 h-3 w-3" />
                        {lesson.duration}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Quick Actions in search */}
              {filteredActions.length > 0 && query && (
                <CommandGroup heading="Quick Actions">
                  {filteredActions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => handleSelect('action', action.id)}
                    >
                      <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {action.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
                <span>Select</span>
                <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd>
                <span>Close</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>AI-powered search</span>
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GlobalSearch;
