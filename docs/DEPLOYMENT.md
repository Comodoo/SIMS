# AfriLearn LMS - Deployment Guide

Complete guide for deploying the AfriLearn LMS to production.

---

## Deployment Options

| Platform | Best For | Complexity |
|----------|----------|------------|
| Vercel | Easiest, recommended | Low |
| Docker | Self-hosted | Medium |
| AWS | Enterprise, custom | High |
| DigitalOcean | Cost-effective | Medium |

---

## Vercel Deployment (Recommended)

### Prerequisites

- Vercel account (free tier available)
- GitHub/GitLab/Bitbucket repository
- Node.js 18+ locally

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Select the repository containing AfriLearn LMS

### Step 2: Configure Project

**Build Settings:**
```
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### Step 3: Environment Variables

Add these in Vercel Dashboard > Project > Settings > Environment Variables:

```env
# Required
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Database (when using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Payment Providers (Production)
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey

MTN_MOMO_SUBSCRIPTION_KEY=your_key
MTN_MOMO_API_USER=your_user
MTN_MOMO_API_KEY=your_api_key

# AI Features
OPENAI_API_KEY=sk-...

# Email (optional)
RESEND_API_KEY=re_...
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Access your app at the provided URL

### Step 5: Custom Domain

1. Go to Project > Settings > Domains
2. Add your domain (e.g., `app.afrilearn.com`)
3. Configure DNS records as shown
4. SSL is automatic

---

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=https://your-domain.com
    env_file:
      - .env.production
    restart: unless-stopped

  # Optional: Add database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: afrilearn
      POSTGRES_USER: afrilearn
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Optional: Add Redis for caching
  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t afrilearn-lms .

# Run container
docker run -p 3000:3000 --env-file .env.production afrilearn-lms

# Or with docker-compose
docker-compose up -d
```

---

## AWS Deployment

### Option 1: AWS Amplify

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

### Option 2: ECS + Fargate

**Task Definition:**
```json
{
  "family": "afrilearn-lms",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-ecr-repo/afrilearn-lms:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ]
    }
  ]
}
```

### Option 3: EC2 with PM2

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm and PM2
npm install -g pnpm pm2

# Clone and build
git clone https://github.com/your-org/afrilearn-lms.git
cd afrilearn-lms
pnpm install
pnpm build

# Start with PM2
pm2 start npm --name "afrilearn" -- start

# Save and setup startup
pm2 save
pm2 startup
```

---

## Database Setup

### Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection details from Settings > Database
3. Run migrations:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES users(id),
  price DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
```

### PostgreSQL (Self-hosted)

```bash
# Create database
createdb afrilearn

# Run migrations
psql afrilearn < migrations/001_initial.sql
```

---

## Payment Provider Setup

### M-Pesa (Safaricom Kenya)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create app and get credentials
3. Configure callback URLs
4. Go live after testing

**Environment Variables:**
```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=174379
MPESA_PASSKEY=xxx
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

### MTN Mobile Money

1. Register at [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
2. Create sandbox account
3. Generate API user and key
4. Apply for production access

**Environment Variables:**
```env
MTN_MOMO_ENVIRONMENT=production
MTN_MOMO_SUBSCRIPTION_KEY=xxx
MTN_MOMO_API_USER=xxx
MTN_MOMO_API_KEY=xxx
MTN_MOMO_CALLBACK_URL=https://your-domain.com/api/mtn/callback
```

---

## SSL/TLS Configuration

### Vercel
Automatic SSL - no configuration needed.

### Custom Server with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring & Logging

### Vercel Analytics

Automatic with Vercel deployment. View in dashboard.

### Custom Logging

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
```

### Error Tracking (Sentry)

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## Performance Optimization

### CDN Configuration

Vercel Edge Network is automatic. For custom:

```nginx
# Cache static assets
location /_next/static {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location /images {
    add_header Cache-Control "public, max-age=86400";
}
```

### Image Optimization

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['your-cdn.com', 'supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
};
```

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump afrilearn > /backups/afrilearn_$DATE.sql
gzip /backups/afrilearn_$DATE.sql

# Upload to S3
aws s3 cp /backups/afrilearn_$DATE.sql.gz s3://your-bucket/backups/
```

### Automated with Supabase

Automatic daily backups included. Point-in-time recovery available on Pro plan.

---

## Scaling Considerations

### Horizontal Scaling

1. Use stateless sessions (JWT)
2. External cache (Redis)
3. Load balancer (AWS ALB, Nginx)
4. Multiple container instances

### Vertical Scaling

| Users | Vercel Plan | Database |
|-------|-------------|----------|
| < 1K | Hobby | Supabase Free |
| 1K-10K | Pro | Supabase Pro |
| 10K-100K | Enterprise | Supabase Team |
| 100K+ | Enterprise | Dedicated DB |

---

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure headers
- [ ] Regular dependency updates
- [ ] Access logs enabled
- [ ] Error messages sanitized

---

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Memory Issues

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# Increase pool size if needed
```

---

## Support

For deployment support:
- Email: devops@afrilearn.com
- Docs: https://docs.afrilearn.com/deployment
- Community: https://community.afrilearn.com
