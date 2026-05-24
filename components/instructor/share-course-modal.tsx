'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Link2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  MessageCircle,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareCourseModalProps {
  open: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    thumbnail: string;
    instructorName: string;
    rating: number;
    totalStudents: number;
  };
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      size="sm"
      variant={copied ? 'default' : 'outline'}
      className={cn('gap-2 shrink-0 transition-all', copied && 'bg-green-600 hover:bg-green-700 text-white border-green-600')}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label || (copied ? 'Copied!' : 'Copy')}
    </Button>
  );
}

export function ShareCourseModal({ open, onClose, course }: ShareCourseModalProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://learnhub.com';
  const courseUrl = `${baseUrl}/courses/${course.slug}`;
  const embedCode = `<iframe src="${courseUrl}/embed" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const shareText = `Check out this course: "${course.title}" by ${course.instructorName} on LearnHub. ${course.shortDescription}`;

  const socialLinks = [
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'bg-black hover:bg-black/80 text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(courseUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] hover:bg-[#1877F2]/90 text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#25D366]/90 text-white',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + courseUrl)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-muted hover:bg-muted/80 text-foreground border',
      url: `mailto:?subject=${encodeURIComponent('Recommended course: ' + course.title)}&body=${encodeURIComponent(shareText + '\n\n' + courseUrl)}`,
    },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Share Course
          </DialogTitle>
          <DialogDescription>
            Share this course with others and help them discover great learning content.
          </DialogDescription>
        </DialogHeader>

        {/* Course preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-14 w-20 rounded-md object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2">{course.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{course.instructorName}</p>
            <p className="text-xs text-muted-foreground">
              {course.rating > 0 ? `${course.rating.toFixed(1)} rating` : 'New course'} &middot;{' '}
              {course.totalStudents.toLocaleString()} students
            </p>
          </div>
        </div>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1 gap-1.5">
              <Link2 className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1 gap-1.5">
              <Twitter className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex-1 gap-1.5">
              <Code2 className="h-4 w-4" />
              Embed
            </TabsTrigger>
          </TabsList>

          {/* Direct Link */}
          <TabsContent value="link" className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Course URL</label>
              <div className="flex gap-2">
                <Input value={courseUrl} readOnly className="font-mono text-sm bg-muted" />
                <CopyButton text={courseUrl} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Share message</label>
              <div className="space-y-2">
                <Textarea
                  value={shareText}
                  readOnly
                  rows={3}
                  className="resize-none text-sm bg-muted"
                />
                <CopyButton text={shareText + '\n\n' + courseUrl} label="Copy with message" />
              </div>
            </div>
          </TabsContent>

          {/* Social */}
          <TabsContent value="social" className="pt-2">
            <div className="space-y-2">
              {socialLinks.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleSocialShare(platform.url)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    platform.color
                  )}
                >
                  <platform.icon className="h-5 w-5 shrink-0" />
                  Share on {platform.name}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Embed */}
          <TabsContent value="embed" className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Embed Code</label>
              <p className="text-xs text-muted-foreground mb-2">
                Copy this code to embed the course on your website or blog.
              </p>
              <div className="space-y-2">
                <Textarea
                  value={embedCode}
                  readOnly
                  rows={3}
                  className="resize-none font-mono text-xs bg-muted"
                />
                <CopyButton text={embedCode} label="Copy embed code" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted border text-xs text-muted-foreground">
              <strong>Preview:</strong> A 640x360 iframe will be embedded with the course landing page.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
