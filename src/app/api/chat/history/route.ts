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

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const previous7Days = new Date(now);
    previous7Days.setDate(previous7Days.getDate() - 7);

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
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const chats = {
      today: allChats.filter(chat => 
        chat.updatedAt >= new Date(now.setHours(0, 0, 0, 0))
      ),
      yesterday: allChats.filter(chat => 
        chat.updatedAt >= new Date(yesterday.setHours(0, 0, 0, 0)) &&
        chat.updatedAt < new Date(now.setHours(0, 0, 0, 0))
      ),
      previous7Days: allChats.filter(chat => 
        chat.updatedAt >= new Date(previous7Days.setHours(0, 0, 0, 0)) &&
        chat.updatedAt < new Date(yesterday.setHours(0, 0, 0, 0))
      ),
      older: allChats.filter(chat => 
        chat.updatedAt < new Date(previous7Days.setHours(0, 0, 0, 0))
      )
    };

    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 