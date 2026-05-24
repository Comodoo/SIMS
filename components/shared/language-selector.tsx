'use client';

import { useState } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Globe, Check, Search, Languages } from 'lucide-react';

// Country flag emoji helper
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'full';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showLabel = false,
  className 
}: LanguageSelectorProps) {
  const { language, setLanguage, t, autoTranslate, setAutoTranslate, languageInfo } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.countries.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setDialogOpen(false);
    setSearchQuery('');
  };

  if (variant === 'full') {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={cn('gap-2', className)}>
            <span className="text-lg">{getFlagEmoji(languageInfo.flag)}</span>
            <span>{languageInfo.name}</span>
            <Globe className="h-4 w-4 ml-1 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('language.select', 'Select Language')}
            </DialogTitle>
            <DialogDescription>
              Choose your preferred language. Content will be displayed in this language when available.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search languages or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Language Grid */}
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                      language === lang.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-2xl">{getFlagEmoji(lang.flag)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{lang.name}</span>
                        {language === lang.code && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">
                        {lang.nativeName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredLanguages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No languages found matching "{searchQuery}"
                </div>
              )}
            </ScrollArea>
            
            {/* Auto-translate toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto-translate" className="font-medium">
                  {t('language.auto_translate', 'Auto-translate content')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically translate course content to English
                </p>
              </div>
              <Switch
                id="auto-translate"
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
              />
            </div>
            
            {/* Selected language info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Current: <strong className="text-foreground">{languageInfo.name}</strong></span>
              <Badge variant="outline" className="text-xs">
                {languageInfo.direction === 'rtl' ? 'Right-to-Left' : 'Left-to-Right'}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={showLabel ? 'default' : 'icon'} className={cn('gap-2', className)}>
          <span className="text-lg">{getFlagEmoji(languageInfo.flag)}</span>
          {showLabel && <span className="hidden sm:inline">{languageInfo.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t('language.select', 'Select Language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[250px]">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                language === lang.code && 'bg-primary/10'
              )}
            >
              <span className="text-lg">{getFlagEmoji(lang.flag)}</span>
              <div className="flex-1">
                <span>{lang.name}</span>
                <span className="text-xs text-muted-foreground ml-1">({lang.nativeName})</span>
              </div>
              {language === lang.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-trans-dropdown" className="text-xs">
              Auto-translate
            </Label>
            <Switch
              id="auto-trans-dropdown"
              checked={autoTranslate}
              onCheckedChange={setAutoTranslate}
              className="scale-75"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Inline translate button component
export function TranslateButton({ 
  text, 
  onTranslate,
  className 
}: { 
  text: string; 
  onTranslate?: (translated: string) => void;
  className?: string;
}) {
  const { translateToEnglish, language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);

  if (language === 'en') return null;

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const result = await translateToEnglish(text);
      setTranslated(result);
      onTranslate?.(result);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTranslate}
      disabled={isTranslating}
      className={cn('gap-1 text-xs', className)}
    >
      <Languages className="h-3 w-3" />
      {isTranslating ? 'Translating...' : translated ? 'Translated' : 'Translate'}
    </Button>
  );
}
