import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Home, Search, ArrowLeft, BookOpen, MessageCircle, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AfriLearn</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-[120px] md:text-[180px] font-bold text-muted-foreground/20 leading-none select-none">
              404
            </div>
            <div className="relative -mt-16 md:-mt-24">
              <div className="h-24 w-24 md:h-32 md:w-32 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sorry, we could not find the page you are looking for. It might have been moved, deleted, or never existed.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium mb-1">Courses</h3>
                <p className="text-xs text-muted-foreground mb-3">Explore our course catalog</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium mb-1">Support</h3>
                <p className="text-xs text-muted-foreground mb-3">Get help from our team</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/help">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium mb-1">FAQ</h3>
                <p className="text-xs text-muted-foreground mb-3">Find answers quickly</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/help#faq">View FAQ</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? Contact us at support@afrilearn.com</p>
        </div>
      </footer>
    </div>
  );
}
