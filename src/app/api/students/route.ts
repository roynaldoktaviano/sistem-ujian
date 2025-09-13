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

// GET /api/students - Get all students
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const students = await db.student.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, nim, email, password } = await request.json()

    if (!nama || !nim || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Check if NIM already exists
    const existingStudent = await db.student.findUnique({
      where: { nim }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "NIM already exists" },
        { status: 400 }
      )
    }

    // Get examiner role (students will have examiner role for now)
    const examinerRole = await db.role.findUnique({
      where: { name: "penguji" }
    })

    if (!examinerRole) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 500 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and student in a transaction
    const result = await db.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: nama,
          roleId: examinerRole.id
        }
      })

      const student = await prisma.student.create({
        data: {
          nama,
          nim,
          userId: user.id
        },
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })

      return student
    })

    return NextResponse.json({
      message: "Student created successfully",
      student: result
    })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}