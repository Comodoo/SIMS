'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/chat-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  MessageCircle, X, Send, Minimize2, Maximize2, Users,
  ChevronLeft, Check, CheckCheck, Circle, Smile
} from 'lucide-react';
import type { Message, Conversation } from '@/lib/types';

// Common emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'];

// Format time helper
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Message status icon
const MessageStatus = ({ status }: { status: Message['status'] }) => {
  switch (status) {
    case 'sending':
      return <Circle className="h-3 w-3 text-muted-foreground animate-pulse" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-primary" />;
    default:
      return null;
  }
};

interface ChatBubbleProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export function ChatBubble({ className, position = 'bottom-right' }: ChatBubbleProps) {
  const {
    conversations,
    currentConversation,
    messages,
    selectConversation,
    sendMessage,
    getTotalUnreadCount,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !showConversations) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showConversations]);

  const unreadCount = getTotalUnreadCount();
  const currentUserId = 'user-1'; // Would come from auth in real app

  // Get conversation display name
  const getConversationName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    const otherParticipants = conv.participants.filter(p => p.id !== currentUserId);
    if (otherParticipants.length === 1) return otherParticipants[0].name;
    return otherParticipants.map(p => p.name.split(' ')[0]).join(', ');
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput.trim());
    setMessageInput('');
    setShowEmojis(false);
  };

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojis(false);
  };

  // Handle conversation select
  const handleSelectConversation = (convId: string) => {
    selectConversation(convId);
    setShowConversations(false);
  };

  // Active (non-archived) conversations
  const activeConversations = conversations.filter(c => !c.isArchived);

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  return (
    <div className={cn('fixed z-50', positionClasses, className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={cn(
              'h-14 w-14 rounded-full shadow-lg',
              unreadCount > 0 && 'animate-pulse'
            )}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            'p-0 shadow-xl',
            isExpanded ? 'w-96 h-[500px]' : 'w-80 h-[400px]'
          )}
          align={position === 'bottom-right' ? 'end' : 'start'}
          side="top"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-2">
                {!showConversations && currentConversation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setShowConversations(true)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h3 className="font-semibold">
                  {showConversations 
                    ? 'Messages' 
                    : currentConversation 
                      ? getConversationName(currentConversation)
                      : 'Messages'
                  }
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {showConversations ? (
              // Conversation list
              <ScrollArea className="flex-1">
                {activeConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {activeConversations.map(conv => {
                      const name = getConversationName(conv);
                      const lastMsg = conv.lastMessage;
                      const otherParticipant = conv.participants.find(p => p.id !== currentUserId);
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherParticipant?.avatar} />
                              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {otherParticipant?.isOnline && (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {lastMsg && formatTime(new Date(lastMsg.createdAt))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate">
                                {lastMsg?.content || 'No messages'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            ) : currentConversation ? (
              // Chat view
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === currentUserId;
                      
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex gap-2', isOwn && 'flex-row-reverse')}
                        >
                          {!isOwn && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={msg.senderAvatar} />
                              <AvatarFallback className="text-[10px]">
                                {msg.senderName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn('flex flex-col max-w-[80%]', isOwn && 'items-end')}>
                            <div
                              className={cn(
                                'px-3 py-1.5 rounded-2xl text-sm',
                                isOwn 
                                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                                  : 'bg-muted rounded-bl-md'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <div className={cn('flex items-center gap-1 mt-0.5', isOwn && 'flex-row-reverse')}>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(new Date(msg.createdAt))}
                              </span>
                              {isOwn && <MessageStatus status={msg.status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Emoji Picker */}
                {showEmojis && (
                  <div className="px-3 py-2 border-t bg-muted/50">
                    <div className="flex flex-wrap gap-1">
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t">
                  <div className="flex items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => setShowEmojis(!showEmojis)}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Textarea
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[36px] max-h-[80px] resize-none text-sm"
                      rows={1}
                    />
                    <Button 
                      size="icon" 
                      className="h-9 w-9 flex-shrink-0"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Select a conversation</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
