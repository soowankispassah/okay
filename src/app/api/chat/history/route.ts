import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all chats with minimal message data needed for display
    const allChats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        deleted: false,
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: {
            timestamp: 'asc'
          },
          select: {
            id: true,
            timestamp: true,
            content: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 100 // Limit to most recent 100 chats for performance
    });

    // Pre-process dates on server side
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
    const startOf7DaysAgo = startOfToday - (7 * 24 * 60 * 60 * 1000);

    // Group chats by date ranges
    const chats = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: []
    };

    allChats.forEach(chat => {
      const chatTime = new Date(chat.updatedAt).getTime();
      if (chatTime >= startOfToday) {
        chats.today.push(chat);
      } else if (chatTime >= startOfYesterday) {
        chats.yesterday.push(chat);
      } else if (chatTime >= startOf7DaysAgo) {
        chats.previous7Days.push(chat);
      } else {
        chats.older.push(chat);
      }
    });

    return NextResponse.json({ 
      success: true, 
      chats,
      _debug: {
        total: allChats.length,
        distribution: {
          today: chats.today.length,
          yesterday: chats.yesterday.length,
          previous7Days: chats.previous7Days.length,
          older: chats.older.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 