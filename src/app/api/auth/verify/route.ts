import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Rate limit helper function
function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (now - record.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(req: Request) {
  try {
    // Get client IP
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    
    // Check rate limit (10 attempts per 15 minutes)
    if (checkRateLimit(clientIp, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { message: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { token } = await req.json();

    // Input validation
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return NextResponse.json(
        { message: "Invalid verification link" },
        { status: 400 }
      );
    }

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      select: {
        identifier: true,
        expires: true,
        token: true
      }
    });

    // Generic error message for invalid or expired tokens
    const invalidTokenResponse = NextResponse.json(
      { message: "Invalid verification link" },
      { status: 400 }
    );

    if (!verificationToken) {
      return invalidTokenResponse;
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token }
      });
      return invalidTokenResponse;
    }

    // Start a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find user
      const user = await tx.user.findUnique({
        where: { 
          email: verificationToken.identifier,
          emailVerified: false // Only proceed if not already verified
        },
        select: { id: true, email: true }
      });

      if (!user) {
        return false;
      }

      // Delete all verification tokens for this user
      await tx.verificationToken.deleteMany({
        where: { identifier: user.email }
      });

      return true;
    });

    if (!result) {
      return invalidTokenResponse;
    }

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during verification" },
      { status: 500 }
    );
  }
} 