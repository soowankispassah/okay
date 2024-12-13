import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Send notification email about signup attempt using Brevo/Sendinblue
      const emailData = {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: "KhasiGPT"
        },
        to: [{
          email: email
        }],
        subject: "Account Creation Attempt",
        htmlContent: `
          <div>
            <h2>Account Creation Attempt</h2>
            <p>Hello,</p>
            <p>We noticed that someone tried to create a new account using your email address (${email}).</p>
            <p>If this was you, please note that you already have an account with us. You can sign in to your existing account using your email and password.</p>
            <p>If you forgot your password, you can reset it using the "Forgot Password" option on the login page.</p>
            <p>If this wasn't you, please be aware that:</p>
            <ul>
              <li>Your email address was not used to create a new account</li>
              <li>Your existing account is secure</li>
              <li>No action is required from your side</li>
            </ul>
            <p>If you have any concerns about your account security, please contact our support team.</p>
            <p>Best regards,<br>KhasiGPT Team</p>
          </div>
        `
      };

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY!
        },
        body: JSON.stringify(emailData)
      });

      // Return success message as if verification email was sent
      return NextResponse.json(
        { message: "Verification email sent successfully" },
        { status: 200 }
      );
    }

    // If user doesn't exist, proceed with normal signup process
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user and verification token in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: tokenExpiry,
        },
      });

      return user;
    });

    // Send actual verification email
    const emailData = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "KhasiGPT"
      },
      to: [{
        email: email
      }],
      subject: "Verify your email",
      htmlContent: `
        <div>
          <h2>Welcome to KhasiGPT!</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}">
            Verify Email
          </a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `
    };

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!
      },
      body: JSON.stringify(emailData)
    });

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: error.message || "Error creating account" },
      { status: 500 }
    );
  }
} 