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

// GET /api/rubrics - Get all rubrics
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rubrics = await db.rubric.findMany({
      include: {
        questions: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ rubrics })
  } catch (error) {
    console.error("Error fetching rubrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/rubrics - Create new rubric
export async function POST(request: NextRequest) {
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

    // Create rubric with questions in a transaction
    const result = await db.$transaction(async (prisma) => {
      const rubric = await prisma.rubric.create({
        data: {
          nama
        }
      })

      const createdQuestions = await prisma.rubricQuestion.createMany({
        data: questions.map(q => ({
          rubricId: rubric.id,
          pertanyaan: q.pertanyaan,
          rangeMin: q.rangeMin,
          rangeMax: q.rangeMax
        }))
      })

      const rubricWithQuestions = await prisma.rubric.findUnique({
        where: { id: rubric.id },
        include: {
          questions: {
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      })

      return rubricWithQuestions
    })

    return NextResponse.json({
      message: "Rubric created successfully",
      rubric: result
    })
  } catch (error) {
    console.error("Error creating rubric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}