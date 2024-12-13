import { PrismaClient } from '@prisma/client';
import { Message } from '@/types/chat';

const prisma = new PrismaClient();

export class ChatService {
  private static instance: ChatService;
  private messageQueue: { message: Message & { chatId: string }; userId: string }[] = [];
  private isProcessing = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async queueMessage(message: Message & { chatId: string }, userId: string) {
    this.messageQueue.push({ message, userId });
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const item = this.messageQueue.shift();
        if (!item) continue;

        const { message, userId } = item;

        // Ensure chat exists
        let chat = await prisma.chat.findUnique({
          where: { id: message.chatId }
        });

        if (!chat) {
          chat = await prisma.chat.create({
            data: {
              id: message.chatId,
              userId,
              title: message.content.slice(0, 100) // Use first 100 chars of first message as title
            }
          });
        }

        // Store message
        await prisma.chatMessage.create({
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
      }
    } catch (error) {
      console.error('Error processing chat message queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  public async getChatMessages(chatId: string): Promise<Message[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { timestamp: 'asc' }
    });

    return messages.map(msg => ({
      id: msg.id,
      chatId: msg.chatId,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
      model: msg.model as any,
      images: msg.images
    }));
  }

  public async getUserChats(userId: string) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  }
} 