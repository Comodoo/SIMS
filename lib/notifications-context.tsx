'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { generateId } from './sample-data';
import { Notification, NotificationType } from './types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Sample notifications for demo
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'course_update',
    title: 'New lesson available',
    message: 'A new lesson "Advanced Data Structures" has been added to Python for Data Science.',
    data: { courseId: 'course-1', lessonId: 'lesson-1' },
    actionUrl: '/learn/python-for-data-science',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'certificate_earned',
    title: 'Certificate earned!',
    message: 'Congratulations! You have earned a certificate for completing "Web Development Bootcamp".',
    data: { courseId: 'course-2', certificateId: 'cert-1' },
    actionUrl: '/certifications',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'achievement_unlocked',
    title: 'Achievement unlocked!',
    message: 'You have unlocked "Quick Learner" badge for completing 5 lessons in one day.',
    data: { badgeId: 'badge-1' },
    actionUrl: '/skills',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'cohort_session',
    title: 'Live session starting soon',
    message: 'Your cohort live session "Python Best Practices" starts in 1 hour.',
    data: { cohortId: 'cohort-1', sessionId: 'session-1' },
    actionUrl: '/cohorts',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'notif-5',
    userId: 'user-1',
    type: 'job_match',
    title: 'New job match found',
    message: 'A new job matching your skills has been posted: "Junior Data Analyst at TechCorp".',
    data: { jobId: 'job-1' },
    actionUrl: '/careers',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: 'notif-6',
    userId: 'user-1',
    type: 'streak_reminder',
    title: 'Keep your streak alive!',
    message: 'You are on a 7-day learning streak. Complete a lesson today to continue!',
    actionUrl: '/my-learning',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lms-notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed.map((n: Notification) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
      })));
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('lms-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      isRead: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
