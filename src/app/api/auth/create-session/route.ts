import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { signJwtAccessToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { message: "User not found or email not verified" },
        { status: 404 }
      );
    }

    // Create JWT token
    const token = signJwtAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    });

    // Set the token in a cookie
    const response = NextResponse.json(
      { message: "Session created successfully" },
      { status: 200 }
    );

    response.cookies.set({
      name: "next-auth.session-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { message: "Error creating session" },
      { status: 500 }
    );
  }
} 