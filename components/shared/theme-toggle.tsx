'use client';

import { Moon, Sun, Monitor, Settings2, RotateCcw, Check, Palette, Type, Eye, Sparkles, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useTheme, 
  ACCENT_COLORS, 
  FONT_SIZES, 
  type ThemeMode, 
  type AccentColor,
  type FontSize,
} from '@/lib/theme-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  size?: 'sm' | 'default';
  className?: string;
}

export function ThemeToggle({ variant = 'dropdown', size = 'default', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  // Simple toggle between light and dark
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={cn(
          size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
          'relative overflow-hidden',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        <Sun className={cn(
          'h-5 w-5 transition-all duration-300',
          resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )} />
        <Moon className={cn(
          'absolute h-5 w-5 transition-all duration-300',
          resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Dropdown with light, dark, and system options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
            'relative overflow-hidden',
            className
          )}
          aria-label="Toggle theme"
        >
          <Sun className={cn(
            'h-5 w-5 transition-all duration-300',
            resolvedTheme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          )} />
          <Moon className={cn(
            'absolute h-5 w-5 transition-all duration-300',
            resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(theme === 'light' && 'bg-accent')}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(theme === 'dark' && 'bg-accent')}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={cn(theme === 'system' && 'bg-accent')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Inline theme toggle for settings pages
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
            theme === option.value
              ? 'border-primary bg-primary/5'
              : 'border-transparent bg-muted hover:bg-muted/80'
          )}
        >
          <div className={cn(
            'p-3 rounded-full',
            theme === option.value ? 'bg-primary/10' : 'bg-background'
          )}>
            <option.icon className={cn(
              'h-5 w-5',
              theme === option.value ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <span className={cn(
            'text-sm font-medium',
            theme === option.value ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// Full appearance settings panel
export function AppearanceSettings({ className }: { className?: string }) {
  const { settings, updateSettings, resetSettings } = useTheme();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Theme Mode */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Theme Mode
        </Label>
        <ThemeSelector />
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Accent Color
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
            <button
              key={color}
              onClick={() => updateSettings({ accentColor: color })}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                settings.accentColor === color
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted hover:bg-muted/80'
              )}
            >
              <div
                className="h-8 w-8 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: ACCENT_COLORS[color].preview }}
              />
              <span className="text-xs font-medium truncate w-full text-center">
                {color === 'default' ? 'Default' : ACCENT_COLORS[color].name}
              </span>
              {settings.accentColor === color && (
                <Check className="h-3 w-3 text-primary absolute top-1 right-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Type className="h-4 w-4" />
          Font Size
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
            <button
              key={size}
              onClick={() => updateSettings({ fontSize: size })}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                settings.fontSize === size
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted hover:bg-muted/80'
              )}
            >
              <span 
                className="font-medium"
                style={{ fontSize: `${FONT_SIZES[size].scale}rem` }}
              >
                Aa
              </span>
              <span className="text-xs text-muted-foreground">
                {FONT_SIZES[size].name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Accessibility
        </Label>
        
        <div className="space-y-4 pl-1">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast" className="text-sm font-medium">High Contrast</Label>
              <p className="text-xs text-muted-foreground">Increase contrast for better visibility</p>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.contrast === 'high'}
              onCheckedChange={(checked) => updateSettings({ contrast: checked ? 'high' : 'default' })}
            />
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion" className="text-sm font-medium">Reduce Motion</Label>
              <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
            </div>
            <Switch
              id="reduce-motion"
              checked={settings.motion === 'reduced'}
              onCheckedChange={(checked) => updateSettings({ motion: checked ? 'reduced' : 'default' })}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode" className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing for denser UI</p>
            </div>
            <Switch
              id="compact-mode"
              checked={settings.compactMode}
              onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
            />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t">
        <Button variant="outline" onClick={resetSettings} className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

// Appearance settings dialog
export function AppearanceDialog({ 
  trigger,
  className 
}: { 
  trigger?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={className}>
            <Settings2 className="h-5 w-5" />
            <span className="sr-only">Appearance settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance Settings
          </DialogTitle>
          <DialogDescription>
            Customize the look and feel of the application to your preferences.
          </DialogDescription>
        </DialogHeader>
        
        <AppearanceSettings />
      </DialogContent>
    </Dialog>
  );
}
