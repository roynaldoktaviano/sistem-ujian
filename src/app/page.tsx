"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  Menu,
  X,
  BookOpen,
  UserCheck,
  GraduationCap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Rubric {
  id: string
  nama: string
  questions: Array<{
    id: string
    pertanyaan: string
    rangeMin: number
    rangeMax: number
  }>
}

interface Examiner {
  id: string
  nama: string
  nipdn: string
}

interface Student {
  id: string
  nim: string
  nama: string
}

interface ExamRoom {
  id: string
  kode: string
  rubric?: Rubric
  examiner?: Examiner
  students: Student[]
}

interface Exam {
  id: string
  nama: string
  tanggal: string
  tipe: "ujian_utama" | "ujian_ulangan"
  jumlahRuangan: number
  jumlahKategori: number
  rooms: ExamRoom[]
}

export default function Home() {
  const [exams, setExams] = useState<Exam[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([
    {
      id: "1",
      nama: "Presentasi Tugas Akhir",
      questions: [
        { id: "1", pertanyaan: "Penguasaan Materi", rangeMin: 0, rangeMax: 1 },
        { id: "2", pertanyaan: "Penyampaian & Bahasa", rangeMin: 0, rangeMax: 4 },
        { id: "3", pertanyaan: "Argumentasi & Diskusi", rangeMin: 0, rangeMax: 7 }
      ]
    }
  ])
  
  const [examiners, setExaminers] = useState<Examiner[]>([
    { id: "1", nama: "Dr. Andi Wijaya", nipdn: "198203152021011001" },
    { id: "2", nama: "Prof. Budi Santoso", nipdn: "197605182019021002" }
  ])

  const [students, setStudents] = useState<Student[]>([
    { id: "1", nim: "2201001", nama: "Roynald Oktaviano" },
    { id: "2", nim: "2201002", nama: "Siti Aminah" }
  ])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState("dashboard")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedExamForPlotting, setSelectedExamForPlotting] = useState<Exam | null>(null)
  const [studentAssignments, setStudentAssignments] = useState<{[roomId: string]: string[]}>({})
  const [formData, setFormData] = useState({
    nama: "",
    tanggal: "",
    tipe: "ujian_utama" as "ujian_utama" | "ujian_ulangan",
    jumlahRuangan: 0,
    jumlahKategori: 0
  })
  const [roomAssignments, setRoomAssignments] = useState<{[key: string]: {rubricId: string, examinerId: string}}>({})
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Form states for adding items
  const [rubricForm, setRubricForm] = useState({
    nama: "",
    questions: [
      { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
    ]
  })
  
  const [examinerForm, setExaminerForm] = useState({
    nama: "",
    nipdn: ""
  })
  
  const [studentForm, setStudentForm] = useState({
    nim: "",
    nama: ""
  })

  // Edit states
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null)
  const [editingExaminer, setEditingExaminer] = useState<Examiner | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isRubricDialogOpen, setIsRubricDialogOpen] = useState(false)
  const [isExaminerDialogOpen, setIsExaminerDialogOpen] = useState(false)
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false)
  const [isPlotStudentsDialogOpen, setIsPlotStudentsDialogOpen] = useState(false)

  const generateRooms = (jumlahRuangan: number, jumlahKategori: number) => {
    const rooms = []
    const categories = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, jumlahKategori)
    
    for (const category of categories) {
      for (let i = 1; i <= jumlahRuangan; i++) {
        rooms.push({
          id: `${category}${i}`,
          kode: `${category}${i}`,
          rubric: undefined,
          examiner: undefined,
          students: []
        })
      }
    }
    
    return rooms
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.nama || !formData.tanggal || formData.jumlahRuangan <= 0 || formData.jumlahKategori <= 0) {
      setError("All fields are required and must be valid")
      return
    }

    const rooms = generateRooms(formData.jumlahRuangan, formData.jumlahKategori)
    
    const newExam: Exam = {
      id: Date.now().toString(),
      nama: formData.nama,
      tanggal: formData.tanggal,
      tipe: formData.tipe,
      jumlahRuangan: formData.jumlahRuangan,
      jumlahKategori: formData.jumlahKategori,
      rooms
    }

    setExams([...exams, newExam])
    setSuccess("Exam created successfully!")
    setIsDialogOpen(false)
    setFormData({
      nama: "",
      tanggal: "",
      tipe: "ujian_utama",
      jumlahRuangan: 0,
      jumlahKategori: 0
    })
  }

  const handleRoomAssignment = () => {
    if (!selectedExam) return

    const updatedExams = exams.map(exam => {
      if (exam.id === selectedExam.id) {
        const updatedRooms = exam.rooms.map(room => {
          const assignment = roomAssignments[room.id]
          if (assignment) {
            return {
              ...room,
              rubric: rubrics.find(r => r.id === assignment.rubricId),
              examiner: examiners.find(e => e.id === assignment.examinerId)
            }
          }
          return room
        })
        return { ...exam, rooms: updatedRooms }
      }
      return exam
    })

    setExams(updatedExams)
    setSuccess("Room assignments saved successfully!")
    setIsRoomDialogOpen(false)
    setRoomAssignments({})
  }

  const openRoomAssignment = (exam: Exam) => {
    setSelectedExam(exam)
    const initialAssignments: {[key: string]: {rubricId: string, examinerId: string}} = {}
    
    exam.rooms.forEach(room => {
      initialAssignments[room.id] = {
        rubricId: room.rubric?.id || "",
        examinerId: room.examiner?.id || ""
      }
    })
    
    setRoomAssignments(initialAssignments)
    setIsRoomDialogOpen(true)
  }

  const openPlotStudentsDialog = (exam: Exam) => {
    setSelectedExamForPlotting(exam)
    const initialStudentAssignments: {[roomId: string]: string[]} = {}
    
    exam.rooms.forEach(room => {
      initialStudentAssignments[room.id] = room.students.map(student => student.id)
    })
    
    setStudentAssignments(initialStudentAssignments)
    setIsPlotStudentsDialogOpen(true)
  }

  const toggleStudentAssignment = (roomId: string, studentId: string) => {
    setStudentAssignments(prev => {
      const current = prev[roomId] || []
      const updated = current.includes(studentId) 
        ? current.filter(id => id !== studentId)
        : [...current, studentId]
      
      // Remove student from all other rooms (one student per room rule)
      const newAssignments = { ...prev }
      Object.keys(newAssignments).forEach(roomIdKey => {
        if (roomIdKey !== roomId) {
          newAssignments[roomIdKey] = (newAssignments[roomIdKey] || []).filter(id => id !== studentId)
        }
      })
      
      newAssignments[roomId] = updated
      
      return newAssignments
    })
  }

  const handlePlotStudents = () => {
    if (!selectedExamForPlotting) return

    const updatedExams = exams.map(exam => {
      if (exam.id === selectedExamForPlotting.id) {
        const updatedRooms = exam.rooms.map(room => {
          const assignedStudentIds = studentAssignments[room.id] || []
          const assignedStudents = students.filter(student => 
            assignedStudentIds.includes(student.id)
          )
          
          return {
            ...room,
            students: assignedStudents
          }
        })
        return { ...exam, rooms: updatedRooms }
      }
      return exam
    })

    setExams(updatedExams)
    setSuccess("Student assignments saved successfully!")
    setIsPlotStudentsDialogOpen(false)
    setStudentAssignments({})
  }

  const updateRoomAssignment = (roomId: string, field: string, value: string) => {
    setRoomAssignments(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [field]: value
      }
    }))
  }

  // Rubric management
  const addRubricQuestion = () => {
    setRubricForm({
      ...rubricForm,
      questions: [
        ...rubricForm.questions,
        { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
      ]
    })
  }

  const removeRubricQuestion = (index: number) => {
    if (rubricForm.questions.length > 1) {
      const newQuestions = [...rubricForm.questions]
      newQuestions.splice(index, 1)
      setRubricForm({
        ...rubricForm,
        questions: newQuestions
      })
    }
  }

  const updateRubricQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...rubricForm.questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    }
    setRubricForm({
      ...rubricForm,
      questions: newQuestions
    })
  }

  const handleAddRubric = () => {
    if (!rubricForm.nama || rubricForm.questions.some(q => !q.pertanyaan)) {
      setError("Rubric name and all questions are required")
      return
    }

    if (editingRubric) {
      // Update existing rubric
      const updatedRubrics = rubrics.map(rubric => {
        if (rubric.id === editingRubric.id) {
          return {
            ...rubric,
            nama: rubricForm.nama,
            questions: rubricForm.questions.map((q, index) => ({
              id: q.id || `${Date.now()}-${index}`,
              pertanyaan: q.pertanyaan,
              rangeMin: q.rangeMin,
              rangeMax: q.rangeMax
            }))
          }
        }
        return rubric
      })
      setRubrics(updatedRubrics)
      setSuccess("Rubric updated successfully!")
      setEditingRubric(null)
    } else {
      // Add new rubric
      const newRubric: Rubric = {
        id: Date.now().toString(),
        nama: rubricForm.nama,
        questions: rubricForm.questions.map((q, index) => ({
          id: `${Date.now()}-${index}`,
          pertanyaan: q.pertanyaan,
          rangeMin: q.rangeMin,
          rangeMax: q.rangeMax
        }))
      }
      setRubrics([...rubrics, newRubric])
      setSuccess("Rubric added successfully!")
    }

    setRubricForm({
      nama: "",
      questions: [
        { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
      ]
    })
    setIsRubricDialogOpen(false)
  }

  const handleEditRubric = (rubric: Rubric) => {
    setEditingRubric(rubric)
    setRubricForm({
      nama: rubric.nama,
      questions: rubric.questions.map(q => ({
        pertanyaan: q.pertanyaan,
        rangeMin: q.rangeMin,
        rangeMax: q.rangeMax
      }))
    })
    setIsRubricDialogOpen(true)
  }

  const handleDeleteRubric = (id: string) => {
    if (!confirm("Are you sure you want to delete this rubric?")) return
    
    setRubrics(rubrics.filter(rubric => rubric.id !== id))
    setSuccess("Rubric deleted successfully!")
  }

  const openAddRubricDialog = () => {
    setEditingRubric(null)
    setRubricForm({
      nama: "",
      questions: [
        { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
      ]
    })
    setIsRubricDialogOpen(true)
  }

  const handleAddExaminer = () => {
    if (!examinerForm.nama || !examinerForm.nipdn) {
      setError("Examiner name and NIPDN are required")
      return
    }

    if (editingExaminer) {
      // Update existing examiner
      const updatedExaminers = examiners.map(examiner => {
        if (examiner.id === editingExaminer.id) {
          return {
            ...examiner,
            nama: examinerForm.nama,
            nipdn: examinerForm.nipdn
          }
        }
        return examiner
      })
      setExaminers(updatedExaminers)
      setSuccess("Examiner updated successfully!")
      setEditingExaminer(null)
    } else {
      // Add new examiner
      const newExaminer: Examiner = {
        id: Date.now().toString(),
        nama: examinerForm.nama,
        nipdn: examinerForm.nipdn
      }
      setExaminers([...examiners, newExaminer])
      setSuccess("Examiner added successfully!")
    }

    setExaminerForm({ nama: "", nipdn: "" })
    setIsExaminerDialogOpen(false)
  }

  const handleEditExaminer = (examiner: Examiner) => {
    setEditingExaminer(examiner)
    setExaminerForm({
      nama: examiner.nama,
      nipdn: examiner.nipdn
    })
    setIsExaminerDialogOpen(true)
  }

  const handleDeleteExaminer = (id: string) => {
    if (!confirm("Are you sure you want to delete this examiner?")) return
    
    setExaminers(examiners.filter(examiner => examiner.id !== id))
    setSuccess("Examiner deleted successfully!")
  }

  const openAddExaminerDialog = () => {
    setEditingExaminer(null)
    setExaminerForm({ nama: "", nipdn: "" })
    setIsExaminerDialogOpen(true)
  }

  const handleAddStudent = () => {
    if (!studentForm.nama || !studentForm.nim) {
      setError("Student name and NIM are required")
      return
    }

    if (editingStudent) {
      // Update existing student
      const updatedStudents = students.map(student => {
        if (student.id === editingStudent.id) {
          return {
            ...student,
            nama: studentForm.nama,
            nim: studentForm.nim
          }
        }
        return student
      })
      setStudents(updatedStudents)
      setSuccess("Student updated successfully!")
      setEditingStudent(null)
    } else {
      // Add new student
      const newStudent: Student = {
        id: Date.now().toString(),
        nim: studentForm.nim,
        nama: studentForm.nama
      }
      setStudents([...students, newStudent])
      setSuccess("Student added successfully!")
    }

    setStudentForm({ nim: "", nama: "" })
    setIsStudentDialogOpen(false)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setStudentForm({
      nim: student.nim,
      nama: student.nama
    })
    setIsStudentDialogOpen(true)
  }

  const handleDeleteStudent = (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return
    
    setStudents(students.filter(student => student.id !== id))
    setSuccess("Student deleted successfully!")
  }

  const openAddStudentDialog = () => {
    setEditingStudent(null)
    setStudentForm({ nim: "", nama: "" })
    setIsStudentDialogOpen(true)
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              Active exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rubrics</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rubrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Available rubrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Examiners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examiners.length}</div>
            <p className="text-xs text-muted-foreground">
              Active examiners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Exams List</span>
              </CardTitle>
              <CardDescription>
                Manage all exams and their room assignments
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Exam</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Exam</DialogTitle>
                  <DialogDescription>
                    Set up a new exam with rooms and categories
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nama" className="text-right">
                        Exam Name
                      </Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tanggal" className="text-right">
                        Date
                      </Label>
                      <Input
                        id="tanggal"
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Type</Label>
                      <RadioGroup
                        value={formData.tipe}
                        onValueChange={(value) => setFormData({ ...formData, tipe: value as "ujian_utama" | "ujian_ulangan" })}
                        className="col-span-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ujian_utama" id="ujian_utama" />
                          <Label htmlFor="ujian_utama">Main Exam</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ujian_ulangan" id="ujian_ulangan" />
                          <Label htmlFor="ujian_ulangan">Retake Exam</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="jumlahRuangan" className="text-right">
                        Rooms
                      </Label>
                      <Input
                        id="jumlahRuangan"
                        type="number"
                        min="1"
                        value={formData.jumlahRuangan}
                        onChange={(e) => setFormData({ ...formData, jumlahRuangan: parseInt(e.target.value) })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="jumlahKategori" className="text-right">
                        Categories
                      </Label>
                      <Input
                        id="jumlahKategori"
                        type="number"
                        min="1"
                        max="26"
                        value={formData.jumlahKategori}
                        onChange={(e) => setFormData({ ...formData, jumlahKategori: parseInt(e.target.value) })}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Exam</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams yet</h3>
              <p className="text-gray-500 mb-4">Create your first exam to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{exam.nama}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline">
                          {exam.tipe === "ujian_utama" ? "Main Exam" : "Retake Exam"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(exam.tanggal).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {exam.jumlahRuangan} rooms × {exam.jumlahKategori} categories
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => openRoomAssignment(exam)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Assign Rooms
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openPlotStudentsDialog(exam)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Plot Students
                      </Button>
                    </div>
                  </div>

                  {/* Rooms Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exam.rooms.map((room) => (
                      <Card key={room.id} className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">{room.kode}</Badge>
                          {room.rubric && room.examiner && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        
                        {room.rubric && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Rubric:</p>
                            <p className="text-sm font-medium">{room.rubric.nama}</p>
                          </div>
                        )}
                        
                        {room.examiner && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Examiner:</p>
                            <p className="text-sm">{room.examiner.nama}</p>
                          </div>
                        )}

                        {room.students.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Students ({room.students.length}):</p>
                            <div className="max-h-20 overflow-y-auto">
                              {room.students.map((student) => (
                                <p key={student.id} className="text-xs">
                                  {student.nim} - {student.nama}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!room.rubric && !room.examiner && room.students.length === 0 && (
                          <p className="text-xs text-gray-400 italic">
                            Not assigned yet
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderRubrics = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Rubrics Management</span>
            </CardTitle>
            <CardDescription>
              Manage all rubrics in the system
            </CardDescription>
          </div>
          <Dialog open={isRubricDialogOpen} onOpenChange={setIsRubricDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddRubricDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Rubric</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRubric ? "Edit Rubric" : "Add New Rubric"}
                </DialogTitle>
                <DialogDescription>
                  {editingRubric ? "Update rubric information" : "Create a new rubric with questions"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rubricNama">Rubric Name</Label>
                  <Input
                    id="rubricNama"
                    value={rubricForm.nama}
                    onChange={(e) => setRubricForm({ ...rubricForm, nama: e.target.value })}
                    placeholder="Enter rubric name"
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Questions</Label>
                  {rubricForm.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Question {index + 1}</span>
                        {rubricForm.questions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRubricQuestion(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label>Question</Label>
                          <Input
                            value={question.pertanyaan}
                            onChange={(e) => updateRubricQuestion(index, "pertanyaan", e.target.value)}
                            placeholder="Enter question"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Min Score</Label>
                            <Input
                              type="number"
                              value={question.rangeMin}
                              onChange={(e) => updateRubricQuestion(index, "rangeMin", parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Max Score</Label>
                            <Input
                              type="number"
                              value={question.rangeMax}
                              onChange={(e) => updateRubricQuestion(index, "rangeMax", parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRubricQuestion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                
                <Button onClick={handleAddRubric} className="w-full">
                  {editingRubric ? "Update Rubric" : "Add Rubric"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {rubrics.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rubrics yet</h3>
            <p className="text-gray-500 mb-4">Create your first rubric to get started</p>
            <Button onClick={openAddRubricDialog}>Add Rubric</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rubrics.map((rubric) => (
              <Card key={rubric.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{rubric.nama}</h4>
                      <p className="text-sm text-gray-500">{rubric.questions.length} questions</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRubric(rubric)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRubric(rubric.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {rubric.questions.map((q, index) => (
                      <div key={q.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium">{index + 1}. {q.pertanyaan}</span>
                        <Badge variant="outline">
                          {q.rangeMin}-{q.rangeMax}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderExaminers = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Examiners Management</span>
            </CardTitle>
            <CardDescription>
              Manage all examiners in the system
            </CardDescription>
          </div>
          <Dialog open={isExaminerDialogOpen} onOpenChange={setIsExaminerDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddExaminerDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Examiner</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingExaminer ? "Edit Examiner" : "Add New Examiner"}
                </DialogTitle>
                <DialogDescription>
                  {editingExaminer ? "Update examiner information" : "Create a new examiner account"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="examinerNama">Name</Label>
                  <Input
                    id="examinerNama"
                    value={examinerForm.nama}
                    onChange={(e) => setExaminerForm({ ...examinerForm, nama: e.target.value })}
                    placeholder="Enter examiner name"
                  />
                </div>
                <div>
                  <Label htmlFor="examinerNipdn">NIPDN</Label>
                  <Input
                    id="examinerNipdn"
                    value={examinerForm.nipdn}
                    onChange={(e) => setExaminerForm({ ...examinerForm, nipdn: e.target.value })}
                    placeholder="Enter NIPDN"
                  />
                </div>
                <Button onClick={handleAddExaminer} className="w-full">
                  {editingExaminer ? "Update Examiner" : "Add Examiner"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {examiners.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No examiners yet</h3>
            <p className="text-gray-500 mb-4">Create your first examiner to get started</p>
            <Button onClick={openAddExaminerDialog}>Add Examiner</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>NIPDN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examiners.map((examiner) => (
                <TableRow key={examiner.id}>
                  <TableCell className="font-medium">{examiner.nama}</TableCell>
                  <TableCell>{examiner.nipdn}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExaminer(examiner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExaminer(examiner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  const renderStudents = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Students Management</span>
            </CardTitle>
            <CardDescription>
              Manage all students in the system
            </CardDescription>
          </div>
          <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddStudentDialog} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Update student information" : "Create a new student account"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentNama">Name</Label>
                  <Input
                    id="studentNama"
                    value={studentForm.nama}
                    onChange={(e) => setStudentForm({ ...studentForm, nama: e.target.value })}
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <Label htmlFor="studentNim">NIM</Label>
                  <Input
                    id="studentNim"
                    value={studentForm.nim}
                    onChange={(e) => setStudentForm({ ...studentForm, nim: e.target.value })}
                    placeholder="Enter NIM"
                  />
                </div>
                <Button onClick={handleAddStudent} className="w-full">
                  {editingStudent ? "Update Student" : "Add Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-500 mb-4">Create your first student to get started</p>
            <Button onClick={openAddStudentDialog}>Add Student</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIM</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.nim}</TableCell>
                  <TableCell>{student.nama}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-semibold text-gray-900">
            Exam Management
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <button
              onClick={() => { setActiveView("dashboard"); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeView === "dashboard"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            
            <button
              onClick={() => { setActiveView("rubrics"); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeView === "rubrics"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <FileText className="mr-3 h-5 w-5" />
              Rubrics
            </button>
            
            <button
              onClick={() => { setActiveView("examiners"); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeView === "examiners"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <UserCheck className="mr-3 h-5 w-5" />
              Examiners
            </button>
            
            <button
              onClick={() => { setActiveView("students"); setSidebarOpen(false) }}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeView === "students"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <GraduationCap className="mr-3 h-5 w-5" />
              Students
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Exam Management System
            </h1>
            <div></div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">
                Exam Management System
              </h1>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {activeView === "dashboard" && renderDashboard()}
            {activeView === "rubrics" && renderRubrics()}
            {activeView === "examiners" && renderExaminers()}
            {activeView === "students" && renderStudents()}
          </div>
        </main>
      </div>

      {/* Room Assignment Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Examiners and Rubrics to Rooms</DialogTitle>
            <DialogDescription>
              Assign examiner and rubric to each generated room
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-6">
              {selectedExam.rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Room {room.kode}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Rubric</Label>
                      <Select
                        value={roomAssignments[room.id]?.rubricId || ""}
                        onValueChange={(value) => updateRoomAssignment(room.id, 'rubricId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rubric" />
                        </SelectTrigger>
                        <SelectContent>
                          {rubrics.map((rubric) => (
                            <SelectItem key={rubric.id} value={rubric.id}>
                              {rubric.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Examiner</Label>
                      <Select
                        value={roomAssignments[room.id]?.examinerId || ""}
                        onValueChange={(value) => updateRoomAssignment(room.id, 'examinerId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an examiner" />
                        </SelectTrigger>
                        <SelectContent>
                          {examiners.map((examiner) => (
                            <SelectItem key={examiner.id} value={examiner.id}>
                              {examiner.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleRoomAssignment}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plot Students Dialog */}
      <Dialog open={isPlotStudentsDialogOpen} onOpenChange={setIsPlotStudentsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plot Students to Rooms</DialogTitle>
            <DialogDescription>
              Assign students to each room for the exam. Each student can only be assigned to one room.
            </DialogDescription>
          </DialogHeader>
          
          {selectedExamForPlotting && (
            <div className="space-y-6">
              {/* Summary of assigned students */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Assignment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedExamForPlotting.rooms.map((room) => (
                    <div key={room.id} className="text-center">
                      <div className="font-medium">{room.kode}</div>
                      <div className="text-sm text-gray-600">
                        {(studentAssignments[room.id] || []).length} students
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExamForPlotting.rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Room {room.kode}</h4>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Students ({(studentAssignments[room.id] || []).length} assigned)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                      {students.map((student) => {
                        const isAssignedToThisRoom = (studentAssignments[room.id] || []).includes(student.id)
                        const isAssignedToOtherRoom = Object.entries(studentAssignments)
                          .some(([roomIdKey, studentIds]) => 
                            roomIdKey !== room.id && studentIds.includes(student.id)
                          )
                        const assignedRoom = Object.entries(studentAssignments)
                          .find(([roomIdKey, studentIds]) => studentIds.includes(student.id))?.[0]

                        return (
                          <label 
                            key={student.id} 
                            className={cn(
                              "flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors",
                              isAssignedToThisRoom && "bg-blue-50 border-blue-200 border",
                              isAssignedToOtherRoom && "bg-gray-100 opacity-60",
                              !isAssignedToThisRoom && !isAssignedToOtherRoom && "hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isAssignedToThisRoom}
                              disabled={isAssignedToOtherRoom && !isAssignedToThisRoom}
                              onChange={() => toggleStudentAssignment(room.id, student.id)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{student.nama}</div>
                              <div className="text-xs text-gray-500">{student.nim}</div>
                              {isAssignedToOtherRoom && (
                                <div className="text-xs text-orange-600 font-medium">
                                  Assigned to Room {assignedRoom?.replace(room.id, '').charAt(0) || assignedRoom}
                                </div>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handlePlotStudents}>Save Student Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}