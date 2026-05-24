'use client';

import { useState } from 'react';
import { useLMS } from '@/lib/lms-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Clock,
  ThumbsUp,
  Send,
  Edit,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseReviewFormProps {
  courseId: string;
  courseName: string;
  onSubmit?: () => void;
  showInCard?: boolean;
}

export function CourseReviewForm({
  courseId,
  courseName,
  onSubmit,
  showInCard = true,
}: CourseReviewFormProps) {
  const { currentUser, addReview, getCourseReviews, getEnrollment } = useLMS();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const enrollment = getEnrollment(courseId);
  const existingReviews = getCourseReviews(courseId);
  const userReview = existingReviews.find(r => r.userId === currentUser?.id);

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      addReview(courseId, rating, comment);
      setSubmitted(true);
      onSubmit?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show for enrolled users
  if (!enrollment) {
    return null;
  }

  // Already submitted a review
  if (userReview) {
    return (
      <Card className={cn(!showInCard && 'border-0 shadow-none')}>
        <CardContent className={cn('p-6', !showInCard && 'p-0')}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Thank you for your review!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your feedback helps other students make informed decisions.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-5 w-5',
                        star <= userReview.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <Badge variant={
                  userReview.status === 'approved' ? 'default' :
                  userReview.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {userReview.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {userReview.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                  {userReview.status.charAt(0).toUpperCase() + userReview.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm mt-3 text-muted-foreground">
                {`"${userReview.comment}"`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <Card className={cn('border-green-200 bg-green-50 dark:bg-green-950/20', !showInCard && 'border-0 shadow-none')}>
        <CardContent className={cn('p-6 text-center', !showInCard && 'p-0')}>
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h3 className="font-semibold mt-4">Review Submitted!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your review is pending approval and will be visible soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Rating */}
      <div className="text-center">
        <h4 className="font-medium mb-3">How would you rate this course?</h4>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  'h-10 w-10 transition-colors',
                  star <= (hoveredRating || rating)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-300 dark:text-gray-600'
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {rating === 0
            ? 'Click to rate'
            : rating === 1
            ? 'Poor'
            : rating === 2
            ? 'Fair'
            : rating === 3
            ? 'Good'
            : rating === 4
            ? 'Very Good'
            : 'Excellent'}
        </p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Share your experience
        </label>
        <Textarea
          placeholder="What did you like or dislike about this course? Would you recommend it to others?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 20 characters ({comment.length}/20)
        </p>
      </div>

      {/* Tips */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h5 className="text-sm font-medium mb-2">Tips for a helpful review:</h5>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-start gap-2">
            <ThumbsUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Mention specific topics or lessons that were valuable
          </li>
          <li className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Share how the course helped you achieve your goals
          </li>
          <li className="flex items-start gap-2">
            <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Be honest but constructive with feedback
          </li>
        </ul>
      </div>

      {/* Submit */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={rating === 0 || comment.length < 20 || isSubmitting}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  );

  if (!showInCard) {
    return content;
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Leave a Review</CardTitle>
            <CardDescription>
              Share your feedback about {courseName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

// Compact review prompt for completed courses
interface ReviewPromptProps {
  courseId: string;
  courseName: string;
}

export function ReviewPrompt({ courseId, courseName }: ReviewPromptProps) {
  const { currentUser, getCourseReviews, getEnrollment } = useLMS();
  const [open, setOpen] = useState(false);

  const enrollment = getEnrollment(courseId);
  const existingReviews = getCourseReviews(courseId);
  const userReview = existingReviews.find(r => r.userId === currentUser?.id);

  // Only show for completed courses without a review
  if (!enrollment || enrollment.status !== 'completed' || userReview) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">How was your experience?</h4>
                <p className="text-xs text-muted-foreground">
                  Leave a review for {courseName}
                </p>
              </div>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review {courseName}</DialogTitle>
        </DialogHeader>
        <CourseReviewForm
          courseId={courseId}
          courseName={courseName}
          showInCard={false}
          onSubmit={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Review display for course page
interface CourseReviewsDisplayProps {
  courseId: string;
  limit?: number;
}

export function CourseReviewsDisplay({ courseId, limit = 5 }: CourseReviewsDisplayProps) {
  const { getApprovedCourseReviews } = useLMS();
  const reviews = getApprovedCourseReviews(courseId);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
        <p>No reviews yet. Be the first to leave a review!</p>
      </div>
    );
  }

  const displayReviews = limit ? reviews.slice(0, limit) : reviews;

  return (
    <div className="space-y-4">
      {displayReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">
                  {review.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{review.userName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= review.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-2 text-muted-foreground">{review.comment}</p>
                {review.instructorReply && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30">
                    <p className="text-xs font-medium text-primary">Instructor Response:</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.instructorReply}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {limit && reviews.length > limit && (
        <p className="text-sm text-muted-foreground text-center">
          And {reviews.length - limit} more reviews...
        </p>
      )}
    </div>
  );
}
