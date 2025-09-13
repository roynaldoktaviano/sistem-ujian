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

// GET /api/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const student = await db.student.findUnique({
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

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, nim, email, password } = await request.json()

    if (!nama || !nim || !email) {
      return NextResponse.json(
        { error: "Name, NIM, and email are required" },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await db.student.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Check if email is already used by another user
    if (email !== existingStudent.user.email) {
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

    // Check if NIM is already used by another student
    if (nim !== existingStudent.nim) {
      const nimExists = await db.student.findUnique({
        where: { nim }
      })

      if (nimExists) {
        return NextResponse.json(
          { error: "NIM already exists" },
          { status: 400 }
        )
      }
    }

    // Update student and user
    const updateData: any = {
      nama,
      nim,
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

    const updatedStudent = await db.student.update({
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
      message: "Student updated successfully",
      student: updatedStudent
    })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if student exists
    const existingStudent = await db.student.findUnique({
      where: { id: params.id }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Delete student and user in a transaction
    await db.$transaction(async (prisma) => {
      await prisma.student.delete({
        where: { id: params.id }
      })

      await prisma.user.delete({
        where: { id: existingStudent.userId }
      })
    })

    return NextResponse.json({
      message: "Student deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}