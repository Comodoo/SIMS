'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Course, Enrollment } from '@/lib/types';
import { formatDuration } from '@/lib/sample-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Lock,
  Award,
  Clock,
  BookOpen,
  TrendingUp,
  Target,
  Zap,
  Headphones,
  Images,
  GraduationCap,
  Download,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LessonType } from '@/lib/types';

const lessonTypeIcons: Record<LessonType, React.ReactNode> = {
  video: <PlayCircle className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  assignment: <ClipboardList className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  slideshow: <Images className="h-4 w-4" />,
  exam: <GraduationCap className="h-4 w-4" />,
};

interface LearningJourneyTrackerProps {
  course: Course;
  enrollment: Enrollment;
  onLessonClick?: (lessonId: string, sectionId: string) => void;
  currentLessonId?: string;
}

export function LearningJourneyTracker({
  course,
  enrollment,
  onLessonClick,
  currentLessonId,
}: LearningJourneyTrackerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    course.sections.map((s) => s.id)
  );

  const completedLessons = new Set(enrollment.completedLessons || []);
  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Calculate time stats
  const totalDuration = course.duration;
  const completedDuration = course.sections.reduce((acc, section) => {
    return acc + section.lessons
      .filter((l) => completedLessons.has(l.id))
      .reduce((sum, l) => sum + l.duration, 0);
  }, 0);
  const remainingDuration = totalDuration - completedDuration;

  // Find next lesson to continue
  const getNextLesson = () => {
    for (const section of course.sections) {
      for (const lesson of section.lessons) {
        if (!completedLessons.has(lesson.id)) {
          return { lesson, section };
        }
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

  // Calculate section progress
  const getSectionProgress = (sectionId: string) => {
    const section = course.sections.find((s) => s.id === sectionId);
    if (!section) return { completed: 0, total: 0, percent: 0 };
    
    const completed = section.lessons.filter((l) => completedLessons.has(l.id)).length;
    const total = section.lessons.length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <div className="space-y-4">
      {/* Progress Overview Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Progress Circle */}
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 mx-auto lg:mx-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${progressPercent * 2.83} 283`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl lg:text-2xl font-bold">{progressPercent}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-semibold text-lg mb-2">Your Progress</h3>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>{completedCount}</strong>/{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{formatDuration(remainingDuration)}</strong> remaining</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>

            {/* Continue Button */}
            {nextLesson && (
              <div className="flex-shrink-0">
                <Button
                  onClick={() => onLessonClick?.(nextLesson.lesson.id, nextLesson.section.id)}
                  className="w-full lg:w-auto"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </div>
            )}

            {progressPercent === 100 && (
              <div className="flex-shrink-0">
                <Button variant="secondary" className="w-full lg:w-auto gap-2">
                  <Award className="h-4 w-4" />
                  Get Certificate
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <CardContent className="p-4 border-t">
          <div className="flex items-center justify-between text-xs lg:text-sm">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                progressPercent >= 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <BookOpen className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">Started</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.min(progressPercent / 25 * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                progressPercent >= 25 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Target className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">25%</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.max(0, Math.min((progressPercent - 25) / 25 * 100, 100))}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                progressPercent >= 50 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <TrendingUp className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">50%</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.max(0, Math.min((progressPercent - 50) / 25 * 100, 100))}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                progressPercent >= 75 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Zap className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">75%</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ width: `${Math.max(0, Math.min((progressPercent - 75) / 25 * 100, 100))}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                progressPercent >= 100 ? 'bg-green-600 text-white' : 'bg-muted'
              )}>
                <Award className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">Done</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Curriculum */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Course Curriculum</span>
            <Badge variant="outline" className="font-normal">
              {course.sections.length} sections
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="divide-y"
          >
            {course.sections.map((section, sectionIndex) => {
              const sectionProgress = getSectionProgress(section.id);
              const isSectionComplete = sectionProgress.percent === 100;

              return (
                <AccordionItem key={section.id} value={section.id} className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      {/* Section Status Icon */}
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium',
                        isSectionComplete 
                          ? 'bg-green-100 text-green-700' 
                          : sectionProgress.completed > 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                      )}>
                        {isSectionComplete ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          sectionIndex + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-1">{section.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{sectionProgress.completed}/{sectionProgress.total} lessons</span>
                          <span>-</span>
                          <span>{formatDuration(section.lessons.reduce((acc, l) => acc + l.duration, 0))}</span>
                        </div>
                      </div>

                      {/* Section Progress */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Progress value={sectionProgress.percent} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-8">
                          {sectionProgress.percent}%
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="divide-y">
                      {section.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        const isCurrent = currentLessonId === lesson.id;
                        const isLocked = false; // Can add unlock logic

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => !isLocked && onLessonClick?.(lesson.id, section.id)}
                            disabled={isLocked}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                              isCurrent && 'bg-primary/5 border-l-2 border-primary',
                              !isCurrent && !isLocked && 'hover:bg-muted/50',
                              isLocked && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {/* Lesson Status */}
                            <div className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                              isCompleted && 'bg-green-100 text-green-600',
                              !isCompleted && isCurrent && 'bg-primary text-primary-foreground',
                              !isCompleted && !isCurrent && 'border-2 border-muted-foreground/30'
                            )}>
                              {isCompleted ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : isCurrent ? (
                                <PlayCircle className="h-3 w-3" />
                              ) : isLocked ? (
                                <Lock className="h-3 w-3" />
                              ) : null}
                            </div>

                            {/* Lesson Type Icon */}
                            <div className="text-muted-foreground">
                              {lessonTypeIcons[lesson.type]}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                'text-sm line-clamp-1',
                                isCompleted && 'text-muted-foreground',
                                isCurrent && 'font-medium text-primary'
                              )}>
                                {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                              </div>
                              {lesson.materials && lesson.materials.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Download className="h-3 w-3" />
                                  <span>{lesson.materials.length} resources</span>
                                </div>
                              )}
                            </div>

                            {/* Duration & Status */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(lesson.duration)}
                              </span>
                              {isCurrent && (
                                <Badge variant="secondary" className="text-xs">
                                  Playing
                                </Badge>
                              )}
                              {!isLocked && !isCurrent && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Completion Banner */}
      {progressPercent === 100 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row items-center gap-4 text-center lg:text-left">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-green-800">
                  Congratulations! You completed the course!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  You can now claim your certificate and share it with employers
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 w-full lg:w-auto">
                <Award className="h-4 w-4 mr-2" />
                Claim Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact Progress Card for Dashboard
export function CourseProgressCard({
  course,
  enrollment,
}: {
  course: Course;
  enrollment: Enrollment;
}) {
  const completedLessons = new Set(enrollment.completedLessons || []);
  const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-24 h-full object-cover hidden sm:block"
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 text-sm">{course.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{course.instructorName}</p>
            </div>
            <Badge 
              variant={progressPercent === 100 ? 'default' : 'secondary'}
              className={progressPercent === 100 ? 'bg-green-600' : ''}
            >
              {progressPercent}%
            </Badge>
          </div>
          
          <Progress value={progressPercent} className="h-1.5 mt-3" />
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {completedLessons.size}/{totalLessons} lessons
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
              <Link href={`/learn/${course.slug}`}>
                {progressPercent === 100 ? 'Review' : 'Continue'}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
