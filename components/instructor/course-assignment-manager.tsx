'use client';

import { useState, useMemo } from 'react';
import { useLMS } from '@/lib/lms-context';
import {
  InstitutionUser,
  InstitutionUserRole,
  ROLE_PRESETS,
  Course,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  UserPlus,
  Users,
  BookOpen,
  MoreVertical,
  UserMinus,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  ChevronRight,
  Filter,
  CheckCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseAssignmentManagerProps {
  courseId: string;
}

interface AssignMembersDialogProps {
  courseId: string;
  open: boolean;
  onClose: () => void;
}

interface CourseAssignmentOverviewProps {}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function UserAvatar({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-lg' : 'h-10 w-10 text-sm';
  if (avatar) return <img src={avatar} alt={name} className={cn('rounded-full object-cover', sz)} />;
  return (
    <div className={cn('rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary', sz)}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: InstitutionUserRole }) {
  const preset = ROLE_PRESETS[role];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', preset.color)}>
      {preset.label}
    </span>
  );
}

const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: CheckCircle2, cls: 'text-green-700 bg-green-100' },
  inactive:  { label: 'Inactive',  icon: XCircle,      cls: 'text-slate-600 bg-slate-100' },
  pending:   { label: 'Pending',   icon: Clock,        cls: 'text-amber-700 bg-amber-100' },
  suspended: { label: 'Suspended', icon: UserX,        cls: 'text-red-700  bg-red-100'   },
};

// ─── Assign Members Dialog ────────────────────────────────────────────────────

export function AssignMembersDialog({ courseId, open, onClose }: AssignMembersDialogProps) {
  const { 
    currentUser, 
    institutionUsers, 
    assignUserToCourse, 
    unassignUserFromCourse,
    getCourse,
  } = useLMS();
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<InstitutionUserRole | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const course = getCourse(courseId);
  
  // Get team members belonging to current instructor
  const myTeamMembers = useMemo(() => 
    institutionUsers.filter(u => u.institutionId === (currentUser?.id || 'instructor-1') && u.status === 'active'),
    [institutionUsers, currentUser]
  );

  // Filter team members
  const filtered = useMemo(() => {
    return myTeamMembers.filter(u => {
      const matchSearch = !search || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [myTeamMembers, search, roleFilter]);

  // Already assigned to this course
  const assignedIds = useMemo(() => 
    new Set(myTeamMembers.filter(u => u.assignedCourseIds.includes(courseId)).map(u => u.id)),
    [myTeamMembers, courseId]
  );

  const handleToggle = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allUnassignedIds = filtered.filter(u => !assignedIds.has(u.id)).map(u => u.id);
    if (allUnassignedIds.every(id => selectedIds.has(id))) {
      // Deselect all
      setSelectedIds(prev => {
        const next = new Set(prev);
        allUnassignedIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all unassigned
      setSelectedIds(prev => {
        const next = new Set(prev);
        allUnassignedIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleAssignSelected = () => {
    selectedIds.forEach(id => assignUserToCourse(id, courseId));
    setSelectedIds(new Set());
  };

  const handleUnassign = (userId: string) => {
    unassignUserFromCourse(userId, courseId);
  };

  const unassignedFiltered = filtered.filter(u => !assignedIds.has(u.id));
  const assignedFiltered = filtered.filter(u => assignedIds.has(u.id));
  const allUnassignedSelected = unassignedFiltered.length > 0 && unassignedFiltered.every(u => selectedIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Team Assignments
          </DialogTitle>
          <DialogDescription>
            Assign or remove team members for <strong>{course?.title || 'this course'}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v as InstitutionUserRole | 'all')}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {(Object.keys(ROLE_PRESETS) as InstitutionUserRole[]).map(r => (
                <SelectItem key={r} value={r}>{ROLE_PRESETS[r].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for Assigned / Available */}
        <Tabs defaultValue="available" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Available ({unassignedFiltered.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Assigned ({assignedFiltered.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Tab */}
          <TabsContent value="available" className="flex-1 mt-4 overflow-hidden flex flex-col">
            {unassignedFiltered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
                {myTeamMembers.length === 0 
                  ? <p>No team members found. Add members in the Team page first.</p>
                  : <p>All team members are already assigned to this course.</p>
                }
              </div>
            ) : (
              <>
                {/* Bulk select header */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={allUnassignedSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {allUnassignedSelected ? 'Deselect All' : 'Select All'}
                    </span>
                  </label>
                  {selectedIds.size > 0 && (
                    <Button size="sm" onClick={handleAssignSelected} className="gap-1.5">
                      <CheckCheck className="h-4 w-4" />
                      Assign Selected ({selectedIds.size})
                    </Button>
                  )}
                </div>
                <ScrollArea className="flex-1 -mx-1 px-1">
                  <div className="space-y-2">
                    {unassignedFiltered.map(user => (
                      <label
                        key={user.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer transition-colors',
                          selectedIds.has(user.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => handleToggle(user.id)}
                        />
                        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <RoleBadge role={user.role} />
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* Assigned Tab */}
          <TabsContent value="assigned" className="flex-1 mt-4 overflow-hidden">
            {assignedFiltered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>No team members assigned to this course yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-full -mx-1 px-1">
                <div className="space-y-2">
                  {assignedFiltered.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <RoleBadge role={user.role} />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleUnassign(user.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove from course</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Assignment Card (for course detail page) ──────────────────────────

export function CourseAssignmentCard({ courseId }: CourseAssignmentManagerProps) {
  const { currentUser, institutionUsers, getCourseAssignedUsers, unassignUserFromCourse } = useLMS();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get assigned users for this course
  const assignedUsers = getCourseAssignedUsers(courseId);
  
  // Filter to only show users that belong to current instructor
  const myAssignedUsers = assignedUsers.filter(
    u => u.institutionId === (currentUser?.id || 'instructor-1')
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Assignments
              </CardTitle>
              <CardDescription>
                Team members who can manage this course
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {myAssignedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No team members assigned</p>
              <Button 
                variant="link" 
                size="sm" 
                className="mt-1"
                onClick={() => setDialogOpen(true)}
              >
                Assign team members
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAssignedUsers.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => unassignUserFromCourse(user.id, courseId)}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove from Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {myAssignedUsers.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setDialogOpen(true)}
                >
                  +{myAssignedUsers.length - 5} more members
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignMembersDialog 
        courseId={courseId} 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
      />
    </>
  );
}

// ─── Course Assignment Overview Page Component ────────────────────────────────

export function CourseAssignmentOverview() {
  const { currentUser, courses, institutionUsers, assignUserToCourse, unassignUserFromCourse } = useLMS();
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Get instructor's courses
  const instructorCourses = courses.filter(c => c.instructorId === (currentUser?.id || 'instructor-1'));
  
  // Get instructor's team members
  const myTeamMembers = institutionUsers.filter(
    u => u.institutionId === (currentUser?.id || 'instructor-1') && u.status === 'active'
  );

  // Filter courses
  const filteredCourses = instructorCourses.filter(c => 
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Get assigned count for a course
  const getAssignedCount = (courseId: string) => 
    myTeamMembers.filter(u => u.assignedCourseIds.includes(courseId)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Course Assignments
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage which team members can access and manage each course
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{instructorCourses.length}</p>
              <p className="text-xs text-muted-foreground">Total Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 text-green-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myTeamMembers.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {instructorCourses.filter(c => getAssignedCount(c.id) > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Courses with Team</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {instructorCourses.filter(c => getAssignedCount(c.id) === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Unassigned Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {instructorCourses.length === 0 
                ? 'Create your first course to get started.'
                : 'Try adjusting your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCourses.map(course => {
            const assignedUsers = myTeamMembers.filter(u => u.assignedCourseIds.includes(course.id));
            const assignedCount = assignedUsers.length;
            
            return (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="sm:w-40 aspect-video sm:aspect-[4/3] shrink-0">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{course.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              course.status === 'published' && 'border-green-500 text-green-700',
                              course.status === 'draft' && 'border-amber-500 text-amber-700',
                              course.status === 'archived' && 'border-slate-500 text-slate-700'
                            )}
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {course.shortDescription}
                        </p>
                        
                        {/* Assigned team members preview */}
                        <div className="flex items-center gap-2">
                          {assignedCount > 0 ? (
                            <>
                              <div className="flex -space-x-2">
                                {assignedUsers.slice(0, 4).map(user => (
                                  <TooltipProvider key={user.id}>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {user.name} - {ROLE_PRESETS[user.role].label}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                                {assignedCount > 4 && (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                    +{assignedCount - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {assignedCount} member{assignedCount !== 1 ? 's' : ''} assigned
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" />
                              No team members assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 shrink-0"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <Users className="h-4 w-4" />
                        Manage Team
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      {selectedCourse && (
        <AssignMembersDialog
          courseId={selectedCourse.id}
          open={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
