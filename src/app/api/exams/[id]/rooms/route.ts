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

interface RoomAssignment {
  kode: string
  rubricId?: string
  examinerIds: string[]
}

// POST /api/exams/[id]/rooms - Assign examiners and rubrics to rooms
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rooms }: { rooms: RoomAssignment[] } = await request.json()

    if (!rooms || !Array.isArray(rooms)) {
      return NextResponse.json(
        { error: "Rooms data is required and must be an array" },
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

    // Validate room codes and check for duplicates
    const roomCodes = rooms.map(r => r.kode)
    const uniqueRoomCodes = new Set(roomCodes)
    
    if (roomCodes.length !== uniqueRoomCodes.size) {
      return NextResponse.json(
        { error: "Duplicate room codes found" },
        { status: 400 }
      )
    }

    // Validate rubric IDs if provided
    if (rooms.some(r => r.rubricId)) {
      const rubricIds = rooms.filter(r => r.rubricId).map(r => r.rubricId)
      const existingRubrics = await db.rubric.findMany({
        where: { id: { in: rubricIds } }
      })

      if (existingRubrics.length !== rubricIds.length) {
        return NextResponse.json(
          { error: "One or more rubric IDs are invalid" },
          { status: 400 }
        )
      }
    }

    // Validate examiner IDs if provided
    if (rooms.some(r => r.examinerIds.length > 0)) {
      const allExaminerIds = rooms.flatMap(r => r.examinerIds)
      const uniqueExaminerIds = new Set(allExaminerIds)
      const existingExaminers = await db.examiner.findMany({
        where: { id: { in: Array.from(uniqueExaminerIds) } }
      })

      if (existingExaminers.length !== uniqueExaminerIds.size) {
        return NextResponse.json(
          { error: "One or more examiner IDs are invalid" },
          { status: 400 }
        )
      }
    }

    // Process room assignments in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Delete existing rooms for this exam
      await prisma.examRoom.deleteMany({
        where: { examId: params.id }
      })

      // Create new rooms with assignments
      const createdRooms = await Promise.all(
        rooms.map(async (room) => {
          const examRoom = await prisma.examRoom.create({
            data: {
              examId: params.id,
              kode: room.kode,
              rubricId: room.rubricId || null
            }
          })

          // Assign examiners to the room if any
          if (room.examinerIds.length > 0) {
            await prisma.examRoom.update({
              where: { id: examRoom.id },
              data: {
                examiners: {
                  connect: room.examinerIds.map(id => ({ id }))
                }
              }
            })
          }

          return prisma.examRoom.findUnique({
            where: { id: examRoom.id },
            include: {
              rubric: true,
              examiners: true
            }
          })
        })
      )

      return createdRooms
    })

    return NextResponse.json({
      message: "Room assignments saved successfully",
      rooms: result
    })
  } catch (error) {
    console.error("Error assigning rooms:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/exams/[id]/rooms - Get rooms for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rooms = await db.examRoom.findMany({
      where: { examId: params.id },
      include: {
        rubric: true,
        examiners: true
      },
      orderBy: {
        kode: "asc"
      }
    })

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("Error fetching exam rooms:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}