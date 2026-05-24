import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';
import { getUserFromSession } from '../auth/session/route';
import type { DBConversation } from '@/lib/db/schema';

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversations = db.conversations.findByParticipant(user.id);

    // Enrich with participant info and last message
    const enrichedConversations = conversations.map(conv => {
      const participants = conv.participantIds
        .map(id => db.users.findById(id))
        .filter(Boolean)
        .map(u => ({
          id: u!.id,
          name: u!.name,
          avatar: u!.avatar,
          role: u!.role,
        }));

      const messages = db.messages.findByConversation(conv.id);
      const lastMessage = messages[messages.length - 1];

      return {
        ...conv,
        participants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.isDeleted ? 'Message deleted' : lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : null,
        unreadCount: conv.unreadCounts[user.id] || 0,
      };
    });

    // Sort by last message
    enrichedConversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      conversations: enrichedConversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantIds, type = 'direct', title, courseId } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Add current user to participants
    const allParticipantIds = [...new Set([user.id, ...participantIds])];

    // For direct messages, check if conversation already exists
    if (type === 'direct' && allParticipantIds.length === 2) {
      const existingConversations = db.conversations.findByParticipant(user.id);
      const existing = existingConversations.find(c =>
        c.type === 'direct' &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(allParticipantIds[0]) &&
        c.participantIds.includes(allParticipantIds[1])
      );

      if (existing) {
        return NextResponse.json({
          success: true,
          conversation: existing,
          existing: true,
        });
      }
    }

    // Verify all participants exist
    for (const id of allParticipantIds) {
      const participant = db.users.findById(id);
      if (!participant) {
        return NextResponse.json(
          { error: `User ${id} not found` },
          { status: 400 }
        );
      }
    }

    // Initialize unread counts
    const unreadCounts: Record<string, number> = {};
    allParticipantIds.forEach(id => {
      unreadCounts[id] = 0;
    });

    const conversationId = generateId();
    const conversation: DBConversation = {
      id: conversationId,
      type: type as DBConversation['type'],
      title,
      courseId,
      participantIds: allParticipantIds,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCounts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.conversations.create(conversation);

    return NextResponse.json({
      success: true,
      conversation,
    }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
