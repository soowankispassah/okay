import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

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

      // Update user profile in database
      const imageUrl = `/profile-pictures/${filename}`;
      const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { image: imageUrl },
      });

      return NextResponse.json({ user });
    }

    // Handle JSON data for name update
    const data = await req.json();
    
    if (data.name !== undefined) {
      const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { name: data.name },
      });

      return NextResponse.json({ user });
    }

    return NextResponse.json({ message: 'No data provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating profile' },
      { status: 500 }
    );
  }
} 