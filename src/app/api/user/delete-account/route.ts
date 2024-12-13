import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/auth";

const prisma = new PrismaClient();

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 }
      );
    }

    // Check if already deleted
    const deletedCheck = await prisma.user.findFirst({
      where: {
        id: user.id,
        OR: [
          { isDeleted: true },
          { deletedAt: { not: null } }
        ]
      }
    });

    if (deletedCheck) {
      return NextResponse.json(
        { message: "Account already deleted" },
        { status: 404 }
      );
    }

    // Soft delete the user - only update deletion flags
    const updatedUser = await prisma.user.update({
      where: { 
        id: user.id
      },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${session.user.email}`, // Prevent email reuse with timestamp
      },
    });

    // Delete sessions to prevent further access
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { message: "Error deleting account" },
      { status: 500 }
    );
  }
} 