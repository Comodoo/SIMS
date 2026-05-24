'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/notifications-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell, BookOpen, Award, Target, Calendar, Briefcase, Flame, 
  MessageSquare, CreditCard, AlertCircle, CheckCircle, X, Settings,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationType } from '@/lib/types';

const notificationIcons: Record<NotificationType, typeof Bell> = {
  course_update: BookOpen,
  new_lesson: BookOpen,
  quiz_reminder: Target,
  assignment_due: AlertCircle,
  cohort_session: Calendar,
  certificate_earned: Award,
  badge_earned: Award,
  achievement_unlocked: Award,
  streak_reminder: Flame,
  job_match: Briefcase,
  application_update: Briefcase,
  study_room_invite: MessageSquare,
  message_received: MessageSquare,
  payment_received: CreditCard,
  subscription_renewal: CreditCard,
  system_announcement: AlertCircle,
};

const notificationColors: Record<NotificationType, string> = {
  course_update: 'bg-blue-100 text-blue-600',
  new_lesson: 'bg-blue-100 text-blue-600',
  quiz_reminder: 'bg-orange-100 text-orange-600',
  assignment_due: 'bg-red-100 text-red-600',
  cohort_session: 'bg-purple-100 text-purple-600',
  certificate_earned: 'bg-green-100 text-green-600',
  badge_earned: 'bg-yellow-100 text-yellow-600',
  achievement_unlocked: 'bg-yellow-100 text-yellow-600',
  streak_reminder: 'bg-orange-100 text-orange-600',
  job_match: 'bg-indigo-100 text-indigo-600',
  application_update: 'bg-indigo-100 text-indigo-600',
  study_room_invite: 'bg-cyan-100 text-cyan-600',
  message_received: 'bg-cyan-100 text-cyan-600',
  payment_received: 'bg-green-100 text-green-600',
  subscription_renewal: 'bg-green-100 text-green-600',
  system_announcement: 'bg-gray-100 text-gray-600',
};

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Link href="/settings/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || 'bg-gray-100 text-gray-600';

                return (
                  <div
                    key={notification.id}
                    className={`relative group ${!notification.isRead ? 'bg-muted/50' : ''}`}
                  >
                    {notification.actionUrl ? (
                      <Link
                        href={notification.actionUrl}
                        onClick={() => handleNotificationClick(notification.id)}
                        className="block p-4 hover:bg-muted/30 transition-colors"
                      >
                        <NotificationContent
                          notification={notification}
                          Icon={Icon}
                          colorClass={colorClass}
                        />
                      </Link>
                    ) : (
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <NotificationContent
                          notification={notification}
                          Icon={Icon}
                          colorClass={colorClass}
                        />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {!notification.isRead && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 flex items-center justify-between">
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View all notifications
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface NotificationContentProps {
  notification: {
    title: string;
    message: string;
    createdAt: Date;
    type: NotificationType;
  };
  Icon: typeof Bell;
  colorClass: string;
}

function NotificationContent({ notification, Icon, colorClass }: NotificationContentProps) {
  return (
    <div className="flex gap-3 pl-4">
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
