import { Course, User, InstitutionUser } from './types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const sampleUsers: User[] = [
  {
    id: 'instructor-1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'student-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    createdAt: new Date('2023-06-20'),
  },
];

export const sampleCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Complete Web Development Bootcamp',
    slug: 'complete-web-development-bootcamp',
    description: `Learn web development from scratch! This comprehensive course covers everything you need to know to become a full-stack web developer.

You'll start with the fundamentals of HTML, CSS, and JavaScript, then progress to more advanced topics like React, Node.js, and databases. By the end of this course, you'll be able to build complete web applications from scratch.

This course includes:
- 50+ hours of video content
- Real-world projects
- Downloadable resources
- Certificate of completion`,
    shortDescription: 'Master web development with HTML, CSS, JavaScript, React, Node.js, and more. Build real projects and launch your career.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    instructorId: 'instructor-1',
    instructorName: 'John Smith',
    price: 99.99,
    discountPrice: 49.99,
    status: 'published',
    category: 'Development',
    level: 'beginner',
    language: 'English',
    duration: 3000,
    totalLessons: 150,
    totalStudents: 12500,
    rating: 4.8,
    reviewsCount: 2340,
    requirements: [
      'No programming experience required',
      'A computer with internet access',
      'Desire to learn and build things',
    ],
    objectives: [
      'Build responsive websites using HTML and CSS',
      'Master JavaScript programming',
      'Create React applications',
      'Build backend services with Node.js',
      'Work with databases like MongoDB and PostgreSQL',
      'Deploy applications to the cloud',
    ],
    tags: ['web development', 'javascript', 'react', 'node.js', 'html', 'css'],
    sections: [
      {
        id: 'section-1',
        courseId: 'course-1',
        title: 'Introduction to Web Development',
        description: 'Get started with the basics of web development',
        order: 0,
        lessons: [
          {
            id: 'lesson-1-1',
            sectionId: 'section-1',
            title: 'Welcome to the Course',
            description: 'An overview of what you will learn in this course',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              videoProvider: 'youtube',
            },
            duration: 10,
            order: 0,
            isFree: true,
            materials: [
              {
                id: 'material-1',
                lessonId: 'lesson-1-1',
                title: 'Course Overview PDF',
                type: 'pdf',
                url: '/materials/course-overview.pdf',
                downloadable: true,
              },
            ],
          },
          {
            id: 'lesson-1-2',
            sectionId: 'section-1',
            title: 'How the Internet Works',
            description: 'Understanding the basics of the internet and web browsers',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/7_LPdttKXPc',
              videoProvider: 'youtube',
            },
            duration: 15,
            order: 1,
            isFree: true,
            materials: [],
          },
          {
            id: 'lesson-1-2a',
            sectionId: 'section-1',
            title: 'Web Development Podcast Episode',
            description: 'Listen to industry experts discuss web development trends',
            type: 'audio',
            content: {
              audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              audioTitle: 'Web Dev Trends 2024',
              audioTranscript: 'Welcome to the Web Development podcast. Today we are discussing the latest trends in web development including React Server Components, AI integration, and more...',
            },
            duration: 30,
            order: 2,
            isFree: false,
            materials: [],
          },
          {
            id: 'lesson-1-2b',
            sectionId: 'section-1',
            title: 'Web Development Overview Slides',
            description: 'Visual overview of the web development ecosystem',
            type: 'slideshow',
            content: {
              slides: [
                { id: 'slide-1', imageUrl: 'https://picsum.photos/800/450?random=1', title: 'Introduction to Web Development', description: 'Learn the fundamentals of building websites', order: 0 },
                { id: 'slide-2', imageUrl: 'https://picsum.photos/800/450?random=2', title: 'Frontend Technologies', description: 'HTML, CSS, and JavaScript', order: 1 },
                { id: 'slide-3', imageUrl: 'https://picsum.photos/800/450?random=3', title: 'Backend Technologies', description: 'Node.js, Python, and databases', order: 2 },
                { id: 'slide-4', imageUrl: 'https://picsum.photos/800/450?random=4', title: 'Full Stack Development', description: 'Combining frontend and backend', order: 3 },
                { id: 'slide-5', imageUrl: 'https://picsum.photos/800/450?random=5', title: 'Deployment & DevOps', description: 'Getting your app to production', order: 4 },
              ],
              autoPlay: false,
              slideDuration: 5,
            },
            duration: 15,
            order: 3,
            isFree: true,
            materials: [
              {
                id: 'material-slides-1',
                lessonId: 'lesson-1-2b',
                title: 'Slides Source Files',
                type: 'zip',
                url: '/materials/slides.zip',
                downloadable: true,
                zipContents: [
                  { id: 'z1', name: 'README.md', path: '/README.md', type: 'file', size: 1024, mimeType: 'text/markdown', content: '# Web Development Slides\n\nThese are the source files for the presentation.' },
                  { id: 'z2', name: 'images', path: '/images', type: 'folder', size: 0, children: [
                    { id: 'z3', name: 'slide1.png', path: '/images/slide1.png', type: 'file', size: 24576, mimeType: 'image/png', previewUrl: 'https://picsum.photos/200/150?random=1' },
                  ]},
                ],
              },
            ],
          },
          {
            id: 'lesson-1-3',
            sectionId: 'section-1',
            title: 'Setting Up Your Development Environment',
            description: 'Install the tools you need to start coding',
            type: 'document',
            content: {
              documentContent: `# Setting Up Your Development Environment

## Required Software

### 1. Code Editor - Visual Studio Code
Download from: https://code.visualstudio.com/

VS Code is a free, powerful code editor that works on Windows, Mac, and Linux.

### 2. Web Browser - Google Chrome
Download from: https://www.google.com/chrome/

We'll use Chrome's Developer Tools throughout this course.

### 3. Node.js
Download from: https://nodejs.org/

Choose the LTS (Long Term Support) version for stability.

## Recommended VS Code Extensions

- **Live Server** - Launch a local development server
- **Prettier** - Code formatter
- **ESLint** - JavaScript linting
- **Auto Rename Tag** - Automatically rename paired HTML tags

## Verifying Your Installation

Open your terminal and run:
\`\`\`bash
node --version
npm --version
\`\`\`

You should see version numbers for both commands.`,
            },
            duration: 20,
            order: 2,
            isFree: false,
            materials: [
              {
                id: 'material-2',
                lessonId: 'lesson-1-3',
                title: 'VS Code Cheat Sheet',
                type: 'pdf',
                url: '/materials/vscode-cheatsheet.pdf',
                downloadable: true,
              },
            ],
          },
        ],
      },
      {
        id: 'section-2',
        courseId: 'course-1',
        title: 'HTML Fundamentals',
        description: 'Learn the building blocks of web pages',
        order: 1,
        lessons: [
          {
            id: 'lesson-2-1',
            sectionId: 'section-2',
            title: 'Your First HTML Page',
            description: 'Create your very first web page',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
              videoProvider: 'youtube',
            },
            duration: 25,
            order: 0,
            isFree: false,
            materials: [
              {
                id: 'material-3',
                lessonId: 'lesson-2-1',
                title: 'HTML Basics Starter Files',
                type: 'file',
                url: '/materials/html-basics-starter.zip',
                downloadable: true,
              },
            ],
          },
          {
            id: 'lesson-2-2',
            sectionId: 'section-2',
            title: 'HTML Elements and Attributes',
            description: 'Understanding HTML elements, attributes, and their usage',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/PlxWf493en4',
              videoProvider: 'youtube',
            },
            duration: 30,
            order: 1,
            isFree: false,
            materials: [],
          },
          {
            id: 'lesson-2-3',
            sectionId: 'section-2',
            title: 'HTML Quiz',
            description: 'Test your knowledge of HTML basics',
            type: 'quiz',
            content: {
              quizQuestions: [
                {
                  id: 'q1',
                  type: 'multiple_choice',
                  question: 'What does HTML stand for?',
                  options: [
                    'Hyper Text Markup Language',
                    'High Tech Modern Language',
                    'Hyper Transfer Markup Language',
                    'Home Tool Markup Language',
                  ],
                  correctAnswer: 0,
                  points: 10,
                  explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
                },
                {
                  id: 'q2',
                  type: 'multiple_choice',
                  question: 'Which tag is used for the largest heading in HTML?',
                  options: ['<heading>', '<h6>', '<h1>', '<head>'],
                  correctAnswer: 2,
                  points: 10,
                  explanation: '<h1> defines the most important heading. HTML headings range from <h1> to <h6>.',
                },
                {
                  id: 'q3',
                  type: 'multiple_choice',
                  question: 'Which attribute is used to provide a unique identifier for an HTML element?',
                  options: ['class', 'name', 'id', 'style'],
                  correctAnswer: 2,
                  points: 10,
                  explanation: 'The id attribute specifies a unique id for an HTML element. The value must be unique within the HTML document.',
                },
              ],
            },
            duration: 10,
            order: 2,
            isFree: false,
            materials: [],
          },
          {
            id: 'lesson-2-4',
            sectionId: 'section-2',
            title: 'HTML Module Exam',
            description: 'Comprehensive exam covering all HTML fundamentals. Score 100% to earn a certificate!',
            type: 'exam',
            content: {
              assessmentConfig: {
                type: 'exam',
                title: 'HTML Fundamentals Certification Exam',
                description: 'This exam tests your knowledge of HTML fundamentals. You need to score at least 70% to pass. Score 100% to earn an excellent certificate!',
                timeLimit: 30,
                passingScore: 70,
                maxAttempts: 3,
                shuffleQuestions: true,
                shuffleOptions: false,
                showResults: 'after_submission',
                allowReview: true,
                certificateOnPass: true,
              },
              quizQuestions: [
                {
                  id: 'exam-q1',
                  type: 'multiple_choice',
                  question: 'What is the correct HTML element for inserting a line break?',
                  options: ['<break>', '<lb>', '<br>', '<newline>'],
                  correctAnswer: 2,
                  points: 10,
                  explanation: 'The <br> tag inserts a single line break. It is an empty tag which means it has no end tag.',
                },
                {
                  id: 'exam-q2',
                  type: 'multiple_choice',
                  question: 'Which HTML element defines the title of a document?',
                  options: ['<meta>', '<head>', '<title>', '<header>'],
                  correctAnswer: 2,
                  points: 10,
                  explanation: 'The <title> element defines the title of the document, shown in the browser tab.',
                },
                {
                  id: 'exam-q3',
                  type: 'true_false',
                  question: 'HTML tags are case-sensitive.',
                  options: ['True', 'False'],
                  correctAnswer: 1,
                  points: 10,
                  explanation: 'HTML tags are NOT case-sensitive. <P> means the same as <p>.',
                },
                {
                  id: 'exam-q4',
                  type: 'multiple_choice',
                  question: 'Which attribute is used to specify where to open a linked document?',
                  options: ['href', 'target', 'src', 'link'],
                  correctAnswer: 1,
                  points: 10,
                  explanation: 'The target attribute specifies where to open the linked document.',
                },
                {
                  id: 'exam-q5',
                  type: 'multiple_choice',
                  question: 'What is the correct HTML for creating a hyperlink?',
                  options: [
                    '<a href="url">link text</a>',
                    '<a name="url">link text</a>',
                    '<a url="url">link text</a>',
                    '<link href="url">link text</link>',
                  ],
                  correctAnswer: 0,
                  points: 10,
                  explanation: 'The correct syntax for creating a hyperlink is using the <a> tag with href attribute.',
                },
              ],
            },
            duration: 30,
            order: 3,
            isFree: false,
            materials: [],
          },
        ],
      },
      {
        id: 'section-3',
        courseId: 'course-1',
        title: 'CSS Styling',
        description: 'Make your websites beautiful with CSS',
        order: 2,
        lessons: [
          {
            id: 'lesson-3-1',
            sectionId: 'section-3',
            title: 'Introduction to CSS',
            description: 'Learn how CSS works and how to style your HTML',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/yfoY53QXEnI',
              videoProvider: 'youtube',
            },
            duration: 20,
            order: 0,
            isFree: false,
            materials: [],
          },
        ],
      },
    ],
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'course-2',
    title: 'Python for Data Science',
    slug: 'python-for-data-science',
    description: `Master Python programming and become a data scientist! This course teaches you Python from the basics to advanced data analysis techniques.

You'll learn how to use Python libraries like NumPy, Pandas, and Matplotlib to analyze and visualize data. By the end of this course, you'll be able to work with real-world datasets and extract meaningful insights.`,
    shortDescription: 'Learn Python programming and data analysis with NumPy, Pandas, and Matplotlib. Perfect for aspiring data scientists.',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop',
    instructorId: 'instructor-1',
    instructorName: 'John Smith',
    price: 89.99,
    discountPrice: 39.99,
    status: 'published',
    category: 'Development',
    level: 'intermediate',
    language: 'English',
    duration: 2400,
    totalLessons: 120,
    totalStudents: 8500,
    rating: 4.7,
    reviewsCount: 1560,
    requirements: [
      'Basic computer skills',
      'No prior programming experience required',
      'Willingness to practice',
    ],
    objectives: [
      'Master Python fundamentals',
      'Work with NumPy arrays',
      'Analyze data with Pandas',
      'Create visualizations with Matplotlib',
      'Build data science projects',
    ],
    tags: ['python', 'data science', 'pandas', 'numpy', 'matplotlib'],
    sections: [
      {
        id: 'py-section-1',
        courseId: 'course-2',
        title: 'Python Basics',
        description: 'Learn the fundamentals of Python programming',
        order: 0,
        lessons: [
          {
            id: 'py-lesson-1',
            sectionId: 'py-section-1',
            title: 'Introduction to Python',
            description: 'Get started with Python programming',
            type: 'video',
            content: {
              videoUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8',
              videoProvider: 'youtube',
            },
            duration: 15,
            order: 0,
            isFree: true,
            materials: [],
          },
        ],
      },
    ],
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'course-3',
    title: 'UI/UX Design Masterclass',
    slug: 'ui-ux-design-masterclass',
    description: `Become a professional UI/UX designer! Learn design principles, user research, wireframing, prototyping, and how to use industry-standard tools like Figma.

This course covers the complete design process from concept to final delivery.`,
    shortDescription: 'Master UI/UX design with Figma. Learn design principles, wireframing, prototyping, and create stunning user interfaces.',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
    instructorId: 'instructor-1',
    instructorName: 'John Smith',
    price: 79.99,
    status: 'published',
    category: 'Design',
    level: 'beginner',
    language: 'English',
    duration: 1800,
    totalLessons: 85,
    totalStudents: 5200,
    rating: 4.9,
    reviewsCount: 890,
    requirements: ['No design experience required', 'Access to Figma (free)'],
    objectives: [
      'Understand UI/UX design principles',
      'Master Figma for design',
      'Create wireframes and prototypes',
      'Conduct user research',
      'Build a professional portfolio',
    ],
    tags: ['design', 'ui', 'ux', 'figma', 'wireframing'],
    sections: [],
    createdAt: new Date('2023-07-10'),
    updatedAt: new Date('2024-01-25'),
  },
];

// Sample team members for the instructor
export const sampleInstitutionUsers: InstitutionUser[] = [
  {
    id: 'team-user-1',
    institutionId: 'instructor-1',
    name: 'Emily Chen',
    email: 'emily.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    role: 'co_instructor',
    status: 'active',
    permissions: ['courses.create', 'courses.edit', 'courses.publish', 'students.view', 'students.message', 'analytics.view'],
    assignedCourseIds: ['course-1'],
    department: 'Computer Science',
    jobTitle: 'Senior Instructor',
    phone: '+1 555-123-4567',
    bio: 'Experienced web developer and educator with 8+ years of teaching experience.',
    joinedAt: new Date('2023-06-15'),
    lastActiveAt: new Date('2024-03-18'),
    invitedBy: 'instructor-1',
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-03-18'),
  },
  {
    id: 'team-user-2',
    institutionId: 'instructor-1',
    name: 'Marcus Johnson',
    email: 'marcus.j@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    role: 'teaching_assistant',
    status: 'active',
    permissions: ['courses.edit', 'students.view', 'students.message'],
    assignedCourseIds: ['course-1', 'course-2'],
    department: 'Computer Science',
    jobTitle: 'Teaching Assistant',
    joinedAt: new Date('2023-09-01'),
    lastActiveAt: new Date('2024-03-17'),
    invitedBy: 'instructor-1',
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-03-17'),
  },
  {
    id: 'team-user-3',
    institutionId: 'instructor-1',
    name: 'Sophie Martinez',
    email: 'sophie.m@example.com',
    role: 'content_editor',
    status: 'active',
    permissions: ['courses.create', 'courses.edit'],
    assignedCourseIds: [],
    department: 'Content Team',
    jobTitle: 'Content Editor',
    bio: 'Passionate about creating engaging educational content.',
    joinedAt: new Date('2024-01-10'),
    lastActiveAt: new Date('2024-03-16'),
    invitedBy: 'instructor-1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-16'),
  },
  {
    id: 'team-user-4',
    institutionId: 'instructor-1',
    name: 'David Kim',
    email: 'david.kim@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    role: 'analyst',
    status: 'pending',
    permissions: ['analytics.view', 'analytics.export', 'students.view'],
    assignedCourseIds: [],
    department: 'Analytics',
    jobTitle: 'Data Analyst',
    joinedAt: new Date('2024-03-01'),
    invitedBy: 'instructor-1',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
];

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}
