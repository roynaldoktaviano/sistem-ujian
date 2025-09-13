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

// GET /api/exams/[id] - Get single exam
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exam = await db.exam.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error("Error fetching exam:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/exams/[id] - Update exam
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if exam exists
    const existingExam = await db.exam.findUnique({
      where: { id: params.id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      )
    }

    const updatedExam = await db.exam.update({
      where: { id: params.id },
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
      message: "Exam updated successfully",
      exam: updatedExam
    })
  } catch (error) {
    console.error("Error updating exam:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/exams/[id] - Delete exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if exam exists
    const existingExam = await db.exam.findUnique({
      where: { id: params.id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      )
    }

    // Delete exam and its rooms in a transaction
    await db.$transaction(async (prisma) => {
      // Delete exam rooms (this will also remove examiner relationships due to cascade)
      await prisma.examRoom.deleteMany({
        where: { examId: params.id }
      })

      // Delete exam
      await prisma.exam.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({
      message: "Exam deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting exam:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}