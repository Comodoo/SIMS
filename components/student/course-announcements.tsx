'use client';

import { useState } from 'react';
import { useLMS } from '@/lib/lms-context';
import { Announcement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Plus,
  AlertTriangle,
  Info,
  Megaphone,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseAnnouncementsProps {
  courseId: string;
  isInstructor?: boolean;
}

export function CourseAnnouncements({ courseId, isInstructor = false }: CourseAnnouncementsProps) {
  const {
    currentUser,
    getCourseAnnouncements,
    addAnnouncement,
    deleteAnnouncement,
    markAnnouncementRead,
    getCourse,
  } = useLMS();

  const announcements = getCourseAnnouncements(courseId);
  const course = getCourse(courseId);

  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('normal');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    
    addAnnouncement(courseId, title, content, priority);
    setTitle('');
    setContent('');
    setPriority('normal');
    setNewAnnouncementOpen(false);
  };

  const isRead = (announcement: Announcement) => {
    return currentUser && announcement.readBy.includes(currentUser.id);
  };

  const unreadCount = announcements.filter(a => !isRead(a)).length;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getPriorityIcon = (p: Announcement['priority']) => {
    switch (p) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (p: Announcement['priority']) => {
    switch (p) {
      case 'high':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'normal':
        return <Badge variant="secondary">Info</Badge>;
      case 'low':
        return <Badge variant="outline">Notice</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Announcements</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {isInstructor && (
            <Dialog open={newAnnouncementOpen} onOpenChange={setNewAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Input
                      placeholder="Announcement title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Write your announcement..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Select value={priority} onValueChange={(v) => setPriority(v as Announcement['priority'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General notice</SelectItem>
                        <SelectItem value="normal">Normal - Important info</SelectItem>
                        <SelectItem value="high">High - Urgent update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewAnnouncementOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim()}>
                      Post Announcement
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription>
          {course?.title} - {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2" />
            <p>No announcements yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isRead={isRead(announcement)}
                  isInstructor={isInstructor}
                  onMarkRead={() => markAnnouncementRead(announcement.id)}
                  onDelete={() => deleteAnnouncement(announcement.id)}
                  formatTimeAgo={formatTimeAgo}
                  getPriorityIcon={getPriorityIcon}
                  getPriorityBadge={getPriorityBadge}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface AnnouncementCardProps {
  announcement: Announcement;
  isRead: boolean;
  isInstructor: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
  formatTimeAgo: (date: Date) => string;
  getPriorityIcon: (p: Announcement['priority']) => React.ReactNode;
  getPriorityBadge: (p: Announcement['priority']) => React.ReactNode;
}

function AnnouncementCard({
  announcement,
  isRead,
  isInstructor,
  onMarkRead,
  onDelete,
  formatTimeAgo,
  getPriorityIcon,
  getPriorityBadge,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!isRead) {
      onMarkRead();
    }
    setExpanded(!expanded);
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors cursor-pointer',
        !isRead && 'bg-primary/5 border-primary/20',
        isRead && 'bg-card hover:bg-muted/50',
        announcement.priority === 'high' && !isRead && 'bg-destructive/5 border-destructive/20'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getPriorityIcon(announcement.priority)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn('font-medium text-sm', !isRead && 'font-semibold')}>
              {announcement.title}
            </h4>
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{announcement.instructorName}</span>
            <span>-</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(announcement.createdAt)}
            </span>
            {getPriorityBadge(announcement.priority)}
          </div>
          <div className={cn(
            'mt-2 text-sm text-muted-foreground overflow-hidden transition-all',
            expanded ? 'max-h-96' : 'max-h-10 line-clamp-2'
          )}>
            <p className="whitespace-pre-wrap">{announcement.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              {expanded ? 'Show less' : 'Read more'}
              <ChevronRight className={cn('h-3 w-3 ml-1 transition-transform', expanded && 'rotate-90')} />
            </Button>
            {isInstructor && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Unread announcements bell for header/nav
interface AnnouncementsBellProps {
  className?: string;
}

export function AnnouncementsBell({ className }: AnnouncementsBellProps) {
  const { getUnreadAnnouncements, markAnnouncementRead, getCourse } = useLMS();
  const unreadAnnouncements = getUnreadAnnouncements();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {unreadAnnouncements.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadAnnouncements.length > 9 ? '9+' : unreadAnnouncements.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Announcements
            {unreadAnnouncements.length > 0 && (
              <Badge variant="destructive">{unreadAnnouncements.length} new</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {unreadAnnouncements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2" />
              <p>All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadAnnouncements.map((announcement) => {
                const course = getCourse(announcement.courseId);
                return (
                  <div
                    key={announcement.id}
                    className="p-3 rounded-lg border bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
                    onClick={() => markAnnouncementRead(announcement.id)}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      {announcement.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{course?.title}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTimeAgo(announcement.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
