'use client';

import { useState } from 'react';
import { useChat } from '@/lib/chat-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Search, Send, MessageCircle } from 'lucide-react';
import type { ChatUser, Conversation } from '@/lib/types';

interface QuickMessageModalProps {
  children: React.ReactNode;
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  recipientRole?: 'student' | 'instructor';
  courseId?: string;
  courseName?: string;
  onMessageSent?: () => void;
}

export function QuickMessageModal({
  children,
  recipientId,
  recipientName,
  recipientAvatar,
  recipientRole,
  courseId,
  courseName,
  onMessageSent,
}: QuickMessageModalProps) {
  const {
    conversations,
    users,
    createConversation,
    selectConversation,
    sendMessage,
    searchUsers,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(
    recipientId ? users.find(u => u.id === recipientId) || null : null
  );
  const [isSending, setIsSending] = useState(false);

  const currentUserId = 'user-1'; // Would come from auth in real app

  // Search results
  const searchResults = searchQuery 
    ? searchUsers(searchQuery).filter(u => u.id !== currentUserId)
    : [];

  // Find existing conversation with selected user
  const findExistingConversation = (userId: string): Conversation | undefined => {
    return conversations.find(conv => 
      conv.type === 'direct' &&
      conv.participants.some(p => p.id === userId) &&
      conv.participants.some(p => p.id === currentUserId)
    );
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    setIsSending(true);

    try {
      // Check if conversation exists
      let conversation = findExistingConversation(selectedUser.id);

      if (!conversation) {
        // Create new conversation
        conversation = createConversation(
          [currentUserId, selectedUser.id],
          'direct'
        );
      } else {
        // Select existing conversation
        selectConversation(conversation.id);
      }

      // Send message
      sendMessage(message.trim());

      // Clear and close
      setMessage('');
      setIsOpen(false);
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setMessage('');
      setSearchQuery('');
      if (recipientId) {
        const user = users.find(u => u.id === recipientId);
        setSelectedUser(user || null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            {selectedUser 
              ? `Send a message to ${selectedUser.name}`
              : 'Search for a user to send a message'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient selection */}
          {!recipientId && !selectedUser && (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searchResults.length > 0 && (
                <ScrollArea className="h-[200px] mt-2 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
            </div>
          )}

          {/* Selected user display */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser.avatar || recipientAvatar} />
                <AvatarFallback>
                  {(selectedUser.name || recipientName || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.name || recipientName}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedUser.role || recipientRole}
                  {courseName && ` - ${courseName}`}
                </p>
              </div>
              {!recipientId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              )}
            </div>
          )}

          {/* Message input */}
          {selectedUser && (
            <div>
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!selectedUser || !message.trim() || isSending}
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Shortcut component for messaging from user cards/profiles
interface MessageUserButtonProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'student' | 'instructor';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function MessageUserButton({
  userId,
  userName,
  userAvatar,
  userRole,
  variant = 'outline',
  size = 'sm',
  className,
}: MessageUserButtonProps) {
  return (
    <QuickMessageModal
      recipientId={userId}
      recipientName={userName}
      recipientAvatar={userAvatar}
      recipientRole={userRole}
    >
      <Button variant={variant} size={size} className={className}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Message
      </Button>
    </QuickMessageModal>
  );
}
