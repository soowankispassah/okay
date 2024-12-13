import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, dateOfBirth } = await req.json();

    // Get the user's email from the request body instead of session
    const user = await prisma.user.findFirst({
      where: {
        name: null,
        emailVerified: false,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user?.email) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Update user profile and set emailVerified to true
    await prisma.user.update({
      where: { email: user.email },
      data: {
        name,
        dateOfBirth: new Date(dateOfBirth),
        emailVerified: true,
      },
    });

    return NextResponse.json(
      { 
        message: "Profile completed successfully",
        email: user.email 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { message: "Error completing profile" },
      { status: 500 }
    );
  }
} 