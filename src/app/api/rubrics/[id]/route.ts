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

// GET /api/rubrics/[id] - Get single rubric
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rubric = await db.rubric.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    })

    if (!rubric) {
      return NextResponse.json(
        { error: "Rubric not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ rubric })
  } catch (error) {
    console.error("Error fetching rubric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/rubrics/[id] - Update rubric
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, questions } = await request.json()

    if (!nama || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Rubric name and at least one question are required" },
        { status: 400 }
      )
    }

    // Validate questions
    for (const question of questions) {
      if (!question.pertanyaan || question.rangeMin === undefined || question.rangeMax === undefined) {
        return NextResponse.json(
          { error: "Each question must have pertanyaan, rangeMin, and rangeMax" },
          { status: 400 }
        )
      }
      if (question.rangeMin >= question.rangeMax) {
        return NextResponse.json(
          { error: "rangeMin must be less than rangeMax" },
          { status: 400 }
        )
      }
    }

    // Check if rubric exists
    const existingRubric = await db.rubric.findUnique({
      where: { id: params.id }
    })

    if (!existingRubric) {
      return NextResponse.json(
        { error: "Rubric not found" },
        { status: 404 }
      )
    }

    // Update rubric and questions in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Delete existing questions
      await prisma.rubricQuestion.deleteMany({
        where: { rubricId: params.id }
      })

      // Update rubric
      const updatedRubric = await prisma.rubric.update({
        where: { id: params.id },
        data: {
          nama
        }
      })

      // Create new questions
      await prisma.rubricQuestion.createMany({
        data: questions.map(q => ({
          rubricId: params.id,
          pertanyaan: q.pertanyaan,
          rangeMin: q.rangeMin,
          rangeMax: q.rangeMax
        }))
      })

      // Return updated rubric with questions
      return prisma.rubric.findUnique({
        where: { id: params.id },
        include: {
          questions: {
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      })
    })

    return NextResponse.json({
      message: "Rubric updated successfully",
      rubric: result
    })
  } catch (error) {
    console.error("Error updating rubric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/rubrics/[id] - Delete rubric
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if rubric exists
    const existingRubric = await db.rubric.findUnique({
      where: { id: params.id }
    })

    if (!existingRubric) {
      return NextResponse.json(
        { error: "Rubric not found" },
        { status: 404 }
      )
    }

    // Delete rubric and questions in a transaction
    await db.$transaction(async (prisma) => {
      await prisma.rubricQuestion.deleteMany({
        where: { rubricId: params.id }
      })

      await prisma.rubric.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({
      message: "Rubric deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting rubric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}