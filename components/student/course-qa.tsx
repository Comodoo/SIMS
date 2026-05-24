'use client';

import { useState } from 'react';
import { useLMS } from '@/lib/lms-context';
import { Question, Answer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle,
  ThumbsUp,
  CheckCircle,
  Plus,
  Search,
  MoreVertical,
  Pin,
  Trash2,
  Edit,
  Send,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseQAProps {
  courseId: string;
  lessonId?: string;
}

export function CourseQA({ courseId, lessonId }: CourseQAProps) {
  const {
    currentUser,
    getCourseQuestions,
    addQuestion,
    upvoteQuestion,
    deleteQuestion,
    updateQuestion,
    addAnswer,
    upvoteAnswer,
    acceptAnswer,
    deleteAnswer,
    getQuestionAnswers,
    getCourse,
  } = useLMS();

  const course = getCourse(courseId);
  const allQuestions = getCourseQuestions(courseId);
  const questions = lessonId 
    ? allQuestions.filter(q => q.lessonId === lessonId)
    : allQuestions;

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState<Record<string, string>>({});

  const isInstructor = currentUser?.id === course?.instructorId;

  const filteredQuestions = questions
    .filter(q => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return q.title.toLowerCase().includes(query) || q.content.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(q => {
      if (filter === 'unanswered') return q.answerCount === 0;
      if (filter === 'resolved') return q.isResolved;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortBy === 'popular') return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleSubmitQuestion = () => {
    if (!questionTitle.trim() || !questionContent.trim()) return;
    
    addQuestion(courseId, questionTitle, questionContent, lessonId);
    setQuestionTitle('');
    setQuestionContent('');
    setNewQuestionOpen(false);
  };

  const handleSubmitAnswer = (questionId: string) => {
    const content = answerContent[questionId];
    if (!content?.trim()) return;
    
    addAnswer(questionId, content);
    setAnswerContent(prev => ({ ...prev, [questionId]: '' }));
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Q&A Discussion
          </h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} in this {lessonId ? 'lesson' : 'course'}
          </p>
        </div>

        <Dialog open={newQuestionOpen} onOpenChange={setNewQuestionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ask a Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Input
                  placeholder="Question title"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Describe your question in detail..."
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewQuestionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitQuestion} disabled={!questionTitle.trim() || !questionContent.trim()}>
                  Post Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="all">All Questions</option>
            <option value="unanswered">Unanswered</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No questions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to ask a question!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isExpanded={expandedQuestion === question.id}
              onToggle={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
              onUpvote={() => upvoteQuestion(question.id)}
              onDelete={() => deleteQuestion(question.id)}
              onPin={() => updateQuestion(question.id, { isPinned: !question.isPinned })}
              getAnswers={() => getQuestionAnswers(question.id)}
              onSubmitAnswer={(content) => {
                addAnswer(question.id, content);
              }}
              onUpvoteAnswer={upvoteAnswer}
              onAcceptAnswer={acceptAnswer}
              onDeleteAnswer={deleteAnswer}
              currentUserId={currentUser?.id}
              isInstructor={isInstructor}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
  onUpvote: () => void;
  onDelete: () => void;
  onPin: () => void;
  getAnswers: () => Answer[];
  onSubmitAnswer: (content: string) => void;
  onUpvoteAnswer: (answerId: string) => void;
  onAcceptAnswer: (answerId: string) => void;
  onDeleteAnswer: (answerId: string) => void;
  currentUserId?: string;
  isInstructor: boolean;
  formatTimeAgo: (date: Date) => string;
}

function QuestionCard({
  question,
  isExpanded,
  onToggle,
  onUpvote,
  onDelete,
  onPin,
  getAnswers,
  onSubmitAnswer,
  onUpvoteAnswer,
  onAcceptAnswer,
  onDeleteAnswer,
  currentUserId,
  isInstructor,
  formatTimeAgo,
}: QuestionCardProps) {
  const [answerText, setAnswerText] = useState('');
  const answers = getAnswers();
  const hasUpvoted = currentUserId && question.upvotedBy.includes(currentUserId);
  const canModify = currentUserId === question.userId || isInstructor;

  const handleSubmit = () => {
    if (!answerText.trim()) return;
    onSubmitAnswer(answerText);
    setAnswerText('');
  };

  return (
    <Card className={cn(question.isPinned && 'border-primary/50')}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Upvote */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn('p-2', hasUpvoted && 'text-primary')}
              onClick={onUpvote}
            >
              <ThumbsUp className={cn('h-4 w-4', hasUpvoted && 'fill-current')} />
            </Button>
            <span className="text-sm font-medium">{question.upvotes}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {question.isPinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {question.isResolved && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  )}
                </div>
                <h3 
                  className="font-semibold mt-1 cursor-pointer hover:text-primary"
                  onClick={onToggle}
                >
                  {question.title}
                </h3>
              </div>
              
              {canModify && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isInstructor && (
                      <DropdownMenuItem onClick={onPin}>
                        <Pin className="mr-2 h-4 w-4" />
                        {question.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {question.content}
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={question.userAvatar} />
                  <AvatarFallback className="text-[10px]">
                    {question.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{question.userName}</span>
              </div>
              <span>{formatTimeAgo(question.createdAt)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto p-0"
                onClick={onToggle}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}
                {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 space-y-4">
                <Separator />
                
                {/* Full Question */}
                <div className="text-sm whitespace-pre-wrap">{question.content}</div>

                {/* Answers */}
                {answers.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h4>
                    {answers.map((answer) => (
                      <AnswerCard
                        key={answer.id}
                        answer={answer}
                        onUpvote={() => onUpvoteAnswer(answer.id)}
                        onAccept={() => onAcceptAnswer(answer.id)}
                        onDelete={() => onDeleteAnswer(answer.id)}
                        currentUserId={currentUserId}
                        isInstructor={isInstructor}
                        isQuestionOwner={currentUserId === question.userId}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))}
                  </div>
                )}

                {/* Add Answer */}
                <div className="pt-4">
                  <Textarea
                    placeholder="Write your answer..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={handleSubmit} disabled={!answerText.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Post Answer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnswerCardProps {
  answer: Answer;
  onUpvote: () => void;
  onAccept: () => void;
  onDelete: () => void;
  currentUserId?: string;
  isInstructor: boolean;
  isQuestionOwner: boolean;
  formatTimeAgo: (date: Date) => string;
}

function AnswerCard({
  answer,
  onUpvote,
  onAccept,
  onDelete,
  currentUserId,
  isInstructor,
  isQuestionOwner,
  formatTimeAgo,
}: AnswerCardProps) {
  const hasUpvoted = currentUserId && answer.upvotedBy.includes(currentUserId);
  const canModify = currentUserId === answer.userId || isInstructor;
  const canAccept = isQuestionOwner || isInstructor;

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      answer.isAccepted && 'border-green-500 bg-green-50',
    )}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn('p-1', hasUpvoted && 'text-primary')}
            onClick={onUpvote}
          >
            <ThumbsUp className={cn('h-3 w-3', hasUpvoted && 'fill-current')} />
          </Button>
          <span className="text-xs font-medium">{answer.upvotes}</span>
          {answer.isAccepted && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={answer.userAvatar} />
              <AvatarFallback className="text-[10px]">
                {answer.userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{answer.userName}</span>
            {answer.isInstructor && (
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                Instructor
              </Badge>
            )}
            {answer.isAccepted && (
              <Badge className="bg-green-600 text-white text-xs">
                Accepted
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(answer.createdAt)}
            </span>
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{answer.content}</p>

          <div className="flex items-center gap-2 mt-3">
            {canAccept && !answer.isAccepted && (
              <Button variant="outline" size="sm" onClick={onAccept}>
                <CheckCircle className="mr-1 h-3 w-3" />
                Accept
              </Button>
            )}
            {canModify && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
