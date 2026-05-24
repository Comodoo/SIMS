'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Timer,
  HelpCircle,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuestionType = 'single' | 'multiple' | 'true-false' | 'short-answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  hint?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  lessonId?: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  allowRetake: boolean;
  showAnswersAfter: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

interface QuizEngineProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onCancel?: () => void;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeTaken: number;
  answers: { questionId: string; answer: string | string[]; correct: boolean }[];
  completedAt: Date;
}

interface Answer {
  questionId: string;
  answer: string | string[];
}

export function QuizEngine({ quiz, onComplete, onCancel }: QuizEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz.questions);

  // Shuffle questions if enabled
  useEffect(() => {
    if (quiz.shuffleQuestions) {
      setQuestions([...quiz.questions].sort(() => Math.random() - 0.5));
    }
  }, [quiz]);

  // Timer
  useEffect(() => {
    if (!isStarted || isFinished || !quiz.timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        if (prev === 60 && !showTimeWarning) {
          setShowTimeWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isFinished, quiz.timeLimit]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswer = (questionId: string) => {
    return answers.find((a) => a.questionId === questionId)?.answer;
  };

  const setAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, answer };
        return updated;
      }
      return [...prev, { questionId, answer }];
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  const isAnswered = (questionId: string) => {
    const answer = getAnswer(questionId);
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== undefined && answer !== '';
  };

  const calculateResult = useCallback(() => {
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerResults: QuizResult['answers'] = [];

    questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = getAnswer(question.id);
      let correct = false;

      if (question.type === 'multiple') {
        const correctAnswers = question.correctAnswer as string[];
        const userAnswers = (userAnswer as string[]) || [];
        correct =
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((a) => userAnswers.includes(a));
      } else if (question.type === 'short-answer') {
        correct =
          (userAnswer as string)?.toLowerCase().trim() ===
          (question.correctAnswer as string).toLowerCase().trim();
      } else {
        correct = userAnswer === question.correctAnswer;
      }

      if (correct) earnedPoints += question.points;

      answerResults.push({
        questionId: question.id,
        answer: userAnswer || '',
        correct,
      });
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const timeTaken = quiz.timeLimit ? quiz.timeLimit * 60 - timeRemaining : 0;

    return {
      quizId: quiz.id,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed: percentage >= quiz.passingScore,
      timeTaken,
      answers: answerResults,
      completedAt: new Date(),
    };
  }, [questions, answers, quiz, timeRemaining]);

  const handleSubmit = () => {
    setShowSubmitDialog(false);
    const quizResult = calculateResult();
    setResult(quizResult);
    setIsFinished(true);
    setShowResults(true);
    onComplete(quizResult);
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;

  // Start Screen
  if (!isStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          {quiz.description && (
            <CardDescription className="text-base">{quiz.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted text-center">
              <HelpCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <Timer className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {quiz.timeLimit ? `${quiz.timeLimit} min` : 'Unlimited'}
              </p>
              <p className="text-sm text-muted-foreground">Time Limit</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <Trophy className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">{quiz.passingScore}%</p>
              <p className="text-sm text-muted-foreground">Passing Score</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <RefreshCw className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">{quiz.allowRetake ? 'Yes' : 'No'}</p>
              <p className="text-sm text-muted-foreground">Retakes Allowed</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Before you start:</p>
                <ul className="mt-1 text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  <li>Ensure you have a stable internet connection</li>
                  <li>You cannot pause once you start</li>
                  {quiz.timeLimit && <li>Timer will start immediately</li>}
                  <li>Answer all questions before submitting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button onClick={handleStart} className="flex-1">
            Start Quiz
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Results Screen
  if (showResults && result) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div
            className={cn(
              'h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4',
              result.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {result.passed ? (
              <Trophy className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {result.passed ? 'Congratulations!' : 'Keep Learning!'}
          </CardTitle>
          <CardDescription className="text-base">
            {result.passed
              ? "You've passed the quiz. Great job!"
              : `You need ${quiz.passingScore}% to pass. Don't give up!`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-primary mb-2">{result.percentage}%</p>
            <p className="text-muted-foreground">
              {result.score} out of {result.totalPoints} points
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-muted text-center">
              <p className="text-lg font-bold text-green-600">
                {result.answers.filter((a) => a.correct).length}
              </p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <p className="text-lg font-bold text-red-600">
                {result.answers.filter((a) => !a.correct).length}
              </p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <p className="text-lg font-bold">{formatTime(result.timeTaken)}</p>
              <p className="text-xs text-muted-foreground">Time Taken</p>
            </div>
          </div>

          {/* Answer Review */}
          {quiz.showAnswersAfter && (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Answer Review
              </h3>
              {questions.map((question, index) => {
                const answerResult = result.answers.find((a) => a.questionId === question.id);
                return (
                  <div
                    key={question.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      answerResult?.correct
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {answerResult?.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Q{index + 1}: {question.question}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your answer:{' '}
                          {Array.isArray(answerResult?.answer)
                            ? answerResult?.answer.join(', ')
                            : answerResult?.answer || 'Not answered'}
                        </p>
                        {!answerResult?.correct && (
                          <p className="text-xs text-green-600 mt-1">
                            Correct answer:{' '}
                            {Array.isArray(question.correctAnswer)
                              ? question.correctAnswer.join(', ')
                              : question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          {quiz.allowRetake && !result.passed && (
            <Button
              variant="outline"
              onClick={() => {
                setIsStarted(false);
                setIsFinished(false);
                setShowResults(false);
                setAnswers([]);
                setFlaggedQuestions(new Set());
                setCurrentQuestionIndex(0);
                setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
                setResult(null);
              }}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
          )}
          <Button onClick={onCancel} className="flex-1">
            Continue Learning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Quiz Taking Screen
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div>
          <h2 className="font-semibold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        {quiz.timeLimit && (
          <Badge
            variant={timeRemaining < 60 ? 'destructive' : 'secondary'}
            className="text-lg px-3 py-1"
          >
            <Clock className="mr-2 h-4 w-4" />
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answeredCount} answered</span>
          <span>{questions.length - answeredCount} remaining</span>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={cn(
              'h-8 w-8 rounded text-sm font-medium transition-colors',
              currentQuestionIndex === index && 'ring-2 ring-primary ring-offset-2',
              isAnswered(q.id) ? 'bg-primary text-primary-foreground' : 'bg-muted',
              flaggedQuestions.has(q.id) && 'ring-2 ring-orange-500'
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                {currentQuestion.type === 'single' && 'Single Choice'}
                {currentQuestion.type === 'multiple' && 'Multiple Choice'}
                {currentQuestion.type === 'true-false' && 'True/False'}
                {currentQuestion.type === 'short-answer' && 'Short Answer'}
              </Badge>
              <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
            </div>
            <Button
              variant={flaggedQuestions.has(currentQuestion.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFlag(currentQuestion.id)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{currentQuestion.points} points</span>
            {currentQuestion.hint && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="text-muted-foreground"
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showHint && currentQuestion.hint && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <Lightbulb className="h-4 w-4 inline mr-1" />
                {currentQuestion.hint}
              </p>
            </div>
          )}

          {/* Single Choice */}
          {currentQuestion.type === 'single' && (
            <RadioGroup
              value={(getAnswer(currentQuestion.id) as string) || ''}
              onValueChange={(value) => setAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options?.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Multiple Choice */}
          {currentQuestion.type === 'multiple' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const selected = (getAnswer(currentQuestion.id) as string[]) || [];
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      id={`option-${index}`}
                      checked={selected.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAnswer(currentQuestion.id, [...selected, option]);
                        } else {
                          setAnswer(
                            currentQuestion.id,
                            selected.filter((s) => s !== option)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === 'true-false' && (
            <RadioGroup
              value={(getAnswer(currentQuestion.id) as string) || ''}
              onValueChange={(value) => setAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="flex-1 cursor-pointer">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="flex-1 cursor-pointer">
                  False
                </Label>
              </div>
            </RadioGroup>
          )}

          {/* Short Answer */}
          {currentQuestion.type === 'short-answer' && (
            <Textarea
              placeholder="Type your answer here..."
              value={(getAnswer(currentQuestion.id) as string) || ''}
              onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              rows={4}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={() => setShowSubmitDialog(true)}>
              Submit Quiz
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < questions.length ? (
                <span className="text-orange-600">
                  You have {questions.length - answeredCount} unanswered questions. Are you sure
                  you want to submit?
                </span>
              ) : (
                "You've answered all questions. Ready to submit?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Quiz</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Warning */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              1 Minute Remaining!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have less than 1 minute left. Please review and submit your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default QuizEngine;
