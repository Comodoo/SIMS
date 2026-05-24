'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Conversation, Message, ChatUser, TypingIndicator, ChatSettings, MessageAttachment } from './types';

// Sample users for demo
const SAMPLE_USERS: ChatUser[] = [
  {
    id: 'user-1',
    name: 'John Student',
    email: 'john@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: 'student',
    isOnline: true,
    enrolledCourses: ['course-1', 'course-2'],
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Instructor',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'instructor',
    isOnline: true,
    teachingCourses: ['course-1', 'course-3'],
  },
  {
    id: 'user-3',
    name: 'Mike Student',
    email: 'mike@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    role: 'student',
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    enrolledCourses: ['course-1'],
  },
  {
    id: 'user-4',
    name: 'Prof. James Wilson',
    email: 'james@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    role: 'instructor',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    teachingCourses: ['course-2'],
  },
  {
    id: 'user-5',
    name: 'Emma Davis',
    email: 'emma@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    role: 'student',
    isOnline: true,
    enrolledCourses: ['course-1', 'course-2', 'course-3'],
  },
  {
    id: 'admin-1',
    name: 'Support Team',
    email: 'support@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support',
    role: 'support',
    isOnline: true,
  },
];

// Sample conversations
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'direct',
    participants: [
      { ...SAMPLE_USERS[0], joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[1], joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    ],
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'conv-2',
    type: 'course',
    title: 'Python for Data Science - Q&A',
    courseId: 'course-1',
    courseName: 'Python for Data Science',
    participants: [
      { ...SAMPLE_USERS[0], joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[1], joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[2], joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[4], joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
    unreadCount: 5,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'conv-3',
    type: 'direct',
    participants: [
      { ...SAMPLE_USERS[0], joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[3], joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'conv-4',
    type: 'support',
    title: 'Payment Issue #12345',
    participants: [
      { ...SAMPLE_USERS[0], joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { ...SAMPLE_USERS[5], joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

// Sample messages
const generateSampleMessages = (): Record<string, Message[]> => {
  return {
    'conv-1': [
      {
        id: 'msg-1-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderName: 'John Student',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        senderRole: 'student',
        type: 'text',
        content: 'Hi Dr. Sarah, I have a question about the machine learning assignment.',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'user-2', readAt: new Date(Date.now() - 60 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'msg-1-2',
        conversationId: 'conv-1',
        senderId: 'user-2',
        senderName: 'Dr. Sarah Instructor',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        senderRole: 'instructor',
        type: 'text',
        content: 'Of course! What would you like to know?',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'user-1', readAt: new Date(Date.now() - 55 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 'msg-1-3',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderName: 'John Student',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        senderRole: 'student',
        type: 'text',
        content: 'I am having trouble understanding the gradient descent algorithm. Could you explain it in simpler terms?',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'user-2', readAt: new Date(Date.now() - 30 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        id: 'msg-1-4',
        conversationId: 'conv-1',
        senderId: 'user-2',
        senderName: 'Dr. Sarah Instructor',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        senderRole: 'instructor',
        type: 'text',
        content: 'Think of gradient descent like walking down a hill in foggy weather. You cannot see the bottom, but you can feel which direction is downward. You take small steps in that direction until you reach the lowest point. In ML, we are trying to find the lowest point of the error function.',
        status: 'delivered',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: 'msg-1-5',
        conversationId: 'conv-1',
        senderId: 'user-2',
        senderName: 'Dr. Sarah Instructor',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        senderRole: 'instructor',
        type: 'text',
        content: 'I have attached a diagram that might help visualize this concept.',
        attachments: [
          {
            id: 'att-1',
            type: 'image',
            name: 'gradient_descent_explained.png',
            url: 'https://via.placeholder.com/600x400',
            size: 245000,
            mimeType: 'image/png',
            thumbnailUrl: 'https://via.placeholder.com/150x100',
          },
        ],
        status: 'delivered',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
    'conv-2': [
      {
        id: 'msg-2-1',
        conversationId: 'conv-2',
        senderId: 'user-4',
        senderName: 'Emma Davis',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        senderRole: 'student',
        type: 'text',
        content: 'Has anyone completed the pandas exercise from Module 3?',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: 'msg-2-2',
        conversationId: 'conv-2',
        senderId: 'user-2',
        senderName: 'Mike Student',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        senderRole: 'student',
        type: 'text',
        content: 'Yes! I found it challenging but rewarding. The key is to use groupby correctly.',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'msg-2-3',
        conversationId: 'conv-2',
        senderId: 'user-1',
        senderName: 'Dr. Sarah Instructor',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        senderRole: 'instructor',
        type: 'text',
        content: 'Great discussion everyone! Remember, office hours are tomorrow at 3 PM if you need extra help.',
        status: 'delivered',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
    'conv-3': [
      {
        id: 'msg-3-1',
        conversationId: 'conv-3',
        senderId: 'user-3',
        senderName: 'Prof. James Wilson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
        senderRole: 'instructor',
        type: 'text',
        content: 'Welcome to Advanced JavaScript! Feel free to reach out if you have any questions.',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'user-1', readAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'msg-3-2',
        conversationId: 'conv-3',
        senderId: 'user-1',
        senderName: 'John Student',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        senderRole: 'student',
        type: 'text',
        content: 'Thank you Professor! Looking forward to the course.',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'user-4', readAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ],
    'conv-4': [
      {
        id: 'msg-4-1',
        conversationId: 'conv-4',
        senderId: 'user-1',
        senderName: 'John Student',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        senderRole: 'student',
        type: 'text',
        content: 'Hi, I was charged twice for my course purchase. Order ID: #ORD-2024-001',
        status: 'read',
        isEdited: false,
        isDeleted: false,
        readBy: [{ participantId: 'admin-1', readAt: new Date(Date.now() - 20 * 60 * 60 * 1000) }],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'msg-4-2',
        conversationId: 'conv-4',
        senderId: 'admin-1',
        senderName: 'Support Team',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support',
        senderRole: 'support',
        type: 'text',
        content: 'Hello John, thank you for reaching out. I can see the duplicate charge and have initiated a refund. It should appear in your account within 3-5 business days.',
        status: 'delivered',
        isEdited: false,
        isDeleted: false,
        readBy: [],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ],
  };
};

interface ChatContextType {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  users: ChatUser[];
  typingIndicators: TypingIndicator[];
  settings: ChatSettings;
  isLoading: boolean;
  
  // Conversation actions
  selectConversation: (conversationId: string) => void;
  createConversation: (participantIds: string[], type: Conversation['type'], courseId?: string) => Conversation;
  deleteConversation: (conversationId: string) => void;
  pinConversation: (conversationId: string) => void;
  unpinConversation: (conversationId: string) => void;
  muteConversation: (conversationId: string) => void;
  unmuteConversation: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  
  // Message actions
  sendMessage: (content: string, attachments?: MessageAttachment[], replyToId?: string) => Message;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  markAsRead: (messageId: string) => void;
  markAllAsRead: (conversationId: string) => void;
  
  // Typing indicators
  setTyping: (isTyping: boolean) => void;
  
  // User actions
  getUserById: (userId: string) => ChatUser | undefined;
  getOnlineUsers: () => ChatUser[];
  searchUsers: (query: string) => ChatUser[];
  
  // Settings
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  
  // Utilities
  getTotalUnreadCount: () => number;
  searchMessages: (query: string) => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(generateSampleMessages());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [users] = useState<ChatUser[]>(SAMPLE_USERS);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [settings, setSettings] = useState<ChatSettings>({
    userId: 'user-1',
    allowMessagesFrom: 'everyone',
    emailNotifications: true,
    pushNotifications: true,
    showReadReceipts: true,
    showOnlineStatus: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) || null
    : null;

  const messages = currentConversationId 
    ? messagesMap[currentConversationId] || []
    : [];

  // Update last message in conversations
  useEffect(() => {
    setConversations(prev => prev.map(conv => {
      const convMessages = messagesMap[conv.id];
      if (convMessages && convMessages.length > 0) {
        return {
          ...conv,
          lastMessage: convMessages[convMessages.length - 1],
        };
      }
      return conv;
    }));
  }, [messagesMap]);

  // Conversation actions
  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  const createConversation = useCallback((
    participantIds: string[],
    type: Conversation['type'],
    courseId?: string
  ): Conversation => {
    const participants = participantIds
      .map(id => users.find(u => u.id === id))
      .filter((u): u is ChatUser => u !== undefined)
      .map(u => ({ ...u, joinedAt: new Date() }));

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      type,
      courseId,
      participants,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setMessagesMap(prev => ({ ...prev, [newConversation.id]: [] }));
    setCurrentConversationId(newConversation.id);

    return newConversation;
  }, [users]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setMessagesMap(prev => {
      const newMap = { ...prev };
      delete newMap[conversationId];
      return newMap;
    });
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  const pinConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isPinned: true } : c
    ));
  }, []);

  const unpinConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isPinned: false } : c
    ));
  }, []);

  const muteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isMuted: true } : c
    ));
  }, []);

  const unmuteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isMuted: false } : c
    ));
  }, []);

  const archiveConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isArchived: true } : c
    ));
  }, []);

  const unarchiveConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, isArchived: false } : c
    ));
  }, []);

  // Message actions
  const sendMessage = useCallback((
    content: string,
    attachments?: MessageAttachment[],
    replyToId?: string
  ): Message => {
    if (!currentConversationId) {
      throw new Error('No conversation selected');
    }

    const replyTo = replyToId 
      ? messagesMap[currentConversationId]?.find(m => m.id === replyToId)
      : undefined;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: currentConversationId,
      senderId: 'user-1', // Current user
      senderName: 'John Student',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      senderRole: 'student',
      type: attachments && attachments.length > 0 
        ? (attachments[0].type === 'image' ? 'image' : 'file')
        : 'text',
      content,
      attachments,
      replyTo: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        senderName: replyTo.senderName,
      } : undefined,
      status: 'sending',
      isEdited: false,
      isDeleted: false,
      readBy: [],
      createdAt: new Date(),
    };

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: [...(prev[currentConversationId] || []), newMessage],
    }));

    // Simulate sending
    setTimeout(() => {
      setMessagesMap(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].map(m =>
          m.id === newMessage.id ? { ...m, status: 'sent' } : m
        ),
      }));
    }, 500);

    // Simulate delivery
    setTimeout(() => {
      setMessagesMap(prev => ({
        ...prev,
        [currentConversationId]: prev[currentConversationId].map(m =>
          m.id === newMessage.id ? { ...m, status: 'delivered' } : m
        ),
      }));
    }, 1000);

    // Update conversation
    setConversations(prev => prev.map(c =>
      c.id === currentConversationId 
        ? { ...c, updatedAt: new Date(), lastMessage: newMessage }
        : c
    ));

    return newMessage;
  }, [currentConversationId, messagesMap]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentConversationId) return;

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: prev[currentConversationId].map(m =>
        m.id === messageId 
          ? { ...m, content: newContent, isEdited: true, editedAt: new Date() }
          : m
      ),
    }));
  }, [currentConversationId]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!currentConversationId) return;

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: prev[currentConversationId].map(m =>
        m.id === messageId 
          ? { ...m, isDeleted: true, deletedAt: new Date(), content: 'This message was deleted' }
          : m
      ),
    }));
  }, [currentConversationId]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentConversationId) return;

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: prev[currentConversationId].map(m => {
        if (m.id !== messageId) return m;
        
        const reactions = m.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          if (!existingReaction.userIds.includes('user-1')) {
            return {
              ...m,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, userIds: [...r.userIds, 'user-1'], count: r.count + 1 }
                  : r
              ),
            };
          }
        } else {
          return {
            ...m,
            reactions: [...reactions, { emoji, userIds: ['user-1'], count: 1 }],
          };
        }
        return m;
      }),
    }));
  }, [currentConversationId]);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentConversationId) return;

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: prev[currentConversationId].map(m => {
        if (m.id !== messageId) return m;
        
        const reactions = m.reactions || [];
        return {
          ...m,
          reactions: reactions
            .map(r => {
              if (r.emoji === emoji) {
                const newUserIds = r.userIds.filter(id => id !== 'user-1');
                return { ...r, userIds: newUserIds, count: newUserIds.length };
              }
              return r;
            })
            .filter(r => r.count > 0),
        };
      }),
    }));
  }, [currentConversationId]);

  const markAsRead = useCallback((messageId: string) => {
    if (!currentConversationId) return;

    setMessagesMap(prev => ({
      ...prev,
      [currentConversationId]: prev[currentConversationId].map(m =>
        m.id === messageId && !m.readBy.some(r => r.participantId === 'user-1')
          ? { ...m, readBy: [...m.readBy, { participantId: 'user-1', readAt: new Date() }] }
          : m
      ),
    }));
  }, [currentConversationId]);

  const markAllAsRead = useCallback((conversationId: string) => {
    setMessagesMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(m =>
        !m.readBy.some(r => r.participantId === 'user-1')
          ? { ...m, readBy: [...m.readBy, { participantId: 'user-1', readAt: new Date() }] }
          : m
      ) || [],
    }));

    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  // Typing indicators
  const setTyping = useCallback((isTyping: boolean) => {
    if (!currentConversationId) return;

    if (isTyping) {
      setTypingIndicators(prev => [
        ...prev.filter(t => t.userId !== 'user-1'),
        {
          conversationId: currentConversationId,
          userId: 'user-1',
          userName: 'John Student',
          isTyping: true,
          timestamp: new Date(),
        },
      ]);
    } else {
      setTypingIndicators(prev => prev.filter(t => t.userId !== 'user-1'));
    }
  }, [currentConversationId]);

  // User actions
  const getUserById = useCallback((userId: string) => {
    return users.find(u => u.id === userId);
  }, [users]);

  const getOnlineUsers = useCallback(() => {
    return users.filter(u => u.isOnline);
  }, [users]);

  const searchUsers = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
    );
  }, [users]);

  // Settings
  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Utilities
  const getTotalUnreadCount = useCallback(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  const searchMessages = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    const results: Message[] = [];
    
    Object.values(messagesMap).forEach(msgs => {
      msgs.forEach(m => {
        if (m.content.toLowerCase().includes(lowerQuery) && !m.isDeleted) {
          results.push(m);
        }
      });
    });
    
    return results;
  }, [messagesMap]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        users,
        typingIndicators,
        settings,
        isLoading,
        selectConversation,
        createConversation,
        deleteConversation,
        pinConversation,
        unpinConversation,
        muteConversation,
        unmuteConversation,
        archiveConversation,
        unarchiveConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        markAsRead,
        markAllAsRead,
        setTyping,
        getUserById,
        getOnlineUsers,
        searchUsers,
        updateSettings,
        getTotalUnreadCount,
        searchMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
