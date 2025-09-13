import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      permissions: JSON.stringify([
        'create_exam',
        'create_rubrik',
        'create_examiner',
        'create_student',
        'generate_rooms'
      ])
    }
  })

  const examinerRole = await prisma.role.create({
    data: {
      name: 'penguji',
      permissions: JSON.stringify([
        'view_exam',
        'evaluate_student'
      ])
    }
  })

  console.log('Roles created:', { adminRole, examinerRole })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      roleId: adminRole.id
    }
  })

  console.log('Admin user created:', { email: adminUser.email, name: adminUser.name })

  // Create sample examiners
  const examiner1 = await prisma.examiner.create({
    data: {
      nama: 'Dr. Andi Wijaya',
      nipdn: '198203152021011001',
      user: {
        create: {
          email: 'andi.wijaya@example.com',
          password: await bcrypt.hash('examiner123', 12),
          name: 'Dr. Andi Wijaya',
          roleId: examinerRole.id
        }
      }
    }
  })

  const examiner2 = await prisma.examiner.create({
    data: {
      nama: 'Prof. Budi Santoso',
      nipdn: '197605182019021002',
      user: {
        create: {
          email: 'budi.santoso@example.com',
          password: await bcrypt.hash('examiner123', 12),
          name: 'Prof. Budi Santoso',
          roleId: examinerRole.id
        }
      }
    }
  })

  console.log('Examiners created:', { examiner1, examiner2 })

  // Create sample students
  const student1 = await prisma.student.create({
    data: {
      nim: '2201001',
      nama: 'Roynald Oktaviano',
      user: {
        create: {
          email: 'roynald@example.com',
          password: await bcrypt.hash('student123', 12),
          name: 'Roynald Oktaviano',
          roleId: examinerRole.id
        }
      }
    }
  })

  const student2 = await prisma.student.create({
    data: {
      nim: '2201002',
      nama: 'Siti Aminah',
      user: {
        create: {
          email: 'siti.aminah@example.com',
          password: await bcrypt.hash('student123', 12),
          name: 'Siti Aminah',
          roleId: examinerRole.id
        }
      }
    }
  })

  console.log('Students created:', { student1, student2 })

  // Create sample rubric
  const rubric = await prisma.rubric.create({
    data: {
      nama: 'Presentasi Tugas Akhir',
      questions: {
        create: [
          {
            pertanyaan: 'Penguasaan Materi',
            rangeMin: 0,
            rangeMax: 1
          },
          {
            pertanyaan: 'Penyampaian & Bahasa',
            rangeMin: 0,
            rangeMax: 4
          },
          {
            pertanyaan: 'Argumentasi & Diskusi',
            rangeMin: 0,
            rangeMax: 7
          }
        ]
      }
    }
  })

  console.log('Rubric created:', rubric)

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })