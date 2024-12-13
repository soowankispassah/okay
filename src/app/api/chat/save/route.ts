import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const { message } = body;

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure chat exists
    let chat = await prisma.chat.findUnique({
      where: { id: message.chatId }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          id: message.chatId,
          userId: user.id,
          title: message.content.slice(0, 100)
        }
      });
    }

    // Store message
    const savedMessage = await prisma.chatMessage.create({
      data: {
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        content: message.content,
        model: message.model,
        timestamp: new Date(message.timestamp),
        images: message.images || []
      }
    });

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error: any) {
    console.error('Error saving chat message:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to save message', details: error?.message },
      { status: 500 }
    );
  }
} 