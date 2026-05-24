# AfriLearn LMS - Feature Documentation

Comprehensive guide to all features available in the AfriLearn Learning Management System.

---

## Table of Contents

1. [Student Features](#student-features)
2. [Instructor Features](#instructor-features)
3. [Admin Features](#admin-features)
4. [Employer Features](#employer-features)
5. [Enterprise Features](#enterprise-features)
6. [Shared Features](#shared-features)
7. [Internationalization](#internationalization)
8. [Theming & Accessibility](#theming--accessibility)

---

## Student Features

### Dashboard (`/dashboard`)

The student dashboard provides an overview of learning activities:

| Component | Description |
|-----------|-------------|
| Progress Overview | Visual representation of overall learning progress |
| Continue Learning | Quick access to last accessed course |
| Upcoming Deadlines | Assignments and exams due soon |
| Learning Streak | Daily engagement tracking |
| Recommended Courses | AI-powered course suggestions |
| Recent Achievements | Latest badges and certificates |

### Course Catalog (`/courses`)

Browse and discover courses:

- **Filters**: Category, level, price, rating, duration
- **Search**: Full-text search across titles and descriptions
- **Sorting**: By popularity, rating, newest, price
- **Preview**: View curriculum before enrollment
- **Reviews**: Read student reviews and ratings

### Course Detail (`/courses/[slug]`)

Detailed course information page:

- Course overview and description
- Complete curriculum with lesson previews
- Instructor profile and credentials
- Student reviews and ratings
- Personal/Teams purchase toggle
- Premium badge for subscription courses
- Related courses
- Enrollment options (one-time, subscription)

### My Learning (`/my-learning`)

Track enrolled courses:

| Tab | Content |
|-----|---------|
| In Progress | Active enrollments with progress bars |
| Completed | Finished courses with certificates |
| Saved | Bookmarked courses for later |
| Archived | Hidden courses |

### Course Player (`/learn/[slug]`)

Full learning experience:

**Video Player Features:**
- Progress tracking (auto-save)
- Playback speed control (0.5x - 2x)
- Quality selection
- Full-screen mode
- Picture-in-picture
- Keyboard shortcuts (Space, Left/Right arrows, M, F)
- Video bookmarks with notes
- Chapter markers
- Subtitles support

**Learning Tools:**
- Note-taking with timestamps
- Q&A section
- Course announcements
- Downloadable materials
- Transcript (when available)

**Progress Tracking:**
- Auto-save progress every 10 seconds
- Lesson completion marking
- Section progress indicators
- Overall course progress

### Messages (`/messages`)

Real-time chat with instructors:

**Features:**
- Conversation list with tabs (All, Direct, Course, Archived)
- Full chat interface with message bubbles
- Message status indicators (sent, delivered, read)
- Message editing and deletion
- Reply to messages with quote preview
- Emoji reactions
- File attachments
- New conversation creation with user search
- Pin, mute, archive conversations
- Mobile-responsive design

### Skills & Badges (`/skills`)

Track skill development:

**Skill Dashboard:**
- Overall skill score
- Individual skill levels
- Progress over time
- Comparison with peers

**Skill Tree:**
- Visual skill progression
- Prerequisites display
- Unlock conditions
- XP requirements

**Badges:**
| Level | Requirement |
|-------|-------------|
| Bronze | Score 50+ |
| Silver | Score 70+ |
| Gold | Score 85+ |
| Platinum | Score 95+ |
| Mastery | Score 100 + endorsements |

### Career Pipeline (`/careers`)

Job opportunities and career tools:

**Job Board:**
- Jobs matched to your skills
- Filter by location, type, salary
- Application tracking
- Saved jobs

**Profile:**
- Professional profile
- Skill showcase
- Portfolio links
- Availability status

### Global Search (`/search`)

Platform-wide search with filters:

**Command Palette (Cmd+K):**
- Real-time filtering
- Search across courses, instructors, lessons
- Recent searches history
- Quick actions
- Trending courses
- Keyboard navigation

**Search Results Page:**
- Advanced filters (category, level, price range, rating)
- Sort options
- Grid/list view toggle
- Responsive filter sidebar

### Help Center (`/help`)

Comprehensive support hub:

- Searchable knowledge base
- FAQ accordion with common questions
- Video tutorials
- Contact form
- Live chat widget
- Category browsing
- Popular articles
- Multiple contact options (email, phone, chat)

### Subscription (`/subscription`)

Subscription management:

**Page Features:**
- Hero section with platform stats
- Trust badges with partner logos
- Feature comparison (Personal vs Individual)
- Featured courses carousel
- Pricing comparison
- Mobile money payment badges
- FAQ section

**Checkout (`/subscription/checkout`):**
- Billing address form
- Country-specific payment methods
- Mobile money options (M-Pesa, Airtel, MTN)
- Card payment option
- Plan selection with savings badges
- Coupon code support

**Tiers:**
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic courses, community |
| Basic | $9.99/mo | All courses, certificates |
| Pro | $29.99/mo | + Career tools, labs, cohorts |
| Career Track | $99.99/mo | + 1:1 mentorship, job placement |

### Onboarding (`/onboarding`)

New user welcome flow:

**Steps:**
1. Welcome & profile setup
2. Interest selection
3. Skill assessment
4. Goal setting
5. Course recommendations
6. Tour completion

### Settings (`/settings`)

Account management:

| Section | Options |
|---------|---------|
| Profile | Name, avatar, bio, social links |
| Notifications | Email, push, in-app preferences |
| Privacy | Profile visibility, data sharing |
| Appearance | Theme, accent color, font size |
| Language | Interface language, auto-translate |
| Accessibility | High contrast, reduce motion, compact mode |
| Security | Password, 2FA, sessions |
| Billing | Payment methods, invoices |
| Data | Download data, delete account |

---

## Instructor Features

### Dashboard (`/instructor`)

Instructor overview:

- Total students
- Revenue summary
- Course performance
- Recent reviews
- Pending tasks
- Quick actions

### Course Management (`/instructor/courses`)

Create and manage courses:

**Course Creation:**
1. Basic info (title, description, category)
2. Curriculum builder
3. Pricing and promotions
4. Publishing settings

**Lesson Types:**
- Video upload/embed
- Rich text documents
- Quizzes (multiple types)
- Assignments with rubrics
- Exams with time limits
- Audio lessons
- Slideshows

### Messages (`/instructor/messages`)

Enhanced messaging for instructors:

**Features:**
- "Waiting for Reply" indicator
- Broadcast messaging to all students in a course
- Quick stats dashboard
- Filter by all/unread/waiting
- Student profile view from chat
- Export chat functionality
- Starred conversations
- Bulk actions

### Students (`/instructor/students`)

Student management:

- Enrollment list
- Progress tracking
- Grade management
- Messaging
- Bulk actions
- Export data

### Analytics (`/instructor/analytics`)

Performance insights:

**Metrics:**
- Enrollment trends
- Completion rates
- Revenue analytics
- Student engagement
- Quiz performance
- Video watch time

### Advanced Analytics (`/instructor/advanced-analytics`)

Deep insights:

- Drop-off analysis
- Engagement heatmaps
- Revenue by country
- At-risk students
- AI recommendations

### Revenue (`/instructor/revenue`)

Earnings management:

- Revenue overview
- Transaction history
- Payout settings
- Tax documents
- Refund management

### Team (`/instructor/team`)

Collaboration:

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Co-Instructor | Course management |
| Teaching Assistant | Student support |
| Content Editor | Content only |
| Analyst | View analytics |

---

## Admin Features

### Dashboard (`/admin`)

Platform overview with key metrics:

- Total users (by role)
- Total courses
- Total revenue
- Active enrollments
- Daily/monthly trends
- Recent activity feed

### User Management (`/admin/users`)

Full CRUD operations:

**Features:**
- User listing with pagination
- Multi-filter support (role, status, country)
- Create new users with welcome email
- Edit user details
- View user profile with activity stats
- Bulk actions (activate, suspend, verify, delete)
- Individual actions (reset password, send email)
- Stats cards showing user breakdown

### Course Management (`/admin/courses`)

Course moderation:

**Features:**
- Course listing with filtering
- Tabs: All, Pending Review, Published, Suspended, Reported, Featured
- Approve/reject submitted courses
- Suspend/unsuspend published courses
- Toggle featured status
- View course details (revenue, students, rating)
- Bulk actions
- Delete with confirmation

### Analytics (`/admin/analytics`)

Platform-wide analytics:

**Reports:**
- User growth trends
- Course enrollment analytics
- Revenue breakdown
- Geographic distribution
- Engagement metrics
- Custom date ranges
- Export functionality

### Revenue (`/admin/revenue`)

Financial overview:

**Features:**
- Revenue charts (monthly trends, daily)
- Payment method distribution
- Transaction management
- Instructor payout management
- Process/retry payouts
- Stats cards

### Payments (`/admin/payments`)

Detailed payment management:

- Transaction history
- Payment method statistics
- Refund management
- Dispute handling
- Payout scheduling
- Currency management

### Content (`/admin/content`)

Content management system:

- Blog posts
- Help articles
- Announcements
- Banner management
- Static pages
- Media library

### Messages (`/admin/messages`)

Support ticket system:

- User inquiries
- Priority levels
- Assignment to team
- Response templates
- Resolution tracking

### Emails (`/admin/emails`)

Email template management:

**Templates:**
- Welcome email
- Password reset
- Course enrollment
- Certificate issued
- Payment confirmation
- Promotional emails

**Features:**
- Visual template editor
- Variable placeholders
- Preview and test
- Scheduling

### Settings (`/admin/settings`)

Platform configuration:

- General settings (name, tagline, support email)
- Email settings (SMTP configuration)
- Payment settings (provider configuration, commission)
- Course settings (approval requirements, content limits)
- Notification settings

### Security (`/admin/security`)

Security dashboard:

**Features:**
- Security score indicator
- Audit log with filtering
- Active sessions management
- Blocked IPs management
- Security settings (2FA, password policies)
- Rate limiting configuration

---

## Employer Features

### Dashboard (`/employer`)

Talent acquisition hub:

- Job postings count
- Total applicants
- Hired candidates
- Talent pool size

### Job Postings

Create and manage jobs:

- Job details
- Required skills
- Linked courses
- Application management
- Candidate tracking

### Talent Pool

Browse candidates:

- Skill-based search
- Course completions
- Certifications
- Contact candidates
- Save to lists

---

## Enterprise Features

### Landing Page (`/enterprise`)

Enterprise marketing page:

- Hero with Africa focus
- Feature highlights
- Multilingual support (25+ African languages)
- Offline learning capabilities
- Mobile money integration
- Customer logos
- Pricing overview
- Contact CTA

### Registration (`/enterprise/enroll`)

Multi-step onboarding:

1. Organization details
2. Contact information
3. Learning needs assessment
4. Deployment preferences
5. Plan selection

### Features

| Feature | Description |
|---------|-------------|
| Bulk enrollment | Add users via CSV |
| Custom branding | Logo, colors |
| SSO integration | SAML, OAuth |
| Custom courses | Private content |
| Dedicated support | Priority assistance |
| API access | Integration tools |
| Regional data centers | Africa-based servers |
| Offline sync | Learn without internet |

---

## Shared Features

### Pricing Page (`/pricing`)

Comprehensive pricing page:

- Four tiers (Free, Pro, Enterprise, Team)
- Feature comparison table
- FAQ section
- African currency options
- Mobile money badges
- Enterprise contact CTA

### Demo Mode (`/demo`)

Investor demonstration:

- Guided platform tour
- Feature showcase cards
- Quick navigation to all dashboards
- Demo banner on all pages
- No signup required

### Authentication

**Login Methods:**
- Email/password
- Google OAuth
- Apple OAuth
- Facebook OAuth

**Security:**
- Two-factor authentication
- Session management
- Password policies
- Account recovery

### Notifications

**Channels:**
- In-app notifications
- Email notifications
- Push notifications

**Types:**
- Course updates
- New lessons
- Deadlines
- Achievements
- Messages
- System alerts

### Certificate Verification (`/verify/[code]`)

Public verification:

- Certificate details
- Issuer information
- Skills validated
- QR code
- Verification status

### Accessibility

**Compliance:**
- WCAG 2.1 AA
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus indicators
- RTL language support

---

## Internationalization

### Supported Languages

| Code | Language | Native Name | Countries |
|------|----------|-------------|-----------|
| en | English | English | Nigeria, Kenya, Ghana, South Africa |
| fr | French | Francais | Senegal, Ivory Coast, Cameroon |
| sw | Swahili | Kiswahili | Kenya, Tanzania, Uganda |
| ar | Arabic | العربية | Egypt, Morocco, Algeria |
| pt | Portuguese | Portugues | Mozambique, Angola |
| am | Amharic | አማርኛ | Ethiopia |
| ha | Hausa | Hausa | Nigeria, Niger |
| yo | Yoruba | Yoruba | Nigeria, Benin |
| zu | Zulu | isiZulu | South Africa |
| ig | Igbo | Igbo | Nigeria |
| so | Somali | Soomaali | Somalia, Djibouti |
| rw | Kinyarwanda | Ikinyarwanda | Rwanda |

### Features

- Interface translation for all UI elements
- RTL support for Arabic
- Auto-translate toggle for content
- Language persists across sessions
- Country flag indicators

### Usage

```tsx
import { useLanguage, LanguageSelector } from '@/lib/language-context';

// In components
const { t, language, setLanguage } = useLanguage();
const welcomeText = t('dashboard.welcome'); // "Welcome back" or translated

// Language selector component
<LanguageSelector variant="dropdown" />
```

---

## Theming & Accessibility

### Theme Modes

- Light mode
- Dark mode
- System preference (auto)

### Accent Colors

| Color | Name | Preview |
|-------|------|---------|
| default | Emerald | #10b981 |
| blue | Blue | #3b82f6 |
| green | Forest Green | #22c55e |
| orange | Orange | #f97316 |
| purple | Purple | #8b5cf6 |
| red | Red | #ef4444 |
| teal | Teal | #14b8a6 |
| amber | Amber | #f59e0b |

### Font Sizes

| Size | Scale | Use Case |
|------|-------|----------|
| Small | 0.875x | Compact displays |
| Default | 1x | Standard usage |
| Large | 1.125x | Better readability |
| Extra Large | 1.25x | Low vision users |

### Accessibility Options

- **High Contrast**: Increased color contrast
- **Reduced Motion**: Minimized animations
- **Compact Mode**: Denser UI spacing

### Usage

```tsx
import { useTheme, AppearanceSettings } from '@/lib/theme-context';

// Access theme settings
const { theme, settings, updateSettings } = useTheme();

// Update settings
updateSettings({ 
  accentColor: 'blue',
  fontSize: 'large',
  contrast: 'high',
});

// Full settings panel
<AppearanceSettings />
```

---

## Feature Roadmap

### Completed

- [x] Mobile-first responsive design
- [x] Multi-language support (12 languages)
- [x] Advanced theming with accent colors
- [x] Real-time messaging system
- [x] Video player with bookmarks
- [x] Quiz engine with timer
- [x] Global search with filters
- [x] Help center with FAQ
- [x] Admin CRUD for all entities
- [x] Enterprise landing and enrollment
- [x] Demo mode for investors
- [x] Accessibility features

### Coming Soon

- [ ] Mobile apps (iOS/Android)
- [ ] Live streaming
- [ ] AI-generated quizzes
- [ ] Peer review system
- [ ] Advanced proctoring
- [ ] Integration marketplace
- [ ] Offline PWA mode
- [ ] Push notifications

### Under Consideration

- [ ] VR/AR learning
- [ ] Blockchain credentials
- [ ] Social learning feed
- [ ] Gamification v2
- [ ] White-label solution
