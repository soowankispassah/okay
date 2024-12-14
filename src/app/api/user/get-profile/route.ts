import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { existsSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if the image file exists
    if (user.image) {
      const imagePath = path.join(process.cwd(), 'public', user.image);
      if (!existsSync(imagePath)) {
        // Image file doesn't exist, update to use the latest image
        const latestImage = await prisma.user.findFirst({
          where: { 
            email: session.user.email,
            image: { not: user.image } // Find a different image
          },
          orderBy: { updatedAt: 'desc' },
          select: { image: true }
        });

        if (latestImage?.image) {
          // Update user's image to the latest one
          await prisma.user.update({
            where: { email: session.user.email },
            data: { image: latestImage.image }
          });
          user.image = latestImage.image;
        } else {
          // No valid image found, clear the image field
          await prisma.user.update({
            where: { email: session.user.email },
            data: { image: null }
          });
          user.image = null;
        }
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { message: error.message || 'Error fetching profile' },
      { status: 500 }
    );
  }
} 