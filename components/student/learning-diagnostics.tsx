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
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Clock,
  BookOpen,
  Zap,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLMS } from '@/lib/lms-context';

// Types for diagnostic data
interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  recommendedCourses: string[];
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface PerformanceTrend {
  period: string;
  quizScore: number;
  completionRate: number;
  timeSpent: number;
  lessonsCompleted: number;
}

interface TopicMastery {
  topic: string;
  mastery: number;
  status: 'mastered' | 'proficient' | 'learning' | 'needs_work';
  assessmentCount: number;
  lastAssessment?: Date;
}

// Mock diagnostic data generator
function generateDiagnosticData(userId: string) {
  const skillGaps: SkillGap[] = [
    {
      skill: 'JavaScript ES6+',
      currentLevel: 65,
      targetLevel: 90,
      gap: 25,
      priority: 'high',
      recommendedCourses: ['Advanced JavaScript Patterns', 'ES6 Complete Guide'],
    },
    {
      skill: 'React Hooks',
      currentLevel: 45,
      targetLevel: 85,
      gap: 40,
      priority: 'high',
      recommendedCourses: ['React Hooks Masterclass', 'Modern React Development'],
    },
    {
      skill: 'TypeScript',
      currentLevel: 30,
      targetLevel: 75,
      gap: 45,
      priority: 'medium',
      recommendedCourses: ['TypeScript Fundamentals', 'TypeScript for React'],
    },
    {
      skill: 'CSS Flexbox/Grid',
      currentLevel: 80,
      targetLevel: 90,
      gap: 10,
      priority: 'low',
      recommendedCourses: ['Advanced CSS Layouts'],
    },
    {
      skill: 'Node.js',
      currentLevel: 55,
      targetLevel: 80,
      gap: 25,
      priority: 'medium',
      recommendedCourses: ['Node.js Backend Development'],
    },
  ];

  const insights: LearningInsight[] = [
    {
      id: '1',
      type: 'strength',
      title: 'Strong quiz performance',
      description: 'Your average quiz score of 87% is above the platform average of 72%. Keep up the great work!',
      actionable: false,
    },
    {
      id: '2',
      type: 'weakness',
      title: 'Video completion rate declining',
      description: 'Your video completion rate dropped from 85% to 62% this month. Try watching at 1.25x speed or taking notes.',
      actionable: true,
      action: {
        label: 'View Learning Tips',
        href: '/tips/video-learning',
      },
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Ready for advanced content',
      description: 'Based on your JavaScript scores, you\'re ready to move to advanced topics like design patterns.',
      actionable: true,
      action: {
        label: 'Explore Advanced Courses',
        href: '/courses?level=advanced&category=development',
      },
    },
    {
      id: '4',
      type: 'recommendation',
      title: 'Optimal study time detected',
      description: 'You perform 23% better on quizzes taken between 9-11 AM. Consider scheduling important assessments then.',
      actionable: false,
    },
    {
      id: '5',
      type: 'weakness',
      title: 'Long gaps between sessions',
      description: 'You haven\'t logged in for 5+ days twice this month. Consistent daily practice improves retention by 40%.',
      actionable: true,
      action: {
        label: 'Set Reminders',
        href: '/settings/notifications',
      },
    },
  ];

  const performanceTrends: PerformanceTrend[] = [
    { period: 'Week 1', quizScore: 72, completionRate: 68, timeSpent: 180, lessonsCompleted: 8 },
    { period: 'Week 2', quizScore: 78, completionRate: 75, timeSpent: 210, lessonsCompleted: 10 },
    { period: 'Week 3', quizScore: 82, completionRate: 72, timeSpent: 195, lessonsCompleted: 9 },
    { period: 'Week 4', quizScore: 85, completionRate: 80, timeSpent: 240, lessonsCompleted: 12 },
    { period: 'Week 5', quizScore: 87, completionRate: 78, timeSpent: 225, lessonsCompleted: 11 },
    { period: 'Week 6', quizScore: 88, completionRate: 82, timeSpent: 255, lessonsCompleted: 13 },
  ];

  const topicMastery: TopicMastery[] = [
    { topic: 'HTML/CSS Basics', mastery: 95, status: 'mastered', assessmentCount: 8, lastAssessment: new Date('2024-01-28') },
    { topic: 'JavaScript Fundamentals', mastery: 82, status: 'proficient', assessmentCount: 12, lastAssessment: new Date('2024-01-25') },
    { topic: 'React Components', mastery: 68, status: 'learning', assessmentCount: 6, lastAssessment: new Date('2024-01-20') },
    { topic: 'State Management', mastery: 45, status: 'needs_work', assessmentCount: 3, lastAssessment: new Date('2024-01-15') },
    { topic: 'API Integration', mastery: 72, status: 'proficient', assessmentCount: 5, lastAssessment: new Date('2024-01-22') },
    { topic: 'Testing', mastery: 35, status: 'needs_work', assessmentCount: 2, lastAssessment: new Date('2024-01-10') },
  ];

  return {
    skillGaps,
    insights,
    performanceTrends,
    topicMastery,
    overallScore: 74,
    learningVelocity: '+12%',
    consistencyScore: 78,
    engagementScore: 85,
  };
}

// Skill Gap Analysis Component
export function SkillGapAnalysis() {
  const { currentUser } = useLMS();
  const data = generateDiagnosticData(currentUser?.id || '');
  const [sortBy, setSortBy] = useState<'gap' | 'priority'>('priority');

  const sortedGaps = [...data.skillGaps].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.gap - a.gap;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skill Gap Analysis
            </CardTitle>
            <CardDescription>
              Identify areas for improvement based on your performance
            </CardDescription>
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'gap' | 'priority')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="gap">By Gap Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedGaps.map((gap) => (
          <div key={gap.skill} className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{gap.skill}</h4>
                <p className="text-sm text-muted-foreground">
                  {gap.gap}% gap to target
                </p>
              </div>
              <Badge variant="outline" className={cn('border', getPriorityColor(gap.priority))}>
                {gap.priority} priority
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current: {gap.currentLevel}%</span>
                <span>Target: {gap.targetLevel}%</span>
              </div>
              <div className="relative">
                <Progress value={gap.currentLevel} className="h-2" />
                <div 
                  className="absolute top-0 h-2 w-0.5 bg-primary"
                  style={{ left: `${gap.targetLevel}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Recommended courses:</p>
              <div className="flex flex-wrap gap-2">
                {gap.recommendedCourses.map((course) => (
                  <Badge key={course} variant="secondary" className="text-xs">
                    {course}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Learning Insights Component
export function LearningInsights() {
  const { currentUser } = useLMS();
  const data = generateDiagnosticData(currentUser?.id || '');

  const getInsightIcon = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'weakness':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'opportunity':
        return <Sparkles className="h-5 w-5 text-blue-600" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-purple-600" />;
    }
  };

  const getInsightBg = (type: LearningInsight['type']) => {
    switch (type) {
      case 'strength':
        return 'border-l-green-500 bg-green-50/50';
      case 'weakness':
        return 'border-l-amber-500 bg-amber-50/50';
      case 'opportunity':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'recommendation':
        return 'border-l-purple-500 bg-purple-50/50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Learning Insights
        </CardTitle>
        <CardDescription>
          Personalized insights based on your learning patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              'p-4 rounded-lg border-l-4 transition-colors',
              getInsightBg(insight.type)
            )}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
                {insight.actionable && insight.action && (
                  <Button variant="link" className="h-auto p-0 mt-2" asChild>
                    <a href={insight.action.href}>
                      {insight.action.label}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Performance Trends Component
export function PerformanceTrends() {
  const { currentUser } = useLMS();
  const data = generateDiagnosticData(currentUser?.id || '');
  const [metric, setMetric] = useState<'quizScore' | 'completionRate' | 'timeSpent'>('quizScore');

  const maxValue = Math.max(...data.performanceTrends.map((t) => t[metric]));
  const latestTrend = data.performanceTrends[data.performanceTrends.length - 1];
  const previousTrend = data.performanceTrends[data.performanceTrends.length - 2];
  const change = latestTrend[metric] - previousTrend[metric];
  const changePercent = ((change / previousTrend[metric]) * 100).toFixed(1);

  const getMetricLabel = (m: string) => {
    switch (m) {
      case 'quizScore':
        return 'Quiz Score';
      case 'completionRate':
        return 'Completion Rate';
      case 'timeSpent':
        return 'Time Spent (min)';
      default:
        return m;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Track your progress over time
            </CardDescription>
          </div>
          <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quizScore">Quiz Score</SelectItem>
              <SelectItem value="completionRate">Completion Rate</SelectItem>
              <SelectItem value="timeSpent">Time Spent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend Summary */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-muted/50">
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center',
            change >= 0 ? 'bg-green-100' : 'bg-red-100'
          )}>
            {change >= 0 ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{getMetricLabel(metric)}</p>
            <p className="text-2xl font-bold">
              {latestTrend[metric]}{metric !== 'timeSpent' ? '%' : ' min'}
            </p>
            <p className={cn(
              'text-sm font-medium',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? '+' : ''}{changePercent}% from last week
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-40 flex items-end gap-2">
          {data.performanceTrends.map((trend, index) => (
            <div key={trend.period} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={cn(
                  'w-full rounded-t transition-all hover:opacity-80',
                  index === data.performanceTrends.length - 1 ? 'bg-primary' : 'bg-primary/60'
                )}
                style={{ height: `${(trend[metric] / maxValue) * 120}px` }}
                title={`${trend[metric]}${metric !== 'timeSpent' ? '%' : ' min'}`}
              />
              <span className="text-xs text-muted-foreground">{trend.period.replace('Week ', 'W')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Topic Mastery Component
export function TopicMastery() {
  const { currentUser } = useLMS();
  const data = generateDiagnosticData(currentUser?.id || '');

  const getStatusConfig = (status: TopicMastery['status']) => {
    switch (status) {
      case 'mastered':
        return { label: 'Mastered', color: 'text-green-600', bg: 'bg-green-100' };
      case 'proficient':
        return { label: 'Proficient', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'learning':
        return { label: 'Learning', color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'needs_work':
        return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Topic Mastery
        </CardTitle>
        <CardDescription>
          Your proficiency level across different topics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.topicMastery.map((topic) => {
          const config = getStatusConfig(topic.status);
          return (
            <div key={topic.topic} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{topic.topic}</span>
                  <Badge variant="outline" className={cn('text-xs', config.color)}>
                    {config.label}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{topic.mastery}%</span>
              </div>
              <Progress 
                value={topic.mastery} 
                className={cn('h-2', config.bg)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{topic.assessmentCount} assessments</span>
                {topic.lastAssessment && (
                  <span>Last: {topic.lastAssessment.toLocaleDateString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Main Learning Diagnostics Dashboard
export function LearningDiagnosticsDashboard() {
  const { currentUser } = useLMS();
  const data = generateDiagnosticData(currentUser?.id || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Learning Diagnostics
          </h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your learning journey
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Refresh Analysis
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold">{data.overallScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Learning Velocity</p>
                <p className="text-2xl font-bold text-green-600">{data.learningVelocity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consistency</p>
                <p className="text-2xl font-bold">{data.consistencyScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{data.engagementScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="mastery">Topic Mastery</TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <LearningInsights />
        </TabsContent>

        <TabsContent value="skills">
          <SkillGapAnalysis />
        </TabsContent>

        <TabsContent value="trends">
          <PerformanceTrends />
        </TabsContent>

        <TabsContent value="mastery">
          <TopicMastery />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LearningDiagnosticsDashboard;
