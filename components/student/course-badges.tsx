'use client';

import { useMemo } from 'react';
import { Course } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Flame,
  TrendingUp,
  Award,
  Clock,
  Users,
  Star,
  Zap,
  Sparkles,
  Crown,
  Target,
  Rocket,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CourseBadgeType =
  | 'bestseller'
  | 'trending'
  | 'highly-rated'
  | 'new'
  | 'popular'
  | 'top-pick'
  | 'featured'
  | 'hot'
  | 'beginner-friendly'
  | 'advanced';

interface CourseBadgeConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
  tooltip: string;
}

const BADGE_CONFIGS: Record<CourseBadgeType, CourseBadgeConfig> = {
  bestseller: {
    label: 'Bestseller',
    icon: <Crown className="h-3 w-3" />,
    className: 'bg-amber-500 text-white hover:bg-amber-600',
    tooltip: 'One of our most popular courses',
  },
  trending: {
    label: 'Trending',
    icon: <TrendingUp className="h-3 w-3" />,
    className: 'bg-orange-500 text-white hover:bg-orange-600',
    tooltip: 'High enrollment rate this week',
  },
  'highly-rated': {
    label: 'Highly Rated',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-yellow-500 text-white hover:bg-yellow-600',
    tooltip: 'Rated 4.5+ by students',
  },
  new: {
    label: 'New',
    icon: <Sparkles className="h-3 w-3" />,
    className: 'bg-green-500 text-white hover:bg-green-600',
    tooltip: 'Recently published course',
  },
  popular: {
    label: 'Popular',
    icon: <Users className="h-3 w-3" />,
    className: 'bg-blue-500 text-white hover:bg-blue-600',
    tooltip: 'Thousands of students enrolled',
  },
  'top-pick': {
    label: 'Top Pick',
    icon: <Target className="h-3 w-3" />,
    className: 'bg-indigo-500 text-white hover:bg-indigo-600',
    tooltip: 'Highly recommended by our team',
  },
  featured: {
    label: 'Featured',
    icon: <Award className="h-3 w-3" />,
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    tooltip: 'Featured course of the week',
  },
  hot: {
    label: 'Hot',
    icon: <Flame className="h-3 w-3" />,
    className: 'bg-red-500 text-white hover:bg-red-600',
    tooltip: 'Gaining popularity fast',
  },
  'beginner-friendly': {
    label: 'Beginner Friendly',
    icon: <Rocket className="h-3 w-3" />,
    className: 'bg-teal-500 text-white hover:bg-teal-600',
    tooltip: 'Great for beginners',
  },
  advanced: {
    label: 'Advanced',
    icon: <GraduationCap className="h-3 w-3" />,
    className: 'bg-purple-500 text-white hover:bg-purple-600',
    tooltip: 'For experienced learners',
  },
};

interface CourseBadgeProps {
  type: CourseBadgeType;
  size?: 'sm' | 'default';
  showTooltip?: boolean;
}

export function CourseBadge({ type, size = 'default', showTooltip = true }: CourseBadgeProps) {
  const config = BADGE_CONFIGS[type];

  if (!config) return null;

  const badge = (
    <Badge
      className={cn(
        'flex items-center gap-1',
        config.className,
        size === 'sm' && 'text-[10px] px-1.5 py-0 h-5'
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Calculate badges for a course based on its attributes
export function getCourseBadges(course: Course): CourseBadgeType[] {
  const badges: CourseBadgeType[] = [];

  // Check if course is new (within last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (new Date(course.createdAt) > thirtyDaysAgo) {
    badges.push('new');
  }

  // Check if highly rated
  if (course.rating >= 4.5 && course.reviewsCount >= 10) {
    badges.push('highly-rated');
  }

  // Check if bestseller (high students + high rating)
  if (course.totalStudents >= 5000 && course.rating >= 4.3) {
    badges.push('bestseller');
  } else if (course.totalStudents >= 1000) {
    badges.push('popular');
  }

  // Check level badges
  if (course.level === 'beginner') {
    badges.push('beginner-friendly');
  } else if (course.level === 'advanced') {
    badges.push('advanced');
  }

  // Limit to max 3 badges
  return badges.slice(0, 3);
}

interface CourseBadgesListProps {
  course: Course;
  size?: 'sm' | 'default';
  limit?: number;
  className?: string;
}

export function CourseBadgesList({
  course,
  size = 'default',
  limit = 3,
  className,
}: CourseBadgesListProps) {
  const badges = useMemo(() => getCourseBadges(course).slice(0, limit), [course, limit]);

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {badges.map((badge) => (
        <CourseBadge key={badge} type={badge} size={size} />
      ))}
    </div>
  );
}

// Recommendation badge that explains why a course is recommended
interface RecommendationBadgeProps {
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export function RecommendationBadge({ reason, priority }: RecommendationBadgeProps) {
  const config = {
    high: {
      icon: <Zap className="h-3 w-3" />,
      className: 'bg-green-500 text-white',
      label: 'Top Match',
    },
    medium: {
      icon: <Target className="h-3 w-3" />,
      className: 'bg-blue-500 text-white',
      label: 'Good Fit',
    },
    low: {
      icon: <Sparkles className="h-3 w-3" />,
      className: 'bg-gray-500 text-white',
      label: 'Suggested',
    },
  }[priority];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn('flex items-center gap-1', config.className)}>
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Progress badge for enrolled courses
interface ProgressBadgeProps {
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

export function ProgressBadge({ progress, status }: ProgressBadgeProps) {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Award className="h-3 w-3 mr-1" />
        Completed
      </Badge>
    );
  }

  if (status === 'paused') {
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Paused
      </Badge>
    );
  }

  if (progress >= 75) {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Flame className="h-3 w-3 mr-1" />
        Almost Done
      </Badge>
    );
  }

  if (progress > 0) {
    return (
      <Badge variant="secondary">
        <TrendingUp className="h-3 w-3 mr-1" />
        {progress}% Complete
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <Rocket className="h-3 w-3 mr-1" />
      Just Started
    </Badge>
  );
}

// Achievement badges for student profile
export type AchievementType =
  | 'first_course'
  | 'fast_learner'
  | 'dedicated'
  | 'perfectionist'
  | 'social'
  | 'completionist';

interface AchievementBadgeConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}

const ACHIEVEMENT_CONFIGS: Record<AchievementType, AchievementBadgeConfig> = {
  first_course: {
    label: 'First Steps',
    description: 'Completed your first course',
    icon: <Rocket className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  fast_learner: {
    label: 'Fast Learner',
    description: 'Completed a course in under a week',
    icon: <Zap className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  },
  dedicated: {
    label: 'Dedicated',
    description: '7-day learning streak',
    icon: <Flame className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-red-500 to-pink-500',
  },
  perfectionist: {
    label: 'Perfectionist',
    description: 'Scored 100% on an exam',
    icon: <Crown className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-purple-500 to-indigo-500',
  },
  social: {
    label: 'Social Butterfly',
    description: 'Helped 10 students in Q&A',
    icon: <Users className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-green-500 to-teal-500',
  },
  completionist: {
    label: 'Completionist',
    description: 'Completed 5 courses',
    icon: <Award className="h-4 w-4" />,
    className: 'bg-gradient-to-r from-amber-500 to-yellow-500',
  },
};

interface AchievementBadgeProps {
  type: AchievementType;
  earned?: boolean;
}

export function AchievementBadge({ type, earned = true }: AchievementBadgeProps) {
  const config = ACHIEVEMENT_CONFIGS[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full text-white',
              earned ? config.className : 'bg-gray-300 dark:bg-gray-700',
              !earned && 'opacity-50'
            )}
          >
            {config.icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {!earned && <p className="text-xs text-amber-500 mt-1">Not yet earned</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AchievementBadgesListProps {
  achievements: AchievementType[];
  showLocked?: boolean;
}

export function AchievementBadgesList({ achievements, showLocked = false }: AchievementBadgesListProps) {
  const allTypes: AchievementType[] = [
    'first_course',
    'fast_learner',
    'dedicated',
    'perfectionist',
    'social',
    'completionist',
  ];

  const displayed = showLocked ? allTypes : achievements;

  return (
    <div className="flex flex-wrap gap-3">
      {displayed.map((type) => (
        <AchievementBadge key={type} type={type} earned={achievements.includes(type)} />
      ))}
    </div>
  );
}
