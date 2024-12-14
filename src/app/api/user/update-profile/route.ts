import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Handle multipart form data for image upload
    if (req.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File;
      
      if (!file) {
        return NextResponse.json({ message: 'No image provided' }, { status: 400 });
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json({ message: 'Invalid file type. Only JPEG, PNG and WebP are allowed.' }, { status: 400 });
      }

      // Get current user to check for old image
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { image: true }
      });

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.type.split('/')[1];
      const filename = `${session.user.email.split('@')[0]}-${timestamp}.${extension}`;
      
      // Create buffer from file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file to disk
      const filePath = path.join(process.cwd(), 'public', 'profile-pictures', filename);
      await writeFile(filePath, buffer);

      // Delete old image file if it exists
      if (currentUser?.image) {
        const oldImagePath = path.join(process.cwd(), 'public', currentUser.image);
        if (existsSync(oldImagePath)) {
          try {
            await unlink(oldImagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
      }

      // Update user profile in database
      const imageUrl = `/profile-pictures/${filename}`;
      const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { image: imageUrl },
      });

      return NextResponse.json({ user });
    }

    // Handle JSON data for other profile updates
    const data = await req.json();
    
    const updateData: any = {};
    if (data.name) updateData.name = data.name;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating profile' },
      { status: 500 }
    );
  }
} 