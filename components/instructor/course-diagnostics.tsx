'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Users,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  Play,
  BookOpen,
  MessageSquare,
  Star,
  Zap,
  Target,
  AlertCircle,
  ArrowUpRight,
  Download,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLMS } from '@/lib/lms-context';
import type { Course } from '@/lib/types';

// Types for course diagnostics
interface LessonEngagement {
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  views: number;
  completions: number;
  completionRate: number;
  avgWatchTime: number;
  avgDuration: number;
  dropOffRate: number;
  replayRate: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
}

interface StudentSegment {
  segment: string;
  count: number;
  percentage: number;
  avgProgress: number;
  avgQuizScore: number;
  color: string;
}

interface ContentIssue {
  id: string;
  type: 'high_dropoff' | 'low_engagement' | 'poor_quiz_performance' | 'negative_feedback';
  severity: 'high' | 'medium' | 'low';
  lessonTitle: string;
  sectionTitle: string;
  description: string;
  recommendation: string;
  metric: string;
}

interface EngagementTimeline {
  hour: number;
  weekday: number;
  engagement: number;
}

interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  lessonTitle: string;
  correctRate: number;
  avgTimeSpent: number;
  commonWrongAnswer?: string;
  needsReview: boolean;
}

// Generate mock diagnostic data for a course
function generateCourseDiagnostics(course: Course) {
  const lessonEngagement: LessonEngagement[] = course.sections.flatMap((section) =>
    section.lessons.map((lesson, idx) => {
      const completionRate = Math.floor(Math.random() * 40) + 60;
      const dropOffRate = Math.floor(Math.random() * 30);
      let status: LessonEngagement['status'] = 'excellent';
      if (completionRate < 60) status = 'critical';
      else if (completionRate < 70) status = 'needs_attention';
      else if (completionRate < 80) status = 'good';

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        sectionTitle: section.title,
        views: Math.floor(Math.random() * 500) + 100,
        completions: Math.floor(Math.random() * 400) + 50,
        completionRate,
        avgWatchTime: Math.floor(Math.random() * lesson.duration) + lesson.duration * 0.5,
        avgDuration: lesson.duration,
        dropOffRate,
        replayRate: Math.floor(Math.random() * 25),
        status,
      };
    })
  );

  const studentSegments: StudentSegment[] = [
    { segment: 'Highly Engaged', count: 234, percentage: 35, avgProgress: 85, avgQuizScore: 92, color: 'bg-green-500' },
    { segment: 'Active Learners', count: 289, percentage: 43, avgProgress: 62, avgQuizScore: 78, color: 'bg-blue-500' },
    { segment: 'At Risk', count: 98, percentage: 15, avgProgress: 28, avgQuizScore: 65, color: 'bg-amber-500' },
    { segment: 'Inactive', count: 47, percentage: 7, avgProgress: 8, avgQuizScore: 45, color: 'bg-red-500' },
  ];

  const contentIssues: ContentIssue[] = [
    {
      id: '1',
      type: 'high_dropoff',
      severity: 'high',
      lessonTitle: 'Advanced State Management',
      sectionTitle: 'React Deep Dive',
      description: '45% of students drop off within the first 3 minutes of this lesson.',
      recommendation: 'Consider adding a brief overview or splitting into smaller segments.',
      metric: '45% drop-off rate',
    },
    {
      id: '2',
      type: 'poor_quiz_performance',
      severity: 'medium',
      lessonTitle: 'API Integration Quiz',
      sectionTitle: 'Backend Fundamentals',
      description: 'Average quiz score is 58%, below the course average of 75%.',
      recommendation: 'Review quiz questions for clarity or add more practice exercises before the quiz.',
      metric: '58% avg score',
    },
    {
      id: '3',
      type: 'low_engagement',
      severity: 'medium',
      lessonTitle: 'CSS Grid Layouts',
      sectionTitle: 'Styling',
      description: 'Only 62% of enrolled students have viewed this lesson.',
      recommendation: 'Add engaging visuals or make the lesson a prerequisite for popular content.',
      metric: '62% view rate',
    },
    {
      id: '4',
      type: 'negative_feedback',
      severity: 'low',
      lessonTitle: 'TypeScript Generics',
      sectionTitle: 'TypeScript',
      description: '3 students reported the explanation was unclear.',
      recommendation: 'Consider adding more examples or a supplementary resource.',
      metric: '3 reports',
    },
  ];

  const questionAnalytics: QuestionAnalytics[] = [
    {
      questionId: '1',
      questionText: 'What is the purpose of useEffect cleanup function?',
      lessonTitle: 'React Hooks',
      correctRate: 45,
      avgTimeSpent: 85,
      commonWrongAnswer: 'To optimize performance',
      needsReview: true,
    },
    {
      questionId: '2',
      questionText: 'Which method triggers a re-render?',
      lessonTitle: 'React Basics',
      correctRate: 78,
      avgTimeSpent: 42,
      needsReview: false,
    },
    {
      questionId: '3',
      questionText: 'What does the spread operator do?',
      lessonTitle: 'JavaScript ES6',
      correctRate: 92,
      avgTimeSpent: 28,
      needsReview: false,
    },
    {
      questionId: '4',
      questionText: 'How do you declare a TypeScript generic?',
      lessonTitle: 'TypeScript',
      correctRate: 52,
      avgTimeSpent: 95,
      commonWrongAnswer: 'Using any type',
      needsReview: true,
    },
  ];

  // Generate engagement heatmap data
  const engagementTimeline: EngagementTimeline[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      engagementTimeline.push({
        weekday: day,
        hour,
        engagement: Math.floor(Math.random() * 100),
      });
    }
  }

  return {
    lessonEngagement,
    studentSegments,
    contentIssues,
    questionAnalytics,
    engagementTimeline,
    overallHealth: 78,
    totalViews: 15420,
    avgCompletionRate: 72,
    avgEngagementTime: 45,
    totalQuestions: 156,
    avgResponseRate: 89,
  };
}

// Lesson Engagement Table
export function LessonEngagementTable({ course }: { course: Course }) {
  const data = generateCourseDiagnostics(course);
  const [filter, setFilter] = useState<'all' | 'needs_attention' | 'critical'>('all');

  const filteredLessons = data.lessonEngagement.filter((lesson) => {
    if (filter === 'all') return true;
    if (filter === 'needs_attention') return lesson.status === 'needs_attention' || lesson.status === 'critical';
    return lesson.status === filter;
  });

  const getStatusBadge = (status: LessonEngagement['status']) => {
    switch (status) {
      case 'excellent':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Excellent</Badge>;
      case 'good':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Good</Badge>;
      case 'needs_attention':
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Needs Attention</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Critical</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lesson Engagement
            </CardTitle>
            <CardDescription>
              Detailed engagement metrics for each lesson
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lessons</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredLessons.slice(0, 10).map((lesson) => (
            <div key={lesson.lessonId} className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{lesson.lessonTitle}</h4>
                  <p className="text-sm text-muted-foreground">{lesson.sectionTitle}</p>
                </div>
                {getStatusBadge(lesson.status)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-medium flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {lesson.views}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completion</p>
                  <p className={cn(
                    "font-medium",
                    lesson.completionRate >= 80 ? 'text-green-600' : lesson.completionRate >= 70 ? 'text-blue-600' : 'text-amber-600'
                  )}>
                    {lesson.completionRate}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Watch Time</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.round(lesson.avgWatchTime)}m / {lesson.avgDuration}m
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drop-off Rate</p>
                  <p className={cn(
                    "font-medium",
                    lesson.dropOffRate < 15 ? 'text-green-600' : lesson.dropOffRate < 30 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {lesson.dropOffRate}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Student Segments Component
export function StudentSegments({ course }: { course: Course }) {
  const data = generateCourseDiagnostics(course);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Segments
        </CardTitle>
        <CardDescription>
          How your students are distributed by engagement level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Segment Bar */}
        <div className="flex h-8 rounded-lg overflow-hidden">
          {data.studentSegments.map((segment) => (
            <div
              key={segment.segment}
              className={cn('transition-all', segment.color)}
              style={{ width: `${segment.percentage}%` }}
              title={`${segment.segment}: ${segment.percentage}%`}
            />
          ))}
        </div>

        {/* Segment Details */}
        <div className="space-y-3">
          {data.studentSegments.map((segment) => (
            <div key={segment.segment} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={cn('h-3 w-3 rounded-full', segment.color)} />
                <div>
                  <p className="font-medium">{segment.segment}</p>
                  <p className="text-sm text-muted-foreground">
                    {segment.count} students ({segment.percentage}%)
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p>Avg Progress: <span className="font-medium">{segment.avgProgress}%</span></p>
                <p>Avg Quiz Score: <span className="font-medium">{segment.avgQuizScore}%</span></p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Content Issues Component
export function ContentIssues({ course }: { course: Course }) {
  const data = generateCourseDiagnostics(course);

  const getSeverityConfig = (severity: ContentIssue['severity']) => {
    switch (severity) {
      case 'high':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
      case 'medium':
        return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      case 'low':
        return { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
    }
  };

  const getTypeLabel = (type: ContentIssue['type']) => {
    switch (type) {
      case 'high_dropoff':
        return 'High Drop-off';
      case 'low_engagement':
        return 'Low Engagement';
      case 'poor_quiz_performance':
        return 'Quiz Performance';
      case 'negative_feedback':
        return 'Negative Feedback';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Content Issues
        </CardTitle>
        <CardDescription>
          Areas that may need your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.contentIssues.map((issue) => {
          const config = getSeverityConfig(issue.severity);
          const Icon = config.icon;
          return (
            <div
              key={issue.id}
              className={cn('p-4 rounded-lg border', config.bg)}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 mt-0.5', config.color)} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{issue.lessonTitle}</h4>
                        <Badge variant="outline" className="text-xs">{getTypeLabel(issue.type)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.sectionTitle}</p>
                    </div>
                    <Badge variant="secondary">{issue.metric}</Badge>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Question Analytics Component
export function QuestionAnalytics({ course }: { course: Course }) {
  const data = generateCourseDiagnostics(course);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Question Analytics
        </CardTitle>
        <CardDescription>
          Performance analysis of quiz and exam questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.questionAnalytics.map((q) => (
          <div
            key={q.questionId}
            className={cn(
              'p-4 rounded-lg border',
              q.needsReview ? 'bg-amber-50/50 border-amber-200' : 'bg-card'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium line-clamp-2">{q.questionText}</p>
                <p className="text-sm text-muted-foreground mt-1">{q.lessonTitle}</p>
              </div>
              {q.needsReview && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 ml-2">
                  Needs Review
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-sm text-muted-foreground">Correct Rate</p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={q.correctRate} 
                    className={cn(
                      'h-2 flex-1',
                      q.correctRate >= 70 ? 'bg-green-100' : q.correctRate >= 50 ? 'bg-amber-100' : 'bg-red-100'
                    )}
                  />
                  <span className={cn(
                    'text-sm font-medium',
                    q.correctRate >= 70 ? 'text-green-600' : q.correctRate >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {q.correctRate}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Time Spent</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {q.avgTimeSpent}s
                </p>
              </div>
            </div>
            {q.commonWrongAnswer && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">Common Wrong Answer:</p>
                <p className="text-sm font-medium text-red-600">{q.commonWrongAnswer}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Main Course Diagnostics Dashboard
export function CourseDiagnosticsDashboard({ course }: { course: Course }) {
  const data = generateCourseDiagnostics(course);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const issueCount = data.contentIssues.filter((i) => i.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Course Diagnostics
          </h2>
          <p className="text-muted-foreground">
            In-depth analysis of course performance and student engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                data.overallHealth >= 80 ? 'bg-green-100' : data.overallHealth >= 60 ? 'bg-amber-100' : 'bg-red-100'
              )}>
                <Activity className={cn(
                  'h-5 w-5',
                  data.overallHealth >= 80 ? 'text-green-600' : data.overallHealth >= 60 ? 'text-amber-600' : 'text-red-600'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Course Health</p>
                <p className="text-2xl font-bold">{data.overallHealth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{data.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold">{data.avgCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                issueCount > 0 ? 'bg-red-100' : 'bg-green-100'
              )}>
                <AlertTriangle className={cn(
                  'h-5 w-5',
                  issueCount > 0 ? 'text-red-600' : 'text-green-600'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">{issueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList>
          <TabsTrigger value="engagement">Lesson Engagement</TabsTrigger>
          <TabsTrigger value="segments">Student Segments</TabsTrigger>
          <TabsTrigger value="issues">Content Issues</TabsTrigger>
          <TabsTrigger value="questions">Question Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement">
          <LessonEngagementTable course={course} />
        </TabsContent>

        <TabsContent value="segments">
          <StudentSegments course={course} />
        </TabsContent>

        <TabsContent value="issues">
          <ContentIssues course={course} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionAnalytics course={course} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CourseDiagnosticsDashboard;
