'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Edit, GraduationCap, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Mock data
const mockAnnouncements = [
  { annId: '1', title: 'Exam Schedule Released', content: 'Final exams will start on April 25th. Please check your individual schedules.', author: { userId: '1', firstName: 'Admin', lastName: 'User' }, targetRole: 'student', priority: 'high', createdAt: '2024-04-10', isActive: true },
  { annId: '2', title: 'System Maintenance', content: 'The SIMS system will be down for maintenance on Sunday from 2 AM to 4 AM.', author: { userId: '1', firstName: 'Admin', lastName: 'User' }, targetRole: 'all', priority: 'medium', createdAt: '2024-04-08', isActive: true },
  { annId: '3', title: 'New Course Available', content: 'Advanced Machine Learning is now open for enrollment.', author: { userId: '1', firstName: 'Admin', lastName: 'User' }, targetRole: 'student', priority: 'low', createdAt: '2024-04-05', isActive: true },
];

export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState(mockAnnouncements);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Simulate announcement creation
      setTimeout(() => {
        const newAnnouncement = {
          annId: Date.now().toString(),
          title,
          content,
          author: { userId: '1', firstName: 'Admin', lastName: 'User' },
          targetRole,
          priority,
          createdAt: new Date().toISOString(),
          isActive: true
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        setTitle('');
        setContent('');
        setTargetRole('all');
        setPriority('medium');
        setSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'parent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">SIMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Announcements</h1>
          <p className="text-muted-foreground">Create and manage system-wide announcements</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Announcement Form */}
          <div className="lg:col-span-1">
            <Card className="border-2 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Create Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter announcement title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetRole">Target Audience</Label>
                    <select
                      id="targetRole"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Users</option>
                      <option value="admin">Administrators</option>
                      <option value="staff">Staff Members</option>
                      <option value="student">Students</option>
                      <option value="parent">Parents/Guardians</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md min-h-[150px]"
                      required
                      placeholder="Enter announcement content"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Announcement
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Announcements</h2>
              
              {announcements.map((announcement: any) => (
                <Card key={announcement.annId} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span>By {announcement.author?.firstName} {announcement.author?.lastName}</span>
                          <span>•</span>
                          <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-sm mb-3">{announcement.content}</p>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getTargetRoleBadge(announcement.targetRole)}`}>
                            Target: {announcement.targetRole}
                          </span>
                          {announcement.isActive ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {announcements.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No announcements found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
