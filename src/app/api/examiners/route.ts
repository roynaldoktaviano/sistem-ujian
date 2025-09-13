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

// GET /api/examiners - Get all examiners
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const examiners = await db.examiner.findMany({
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

    return NextResponse.json({ examiners })
  } catch (error) {
    console.error("Error fetching examiners:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/examiners - Create new examiner
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, nipdn, email, password } = await request.json()

    if (!nama || !nipdn || !email || !password) {
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

    // Check if NIPDN already exists
    const existingExaminer = await db.examiner.findUnique({
      where: { nipdn }
    })

    if (existingExaminer) {
      return NextResponse.json(
        { error: "NIPDN already exists" },
        { status: 400 }
      )
    }

    // Get examiner role
    const examinerRole = await db.role.findUnique({
      where: { name: "penguji" }
    })

    if (!examinerRole) {
      return NextResponse.json(
        { error: "Examiner role not found" },
        { status: 500 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and examiner in a transaction
    const result = await db.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: nama,
          roleId: examinerRole.id
        }
      })

      const examiner = await prisma.examiner.create({
        data: {
          nama,
          nipdn,
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

      return examiner
    })

    return NextResponse.json({
      message: "Examiner created successfully",
      examiner: result
    })
  } catch (error) {
    console.error("Error creating examiner:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}