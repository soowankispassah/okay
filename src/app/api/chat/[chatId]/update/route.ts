import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(
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

    const { chatId } = await params;
    const { title } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const updatedChat = await prisma.chat.update({
      where: {
        id: chatId,
        userId: session.user.id
      },
      data: {
        title: title.trim(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, chat: updatedChat });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update chat' },
      { status: 500 }
    );
  }
} 