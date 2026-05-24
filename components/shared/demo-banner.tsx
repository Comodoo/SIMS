'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, ArrowRight, Info } from 'lucide-react';

export function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [demoRole, setDemoRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demoMode = localStorage.getItem('demoMode');
      const role = localStorage.getItem('demoRole');
      setIsDemo(demoMode === 'true');
      setDemoRole(role);
    }
  }, []);

  if (!isDemo || dismissed) return null;

  const handleExitDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demoMode');
      localStorage.removeItem('demoRole');
    }
    window.location.href = '/';
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
          <span className="hidden sm:inline">
            You are exploring as a <strong className="capitalize">{demoRole || 'guest'}</strong>. 
            Data will not be saved.
          </span>
          <span className="sm:hidden">
            Exploring as <strong className="capitalize">{demoRole || 'guest'}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
            asChild
          >
            <Link href="/signup">
              Create Real Account
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs hover:bg-white/20 text-white"
            onClick={handleExitDemo}
          >
            Exit Demo
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 hover:bg-white/20 text-white"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Feature tooltip component for demo mode
export function DemoFeatureTooltip({ 
  feature, 
  children 
}: { 
  feature: string; 
  children: React.ReactNode;
}) {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemo(localStorage.getItem('demoMode') === 'true');
    }
  }, []);

  if (!isDemo) return <>{children}</>;

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        <Info className="h-3 w-3 inline mr-1" />
        {feature}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </div>
    </div>
  );
}
