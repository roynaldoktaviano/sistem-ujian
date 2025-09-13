import { NextRequest, NextResponse } from "next/server"
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

// GET /api/exams - Get all exams
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exams = await db.exam.findMany({
      include: {
        rooms: {
          include: {
            rubric: true,
            examiners: true
          },
          orderBy: {
            kode: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ exams })
  } catch (error) {
    console.error("Error fetching exams:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/exams - Create new exam
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, tanggal, tipe, jumlahRuangan, jumlahKategori } = await request.json()

    if (!nama || !tanggal || !tipe || !jumlahRuangan || !jumlahKategori) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (jumlahRuangan < 1 || jumlahKategori < 1) {
      return NextResponse.json(
        { error: "Number of rooms and categories must be at least 1" },
        { status: 400 }
      )
    }

    const exam = await db.exam.create({
      data: {
        nama,
        tanggal: new Date(tanggal),
        tipe,
        jumlahRuangan,
        jumlahKategori
      },
      include: {
        rooms: {
          include: {
            rubric: true,
            examiners: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Exam created successfully",
      exam
    })
  } catch (error) {
    console.error("Error creating exam:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}