import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../../auth/session/route';
import type { DBMessage } from '@/lib/db/schema';

// GET /api/conversations/[conversationId]/messages - Get messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const conversation = db.conversations.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    if (!conversation.participantIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID for pagination

    let messages = db.messages.findByConversation(conversationId);

    // Pagination - get messages before a certain ID
    if (before) {
      const beforeIndex = messages.findIndex(m => m.id === before);
      if (beforeIndex > 0) {
        messages = messages.slice(Math.max(0, beforeIndex - limit), beforeIndex);
      }
    } else {
      // Get latest messages
      messages = messages.slice(-limit);
    }

    // Enrich with sender info
    const enrichedMessages = messages.map(msg => {
      const sender = db.users.findById(msg.senderId);
      return {
        ...msg,
        sender: sender ? {
          id: sender.id,
          name: sender.name,
          avatar: sender.avatar,
          role: sender.role,
        } : null,
      };
    });

    // Mark messages as read
    const unreadCounts = { ...conversation.unreadCounts };
    unreadCounts[user.id] = 0;
    db.conversations.update(conversationId, { unreadCounts });

    // Mark messages as read by this user
    messages.forEach(msg => {
      if (msg.senderId !== user.id && !msg.readBy.some(r => r.participantId === user.id)) {
        db.messages.update(msg.id, {
          readBy: [...msg.readBy, { participantId: user.id, readAt: new Date() }],
          status: 'read',
        });
      }
    });

    return NextResponse.json({
      messages: enrichedMessages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const conversation = db.conversations.findById(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    if (!conversation.participantIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, type = 'text', attachments, replyToId } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message content or attachments required' },
        { status: 400 }
      );
    }

    const messageId = generateId();
    const message: DBMessage = {
      id: messageId,
      conversationId,
      senderId: user.id,
      type: type as DBMessage['type'],
      content: content || '',
      attachments,
      replyToId,
      status: 'sent',
      readBy: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
    };

    db.messages.create(message);

    // Update conversation
    const unreadCounts = { ...conversation.unreadCounts };
    conversation.participantIds.forEach(id => {
      if (id !== user.id) {
        unreadCounts[id] = (unreadCounts[id] || 0) + 1;
      }
    });

    db.conversations.update(conversationId, {
      lastMessageAt: new Date(),
      unreadCounts,
    });

    // Create notifications for other participants
    conversation.participantIds.forEach(participantId => {
      if (participantId !== user.id) {
        db.notifications.create({
          id: generateId(),
          userId: participantId,
          type: 'new_message',
          title: 'New message',
          message: `${user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          data: { conversationId, messageId },
          actionUrl: `/messages`,
          isRead: false,
          createdAt: new Date(),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
