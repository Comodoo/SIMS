# Contributing to AfriLearn LMS

Thank you for your interest in contributing to AfriLearn LMS! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guide](#code-style-guide)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Public or private attacks
- Publishing private information without consent

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Git
- VS Code (recommended)

### Setup

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/afrilearn-lms.git
cd afrilearn-lms

# Add upstream remote
git remote add upstream https://github.com/afrilearn/afrilearn-lms.git

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- GitLens

---

## Development Workflow

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow existing patterns
- Add comments for complex logic
- Update types as needed

### 3. Test Your Changes

```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests (when available)
pnpm test

# Build to check for errors
pnpm build
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Code Style Guide

### TypeScript

```typescript
// Use explicit types
interface CourseCardProps {
  course: Course;
  onEnroll?: (id: string) => void;
}

// Use const for functions
const handleClick = () => {
  // ...
};

// Prefer destructuring
const { title, price } = course;

// Use optional chaining
const name = user?.profile?.name ?? 'Anonymous';
```

### React Components

```tsx
// Use function components
export function CourseCard({ course, onEnroll }: CourseCardProps) {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false);
  const { enrollInCourse } = useLMS();

  // Handlers
  const handleEnroll = async () => {
    setIsLoading(true);
    await enrollInCourse(course.id);
    setIsLoading(false);
    onEnroll?.(course.id);
  };

  // Early returns for loading/error states
  if (isLoading) {
    return <Skeleton />;
  }

  // Main render
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

### Tailwind CSS

```tsx
// Use mobile-first responsive design
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">

// Use semantic class ordering
<button className="
  flex items-center justify-center    // Layout
  w-full h-10                         // Sizing
  px-4 py-2                           // Spacing
  bg-primary text-primary-foreground  // Colors
  rounded-md                          // Border
  hover:bg-primary/90                 // States
  transition-colors                   // Animations
">

// Use cn() for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "large" && "text-lg"
)}>
```

### File Naming

```
components/
  course-card.tsx      # kebab-case for files
  CourseCard           # PascalCase for components
  useCourseData.ts     # camelCase for hooks

lib/
  types.ts             # lowercase
  lms-context.tsx      # kebab-case

app/
  (student)/           # parentheses for route groups
  [slug]/              # brackets for dynamic routes
  page.tsx             # Next.js conventions
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance |

### Examples

```bash
# Feature
git commit -m "feat(courses): add course filtering by category"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(components): extract CourseCard component"
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guide
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Changes are tested manually
- [ ] Documentation updated if needed

### PR Title Format

Same as commit message:
```
feat(scope): description
fix(scope): description
```

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step 1
2. Step 2
3. Expected result

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments for complex code
- [ ] Updated documentation
- [ ] No new warnings
```

### Review Process

1. Submit PR
2. Automated checks run
3. Maintainer reviews
4. Address feedback
5. Approval and merge

---

## Testing

### Manual Testing Checklist

For UI changes:
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1280px+)
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Keyboard accessible
- [ ] Screen reader friendly

For features:
- [ ] Happy path works
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Edge cases covered

### Writing Tests (Future)

```typescript
// Component tests
import { render, screen } from '@testing-library/react';
import { CourseCard } from './course-card';

describe('CourseCard', () => {
  it('renders course title', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Python Basics')).toBeInTheDocument();
  });

  it('calls onEnroll when button clicked', () => {
    const onEnroll = jest.fn();
    render(<CourseCard course={mockCourse} onEnroll={onEnroll} />);
    fireEvent.click(screen.getByText('Enroll'));
    expect(onEnroll).toHaveBeenCalledWith(mockCourse.id);
  });
});
```

---

## Documentation

### When to Update Docs

- Adding new features
- Changing APIs
- Adding new components
- Modifying configuration

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `docs/FEATURES.md` | Feature documentation |
| `docs/ARCHITECTURE.md` | Technical architecture |
| `docs/API.md` | API reference |
| `docs/DEPLOYMENT.md` | Deployment guide |

### Code Comments

```typescript
/**
 * Enrolls the current user in a course.
 * 
 * @param courseId - The ID of the course to enroll in
 * @throws {Error} If user is not authenticated
 * @example
 * ```ts
 * enrollInCourse('course-123');
 * ```
 */
const enrollInCourse = (courseId: string) => {
  // Implementation
};
```

---

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with reproduction steps
- **Features**: Open an Issue with use case description
- **Chat**: Join our Discord community

---

## Recognition

Contributors are recognized in:
- GitHub Contributors page
- Release notes
- Project documentation

Thank you for contributing to AfriLearn LMS!
