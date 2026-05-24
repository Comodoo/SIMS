# AfriLearn LMS - Architecture Documentation

Technical architecture guide for the AfriLearn Learning Management System.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router │ React 19 │ TypeScript │ Tailwind CSS      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      State Management                            │
├─────────────────────────────────────────────────────────────────┤
│  AuthContext │ LMSContext │ NotificationsContext │ ThemeContext │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                       Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│          LocalStorage (Demo) │ Supabase (Production)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### App Router Structure

```
app/
├── (auth)/                    # Auth group (no layout nesting)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── forgot-password/page.tsx
│
├── (student)/                 # Student group (shared layout)
│   ├── layout.tsx            # Student navigation + AI assistant
│   ├── dashboard/page.tsx
│   ├── courses/
│   │   ├── page.tsx          # Catalog
│   │   └── [slug]/page.tsx   # Course detail
│   ├── learn/[slug]/page.tsx # Course player
│   └── ...
│
├── instructor/               # Instructor routes
│   ├── layout.tsx           # Instructor navigation
│   ├── page.tsx             # Dashboard
│   └── ...
│
├── admin/                   # Admin routes
│   ├── layout.tsx
│   └── page.tsx
│
├── employer/                # Employer routes
│   ├── layout.tsx
│   └── page.tsx
│
├── enterprise/              # B2B routes
│   └── page.tsx
│
├── verify/[code]/page.tsx   # Public verification
│
├── layout.tsx               # Root layout (providers)
├── page.tsx                 # Landing page
└── globals.css              # Global styles
```

### Component Organization

```
components/
├── ui/                      # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── shared/                  # Cross-role components
│   ├── mobile-bottom-nav.tsx
│   ├── notifications-dropdown.tsx
│   └── theme-toggle.tsx
│
├── student/                 # Student-specific
│   ├── certificate-generator.tsx
│   ├── course-announcements.tsx
│   ├── course-badges.tsx
│   ├── course-qa.tsx
│   ├── learning-diagnostics.tsx
│   └── learning-journey-tracker.tsx
│
├── instructor/              # Instructor-specific
│   ├── course-diagnostics.tsx
│   ├── curriculum-builder.tsx
│   └── course-assignment-manager.tsx
│
└── ai-learning-assistant.tsx
```

### Library Structure

```
lib/
├── types.ts                 # TypeScript definitions (2300+ lines)
├── lms-context.tsx         # Main LMS state management
├── auth-context.tsx        # Authentication state
├── notifications-context.tsx
├── theme-context.tsx
├── sample-data.ts          # Demo/seed data
└── utils.ts                # Utility functions (cn, formatters)
```

---

## Context Providers

### Provider Hierarchy

```tsx
// app/layout.tsx
<ThemeProvider>
  <AuthProvider>
    <LMSProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </LMSProvider>
  </AuthProvider>
</ThemeProvider>
```

### AuthContext

Manages user authentication state:

```typescript
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => void;
  enable2FA: () => Promise<string>;
  verify2FA: (code: string) => Promise<boolean>;
}
```

### LMSContext

Main application state:

```typescript
interface LMSContextType {
  // Data
  courses: Course[];
  enrollments: Enrollment[];
  currentUser: User | null;
  users: User[];
  reviews: Review[];
  announcements: Announcement[];
  
  // Course Actions
  getCourseBySlug: (slug: string) => Course | undefined;
  enrollInCourse: (courseId: string) => void;
  unenrollFromCourse: (courseId: string) => void;
  
  // Progress Actions
  updateLessonProgress: (courseId: string, lessonId: string, progress: LessonProgress) => void;
  completeLesson: (courseId: string, lessonId: string) => void;
  
  // Assessment Actions
  submitAssessment: (attempt: AssessmentAttempt) => void;
  
  // User Actions
  switchUser: (userId: string) => void;
  updateUserProfile: (data: Partial<User>) => void;
  
  // Instructor Actions
  createCourse: (course: Course) => void;
  updateCourse: (courseId: string, data: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  
  // Review Actions
  addReview: (review: Review) => void;
  replyToReview: (reviewId: string, reply: string) => void;
}
```

### NotificationsContext

Notification management:

```typescript
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}
```

### ThemeContext

Theme management:

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}
```

---

## Type System

### Core Entities

```typescript
// User Types
type UserRole = 'student' | 'instructor' | 'admin' | 'employer';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Course Types
type CourseStatus = 'draft' | 'published' | 'archived';
type LessonType = 'video' | 'document' | 'quiz' | 'assignment' | 'audio' | 'slideshow' | 'exam';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  price: number;
  status: CourseStatus;
  sections: Section[];
  // ... 20+ more fields
}

interface Section {
  id: string;
  courseId: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  type: LessonType;
  content: LessonContent;
  duration: number;
  materials: Material[];
}

// Enrollment Types
type EnrollmentStatus = 'active' | 'completed' | 'paused';

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: EnrollmentStatus;
  completedLessons: string[];
}
```

### Advanced Feature Types

```typescript
// AI Learning Assistant
interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: AIMessageContext;
}

// Skill System
interface SkillScore {
  id: string;
  userId: string;
  skillName: string;
  score: number; // 0-100
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  badges: SkillBadge[];
}

// Career Pipeline
interface JobPosting {
  id: string;
  employerId: string;
  title: string;
  requiredSkillScores: { skillId: string; minScore: number }[];
  linkedCourseIds: string[];
}

// Cohort Learning
interface Cohort {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  schedule: CohortSchedule[];
  members: CohortMember[];
}

// Mobile Payments
type MobileMoneyProvider = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'mtn_momo' | 'orange_money';

interface MobilePayment {
  id: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Subscriptions
type SubscriptionTier = 'free' | 'basic' | 'pro' | 'career_track';

interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'past_due';
}
```

---

## Routing Patterns

### Route Groups

Route groups allow layout sharing without affecting URL:

```
(student)/              # Group - not in URL
├── layout.tsx         # Shared layout
├── dashboard/         # URL: /dashboard
├── courses/           # URL: /courses
└── settings/          # URL: /settings
```

### Dynamic Routes

```
courses/[slug]/page.tsx    # /courses/python-basics
learn/[slug]/page.tsx      # /learn/python-basics
verify/[code]/page.tsx     # /verify/ABC123
```

### Parallel Routes (Future)

```
@modal/                    # Modal slot
@sidebar/                  # Sidebar slot
```

---

## Styling Architecture

### Tailwind CSS v4

Configuration in `globals.css`:

```css
@import 'tailwindcss';

@theme inline {
  /* Typography */
  --font-sans: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;
  
  /* Colors - Light Mode */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  /* ... more tokens */
}

.dark {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... dark mode tokens */
}
```

### Component Styling

Using `cn()` utility for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    "base-styles",
    isActive && "active-styles",
    disabled && "disabled-styles"
  )}
/>
```

### Responsive Design

Mobile-first approach:

```tsx
<div className="
  grid 
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
  gap-4
">
```

---

## Data Flow

### State Updates

```
User Action
    │
    ▼
Component Handler
    │
    ▼
Context Method (e.g., enrollInCourse)
    │
    ▼
State Update (useState/useReducer)
    │
    ▼
LocalStorage Persistence
    │
    ▼
Component Re-render
```

### Example: Course Enrollment

```typescript
// 1. User clicks "Enroll"
const handleEnroll = () => {
  enrollInCourse(course.id);
};

// 2. Context method
const enrollInCourse = (courseId: string) => {
  const newEnrollment: Enrollment = {
    id: generateId(),
    userId: currentUser.id,
    courseId,
    progress: 0,
    status: 'active',
    completedLessons: [],
    enrolledAt: new Date(),
  };
  
  setEnrollments(prev => [...prev, newEnrollment]);
  
  // Persist to storage
  localStorage.setItem('enrollments', JSON.stringify([...enrollments, newEnrollment]));
  
  // Add notification
  addNotification({
    type: 'course_update',
    title: 'Enrolled Successfully',
    message: `You're now enrolled in ${course.title}`,
  });
};

// 3. Components re-render with new state
```

---

## Performance Considerations

### Code Splitting

Next.js automatically code-splits by route. Additional optimization:

```tsx
// Dynamic imports for heavy components
const CertificateGenerator = dynamic(
  () => import('@/components/student/certificate-generator'),
  { loading: () => <Skeleton /> }
);
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={course.thumbnail}
  alt={course.title}
  width={400}
  height={225}
  priority={isAboveFold}
  placeholder="blur"
/>
```

### Memoization

```tsx
// Memoize expensive computations
const filteredCourses = useMemo(() => {
  return courses.filter(c => c.category === selectedCategory);
}, [courses, selectedCategory]);

// Memoize callbacks
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query);
}, []);
```

---

## Security Considerations

### Authentication

- JWT tokens with short expiry
- Refresh token rotation
- HTTP-only cookies for tokens
- CSRF protection

### Data Validation

```typescript
// Zod schemas for form validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Server-side validation
const validateRequest = (data: unknown) => {
  return loginSchema.safeParse(data);
};
```

### XSS Prevention

- React's automatic escaping
- Sanitize user-generated content
- CSP headers

### RBAC (Role-Based Access Control)

```typescript
// Route protection
const protectedRoutes = {
  '/instructor/*': ['instructor', 'admin'],
  '/admin/*': ['admin'],
  '/employer/*': ['employer'],
};

// Component-level checks
{user.role === 'instructor' && <InstructorActions />}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Component tests with React Testing Library
describe('CourseCard', () => {
  it('renders course information', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Context integration
describe('LMSContext', () => {
  it('enrolls user in course', async () => {
    const { result } = renderHook(() => useLMS(), {
      wrapper: LMSProvider,
    });
    
    act(() => {
      result.current.enrollInCourse('course-1');
    });
    
    expect(result.current.enrollments).toHaveLength(1);
  });
});
```

### E2E Tests

```typescript
// Playwright tests
test('complete enrollment flow', async ({ page }) => {
  await page.goto('/courses/python-basics');
  await page.click('text=Enroll Now');
  await page.fill('[name=card-number]', '4242424242424242');
  await page.click('text=Complete Payment');
  await expect(page).toHaveURL('/learn/python-basics');
});
```

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Environment Variables

```
# Production
NEXT_PUBLIC_APP_URL=https://app.afrilearn.com
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Payments
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...

# AI
OPENAI_API_KEY=...
```

---

## Future Architecture Plans

### Microservices Migration

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Auth      │  │   Courses   │  │   Payments  │
│   Service   │  │   Service   │  │   Service   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                ┌───────▼───────┐
                │   API Gateway │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │   Frontend    │
                └───────────────┘
```

### Real-time Features

- WebSocket connections for live sessions
- Real-time notifications
- Collaborative editing
- Live chat

### Mobile Apps

- React Native apps
- Shared business logic
- Offline-first architecture
- Push notifications
