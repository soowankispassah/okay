import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      select: {
        identifier: true,
        expires: true,
        token: true
      }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { message: "Invalid reset token" },
        { status: 400 }
      );
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { message: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password only
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { 
        password: hashedPassword,
      },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { 
        message: "Password reset successfully", 
        email: user.email,
        redirectTo: "/auth/complete-profile" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Error resetting password" },
      { status: 500 }
    );
  }
} 