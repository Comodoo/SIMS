# AfriLearn LMS - Learning Management System

A comprehensive, mobile-first Learning Management System built for African markets with advanced features including AI-powered learning assistance, mobile money payments, skill-based progression, career pipeline integration, and multi-language support.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Core Features](#core-features)
- [Advanced Features](#advanced-features)
- [Internationalization](#internationalization)
- [Theming & Accessibility](#theming--accessibility)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## Overview

AfriLearn LMS is a full-featured e-learning platform designed specifically for the African market. It supports multiple user roles (Students, Instructors, Employers, Enterprise, Admin) and includes unique features like mobile money payments (M-Pesa, MTN MoMo, Airtel Money), offline learning capabilities, and multi-language support for 12+ African languages.

### Key Highlights

- **Mobile-First Design**: Optimized for mobile devices with bottom navigation and responsive layouts
- **Africa-Focused Payments**: M-Pesa, MTN Mobile Money, Airtel Money, Tigo Pesa, Orange Money
- **AI Learning Assistant**: Context-aware AI tutor for personalized learning
- **Skill-Based Progression**: Verifiable skill badges with employer endorsements
- **Career Pipeline**: Direct job matching with employers based on course completions
- **Cohort Learning**: Scheduled courses with live sessions and group assignments
- **Multi-Language Support**: 12+ languages including Swahili, Hausa, Amharic, Arabic, Yoruba, Zulu
- **Advanced Theming**: Light/dark modes, accent colors, font sizes, accessibility options
- **Real-Time Messaging**: Student-instructor chat with file sharing and reactions
- **Demo Mode**: Investor-ready demo showcasing all platform features

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 4.0 |
| UI Components | shadcn/ui + Radix UI |
| State Management | React Context API |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date Handling | date-fns |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/afrilearn-lms.git
cd afrilearn-lms

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

Visit `/demo` to explore the platform as an investor without signing up. The demo mode provides a guided tour of all features across Student, Instructor, and Admin dashboards.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (when integrating with Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payment Providers
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MTN_MOMO_API_KEY=your_mtn_key

# AI Assistant
OPENAI_API_KEY=your_openai_key
```

---

## Project Structure

```
afrilearn-lms/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/               # Login page
│   │   ├── signup/              # Registration page
│   │   └── forgot-password/     # Password reset
│   ├── (student)/               # Student dashboard & features
│   │   ├── dashboard/           # Student home
│   │   ├── courses/             # Course catalog & details
│   │   ├── my-learning/         # Enrolled courses
│   │   ├── learn/[slug]/        # Course player
│   │   ├── messages/            # Chat with instructors
│   │   ├── skills/              # Skill progression
│   │   ├── careers/             # Job opportunities
│   │   ├── cohorts/             # Cohort-based courses
│   │   ├── community/           # Study rooms
│   │   ├── labs/                # Practical labs
│   │   ├── certifications/      # Certificates
│   │   ├── subscription/        # Subscription plans
│   │   ├── help/                # Help center & FAQ
│   │   ├── search/              # Global search results
│   │   ├── onboarding/          # New user onboarding
│   │   └── settings/            # Account settings
│   ├── instructor/              # Instructor dashboard
│   │   ├── courses/             # Course management
│   │   ├── messages/            # Student messages
│   │   ├── students/            # Student management
│   │   ├── analytics/           # Course analytics
│   │   ├── revenue/             # Earnings & payouts
│   │   └── team/                # Team management
│   ├── admin/                   # Platform administration
│   │   ├── users/               # User management
│   │   ├── courses/             # Course moderation
│   │   ├── analytics/           # Platform analytics
│   │   ├── revenue/             # Revenue management
│   │   ├── payments/            # Payment management
│   │   ├── content/             # Content management
│   │   ├── messages/            # Support messages
│   │   ├── emails/              # Email templates
│   │   ├── settings/            # Platform settings
│   │   └── security/            # Security dashboard
│   ├── employer/                # Employer talent portal
│   ├── enterprise/              # B2B enterprise features
│   ├── pricing/                 # Pricing page
│   ├── demo/                    # Demo/investor tour
│   └── verify/[code]/           # Certificate verification
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── shared/                  # Shared components
│   │   ├── mobile-bottom-nav.tsx
│   │   ├── notifications-dropdown.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── language-selector.tsx
│   │   ├── global-search.tsx
│   │   ├── chat-bubble.tsx
│   │   └── demo-banner.tsx
│   ├── student/                 # Student-specific components
│   │   ├── certificate-generator.tsx
│   │   ├── video-player.tsx
│   │   ├── quiz-engine.tsx
│   │   └── learning-journey-tracker.tsx
│   └── instructor/              # Instructor components
│       ├── course-diagnostics.tsx
│       └── curriculum-builder.tsx
├── lib/
│   ├── types.ts                 # TypeScript type definitions
│   ├── lms-context.tsx          # Main LMS state context
│   ├── auth-context.tsx         # Authentication context
│   ├── notifications-context.tsx # Notifications state
│   ├── theme-context.tsx        # Theme management
│   ├── language-context.tsx     # Language/i18n context
│   ├── chat-context.tsx         # Messaging context
│   ├── sample-data.ts           # Demo/seed data
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

---

## User Roles

### 1. Student

Primary learner role with access to:
- Course browsing and enrollment
- Learning dashboard with progress tracking
- Real-time messaging with instructors
- Skill assessments and badges
- Career opportunities and job applications
- Community features (study rooms, accountability groups)
- Certificates and achievements
- Multi-language interface

### 2. Instructor

Content creator and course manager with access to:
- Course creation and management
- Curriculum builder with multiple lesson types
- Student management and grading
- Real-time messaging with students
- Analytics and performance insights
- Revenue tracking and payouts
- Team collaboration

### 3. Employer

Talent acquisition role with access to:
- Talent pool browsing
- Job posting and management
- Candidate tracking
- Skill-verified hiring

### 4. Enterprise (B2B)

Organization-level access with:
- Bulk user management
- Custom branding
- SSO integration
- Dedicated analytics
- Priority support

### 5. Super Admin

Platform administrator with full CRUD access:
- User management (create, view, edit, delete, suspend, bulk actions)
- Course management (approve, reject, feature, suspend)
- Content moderation
- Revenue & payment management
- Email template management
- Platform settings
- Security dashboard with audit logs
- System configuration

---

## Core Features

### Authentication System

- Email/Password registration and login
- Social login (Google, Apple, Facebook)
- Two-factor authentication (TOTP)
- Password reset via email
- Session management
- Role-based access control

### Course Management

**For Students:**
- Browse course catalog with advanced filters
- View course previews and curriculum
- Enroll in free or paid courses
- Track progress through lessons
- Video player with bookmarks, chapters, playback speed
- Complete quizzes and exams with timer
- Earn certificates

**For Instructors:**
- Create courses with rich content
- Build curriculum with sections/lessons
- Support for video, documents, quizzes, assignments
- Set pricing and discounts
- Manage enrollments
- View detailed analytics

### Lesson Types

| Type | Description |
|------|-------------|
| Video | YouTube, Vimeo, or custom video hosting |
| Document | Rich text or PDF content |
| Quiz | Multiple choice, true/false, short answer |
| Exam | Timed assessments with certificates |
| Assignment | Submission-based tasks with rubrics |
| Audio | Podcast-style audio lessons |
| Slideshow | Presentation-based learning |

### Payment System

**Supported Methods:**
- Mobile Money (M-Pesa, MTN MoMo, Airtel Money, Tigo Pesa, Orange Money)
- Card payments (Visa, Mastercard)
- PayPal
- Bank transfer (for enterprise)

**Currencies:**
- KES (Kenya Shilling)
- TZS (Tanzania Shilling)
- UGX (Uganda Shilling)
- GHS (Ghana Cedi)
- NGN (Nigerian Naira)
- ZAR (South African Rand)
- EGP (Egyptian Pound)
- USD (US Dollar)

### Messaging System

Real-time chat between students and instructors:
- Direct messages
- Course-specific conversations
- File attachments (images, documents)
- Message reactions
- Read receipts
- Typing indicators
- Message editing and deletion
- Conversation pinning, muting, archiving
- Floating chat widget on all pages

---

## Advanced Features

### AI Learning Assistant

An intelligent chatbot that provides:
- Context-aware answers based on current lesson
- Quiz generation from course content
- Lecture summarization
- Concept explanations
- Study recommendations

### Video Player

Custom video player with:
- Progress tracking (auto-save)
- Playback speed control (0.5x - 2x)
- Keyboard shortcuts
- Picture-in-picture
- Bookmarks
- Chapter markers
- Subtitles support
- Quality selection

### Quiz/Assessment Engine

Complete quiz system supporting:
- Single choice questions
- Multiple choice questions
- True/false questions
- Short answer questions
- Timer with auto-submit
- Question flagging
- Hints system
- Detailed results with answer review

### Global Search

Command palette (Cmd+K) style search with:
- Real-time filtering
- Search across courses, instructors, lessons
- Recent searches
- Quick actions
- Trending courses
- Keyboard navigation

### Help Center

Comprehensive support hub with:
- Searchable knowledge base
- FAQ accordion
- Video tutorials
- Contact form
- Live chat widget
- Category browsing
- Popular articles

### Skill-Based Progression

Track and verify skills with:
- Skill scores (0-100)
- Mastery levels (Novice to Expert)
- Employer-verifiable badges
- Endorsements from peers/instructors
- Visual skill trees

### Career Pipeline

Connect learners with employers:
- Job postings linked to courses
- Skill-based matching
- Internship pipelines
- Talent pool for employers
- Application tracking

### Cohort-Based Learning

Scheduled learning with:
- Fixed start/end dates
- Live sessions (video conferencing)
- Group assignments
- Peer collaboration
- Attendance tracking
- Cohort leaderboards

---

## Internationalization

### Supported Languages

| Code | Language | Native Name | Direction |
|------|----------|-------------|-----------|
| en | English | English | LTR |
| fr | French | Francais | LTR |
| sw | Swahili | Kiswahili | LTR |
| ar | Arabic | العربية | RTL |
| pt | Portuguese | Portugues | LTR |
| am | Amharic | አማርኛ | LTR |
| ha | Hausa | Hausa | LTR |
| yo | Yoruba | Yoruba | LTR |
| zu | Zulu | isiZulu | LTR |
| ig | Igbo | Igbo | LTR |
| so | Somali | Soomaali | LTR |
| rw | Kinyarwanda | Ikinyarwanda | LTR |

### Usage

```tsx
import { useLanguage } from '@/lib/language-context';

const { language, setLanguage, t, autoTranslate, direction } = useLanguage();

// Get translated text
const welcomeText = t('dashboard.welcome', 'Welcome back');

// Change language
setLanguage('sw'); // Switch to Swahili
```

### Language Selector

```tsx
import { LanguageSelector } from '@/components/shared/language-selector';

// Dropdown variant (for headers)
<LanguageSelector variant="dropdown" />

// Full variant (for settings pages)
<LanguageSelector variant="full" />
```

---

## Theming & Accessibility

### Theme Options

- **Theme Mode**: Light, Dark, System (auto)
- **Accent Colors**: Default (Emerald), Blue, Green, Orange, Purple, Red, Teal, Amber
- **Font Sizes**: Small, Default, Large, Extra Large
- **High Contrast Mode**: Enhanced visibility for low-vision users
- **Reduced Motion**: Minimize animations
- **Compact Mode**: Denser UI layout

### Usage

```tsx
import { useTheme } from '@/lib/theme-context';

const { 
  theme,           // 'light' | 'dark' | 'system'
  resolvedTheme,   // actual theme being applied
  settings,        // full settings object
  setTheme,
  updateSettings,
  resetSettings,
} = useTheme();

// Change theme
setTheme('dark');

// Update specific settings
updateSettings({ 
  accentColor: 'blue',
  fontSize: 'large',
  contrast: 'high',
});
```

### Theme Components

```tsx
import { ThemeToggle, ThemeSelector, AppearanceSettings } from '@/components/shared/theme-toggle';

// Simple toggle button
<ThemeToggle />

// Card-style selector for settings pages
<ThemeSelector />

// Full appearance settings panel
<AppearanceSettings />
```

---

## API Reference

### Context Providers

#### LMSProvider

Main state management for courses, enrollments, and users.

```tsx
import { useLMS } from '@/lib/lms-context';

const {
  courses,
  enrollments,
  currentUser,
  enrollInCourse,
  updateProgress,
  completeCourse,
} = useLMS();
```

#### AuthProvider

Authentication state and methods.

```tsx
import { useAuth } from '@/lib/auth-context';

const {
  user,
  isAuthenticated,
  isLoading,
  login,
  logout,
  signup,
  resetPassword,
} = useAuth();
```

#### ChatProvider

Messaging functionality.

```tsx
import { useChat } from '@/lib/chat-context';

const {
  conversations,
  messages,
  unreadCount,
  sendMessage,
  createConversation,
  markAsRead,
  deleteMessage,
} = useChat();
```

#### LanguageProvider

Internationalization.

```tsx
import { useLanguage } from '@/lib/language-context';

const {
  language,
  setLanguage,
  t,                    // translation function
  autoTranslate,
  direction,            // 'ltr' | 'rtl'
  languageInfo,
} = useLanguage();
```

#### ThemeProvider

Theme and appearance management.

```tsx
import { useTheme } from '@/lib/theme-context';

const {
  theme,
  resolvedTheme,
  settings,
  setTheme,
  toggleTheme,
  updateSettings,
  resetSettings,
} = useTheme();
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow the existing component patterns
- Use Tailwind CSS for styling
- Write mobile-first responsive code
- Add proper TypeScript types
- Support RTL languages where applicable

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For support, please contact:
- Email: support@afrilearn.com
- Documentation: https://docs.afrilearn.com
- Community: https://community.afrilearn.com
#   S I M S  
 