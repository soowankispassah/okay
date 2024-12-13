import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get chatId from URL using async params
    const { chatId } = await params;

    // Soft delete the chat using both flags
    const updatedChat = await prisma.chat.updateMany({
      where: {
        id: chatId,
        userId: session.user.id,
        deleted: false
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    if (updatedChat.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Chat not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
} 