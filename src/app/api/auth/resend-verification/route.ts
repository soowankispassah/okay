import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Track resend attempts with a simple in-memory store
const resendAttempts = new Map<string, number>();
const COOLDOWN_PERIOD = 60 * 1000; // 1 minute in milliseconds
const MAX_ATTEMPTS = 5; // Maximum attempts within 1 hour
const RESET_AFTER = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Check rate limiting
    const now = Date.now();
    const lastAttempt = resendAttempts.get(email) || 0;
    const timeSinceLastAttempt = now - lastAttempt;

    // If last attempt was within cooldown period
    if (timeSinceLastAttempt < COOLDOWN_PERIOD) {
      const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastAttempt) / 1000);
      return NextResponse.json(
        { message: `Please wait ${remainingSeconds} seconds before requesting another email` },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Get existing verification tokens for this email
    const existingTokens = await prisma.verificationToken.findMany({
      where: { identifier: email },
      orderBy: { expires: 'desc' },
    });

    // Check if there are too many recent tokens
    const recentTokens = existingTokens.filter(
      token => token.expires.getTime() > now - RESET_AFTER
    );

    if (recentTokens.length >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: "Too many verification attempts. Please try again in 1 hour" },
        { status: 429 }
      );
    }

    // Create new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(now + 15 * 60 * 1000); // 15 minutes

    // Delete expired tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        expires: { lt: new Date() }
      },
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send verification email using Brevo API
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;
    
    const emailData = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "Your App Name"
      },
      to: [{
        email: email
      }],
      subject: "Verify your email address",
      htmlContent: `
        <h1>Welcome to Your App Name!</h1>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this verification email, you can safely ignore it.</p>
      `
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error("Failed to send verification email");
    }

    // Update last attempt timestamp
    resendAttempts.set(email, now);

    return NextResponse.json(
      { message: "Verification email sent" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Error sending verification email" },
      { status: 500 }
    );
  }
} 