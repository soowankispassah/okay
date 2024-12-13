import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true
      }
    });

    if (!user) {
      // Send notification email about password reset attempt for non-existent account
      const emailData = {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: "KhasiGPT"
        },
        to: [{
          email: email
        }],
        subject: "Password Reset Request",
        htmlContent: `
          <div>
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a password reset request for this email address (${email}).</p>
            <p>However, we noticed that this email is not associated with any account in our system.</p>
            <p>If you'd like to use our services, you can:</p>
            <ul>
              <li>Create a new account by visiting our signup page</li>
              <li>Sign in with Google for quick access</li>
            </ul>
            <p>If you didn't request this password reset, you can safely ignore this email. No account exists with this email address.</p>
            <p>If you believe this is a mistake or have any concerns, please contact our support team.</p>
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

      // Return success message to prevent email enumeration
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive password reset instructions." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: tokenExpiry,
      },
    });

    // Different email content based on verification status
    let emailSubject = "Reset Your Password";
    let emailContent = "";
    let resetPath = user.emailVerified ? "reset-password" : "verify-reset";

    if (!user.emailVerified) {
      emailSubject = "Complete Your Account Setup";
      emailContent = `
        <div>
          <h2>Account Setup and Password Reset</h2>
          <p>Hello,</p>
          <p>We received a password reset request for your account. We noticed that your account setup is not complete yet.</p>
          <p>Click the link below to:</p>
          <ol>
            <li>Set your password</li>
            <li>Complete your profile</li>
          </ol>
          <a href="${process.env.NEXTAUTH_URL}/auth/${resetPath}?token=${resetToken}">Complete Account Setup</a>
          <p>This link will expire in 15 minutes for security reasons.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>KhasiGPT Team</p>
        </div>
      `;
    } else {
      emailContent = `
        <div>
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${process.env.NEXTAUTH_URL}/auth/${resetPath}?token=${resetToken}">Reset Password</a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>KhasiGPT Team</p>
        </div>
      `;
    }

    // Send email
    const emailData = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "KhasiGPT"
      },
      to: [{
        email: email
      }],
      subject: emailSubject,
      htmlContent: emailContent
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
      { message: "If an account exists with this email, you will receive password reset instructions." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
} 