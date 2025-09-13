import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// GET /api/examiners/[id] - Get single examiner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const examiner = await db.examiner.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!examiner) {
      return NextResponse.json(
        { error: "Examiner not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ examiner })
  } catch (error) {
    console.error("Error fetching examiner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/examiners/[id] - Update examiner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, nipdn, email, password } = await request.json()

    if (!nama || !nipdn || !email) {
      return NextResponse.json(
        { error: "Name, NIPDN, and email are required" },
        { status: 400 }
      )
    }

    // Check if examiner exists
    const existingExaminer = await db.examiner.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!existingExaminer) {
      return NextResponse.json(
        { error: "Examiner not found" },
        { status: 404 }
      )
    }

    // Check if email is already used by another user
    if (email !== existingExaminer.user.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
    }

    // Check if NIPDN is already used by another examiner
    if (nipdn !== existingExaminer.nipdn) {
      const nipdnExists = await db.examiner.findUnique({
        where: { nipdn }
      })

      if (nipdnExists) {
        return NextResponse.json(
          { error: "NIPDN already exists" },
          { status: 400 }
        )
      }
    }

    // Update examiner and user
    const updateData: any = {
      nama,
      nipdn,
      user: {
        update: {
          email,
          name: nama
        }
      }
    }

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateData.user.update.password = hashedPassword
    }

    const updatedExaminer = await db.examiner.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Examiner updated successfully",
      examiner: updatedExaminer
    })
  } catch (error) {
    console.error("Error updating examiner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/examiners/[id] - Delete examiner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if examiner exists
    const existingExaminer = await db.examiner.findUnique({
      where: { id: params.id }
    })

    if (!existingExaminer) {
      return NextResponse.json(
        { error: "Examiner not found" },
        { status: 404 }
      )
    }

    // Delete examiner and user in a transaction
    await db.$transaction(async (prisma) => {
      await prisma.examiner.delete({
        where: { id: params.id }
      })

      await prisma.user.delete({
        where: { id: existingExaminer.userId }
      })
    })

    return NextResponse.json({
      message: "Examiner deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting examiner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}