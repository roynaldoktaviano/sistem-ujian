"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Calendar, 
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Users,
  Grid3X3,
  Sparkles,
  Settings,
  Save
} from "lucide-react"

interface Exam {
  id: string
  nama: string
  tanggal: string
  tipe: "ujian_utama" | "ujian_ulangan"
  jumlahRuangan: number
  jumlahKategori: number
  createdAt: string
  rooms: ExamRoom[]
}

interface ExamRoom {
  id: string
  kode: string
  examId: string
  rubric?: {
    id: string
    nama: string
  }
  examiners: {
    id: string
    nama: string
    nipdn: string
  }[]
  createdAt: string
}

interface Rubric {
  id: string
  nama: string
  createdAt: string
}

interface Examiner {
  id: string
  nama: string
  nipdn: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

interface GeneratedRoom {
  kode: string
  rubricId?: string
  examinerIds: string[]
}

export default function ExamsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [examiners, setExaminers] = useState<Examiner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    tanggal: "",
    tipe: "ujian_utama" as "ujian_utama" | "ujian_ulangan",
    jumlahRuangan: 1,
    jumlahKategori: 1
  })
  const [generatedRooms, setGeneratedRooms] = useState<GeneratedRoom[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchExams()
      fetchRubrics()
      fetchExaminers()
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/exams", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data.exams)
      } else {
        setError("Failed to fetch exams")
      }
    } catch (error) {
      setError("An error occurred while fetching exams")
    } finally {
      setLoading(false)
    }
  }

  const fetchRubrics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/rubrics", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRubrics(data.rubrics)
      }
    } catch (error) {
      console.error("Error fetching rubrics:", error)
    }
  }

  const fetchExaminers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/examiners", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExaminers(data.examiners)
      }
    } catch (error) {
      console.error("Error fetching examiners:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const url = editingExam ? `/api/exams/${editingExam.id}` : "/api/exams"
      const method = editingExam ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingExam ? "Exam updated successfully" : "Exam created successfully")
        setIsDialogOpen(false)
        setFormData({
          nama: "",
          tanggal: "",
          tipe: "ujian_utama",
          jumlahRuangan: 1,
          jumlahKategori: 1
        })
        setEditingExam(null)
        fetchExams()
      } else {
        setError(data.error || "Failed to save exam")
      }
    } catch (error) {
      setError("An error occurred while saving exam")
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam)
    setFormData({
      nama: exam.nama,
      tanggal: new Date(exam.tanggal).toISOString().split('T')[0],
      tipe: exam.tipe,
      jumlahRuangan: exam.jumlahRuangan,
      jumlahKategori: exam.jumlahKategori
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess("Exam deleted successfully")
        fetchExams()
      } else {
        setError("Failed to delete exam")
      }
    } catch (error) {
      setError("An error occurred while deleting exam")
    }
  }

  const generateRooms = () => {
    const { jumlahRuangan, jumlahKategori } = formData
    const rooms: GeneratedRoom[] = []
    
    for (let category = 0; category < jumlahKategori; category++) {
      const categoryLetter = String.fromCharCode(65 + category) // A, B, C, etc.
      
      for (let room = 1; room <= jumlahRuangan; room++) {
        rooms.push({
          kode: `${categoryLetter}${room}`,
          examinerIds: []
        })
      }
    }
    
    setGeneratedRooms(rooms)
  }

  const handleAssignRooms = (exam: Exam) => {
    setSelectedExam(exam)
    
    // Initialize generated rooms based on existing rooms or create new ones
    if (exam.rooms && exam.rooms.length > 0) {
      const rooms: GeneratedRoom[] = exam.rooms.map(room => ({
        kode: room.kode,
        rubricId: room.rubric?.id,
        examinerIds: room.examiners.map(e => e.id)
      }))
      setGeneratedRooms(rooms)
    } else {
      // Generate new rooms
      const rooms: GeneratedRoom[] = []
      for (let category = 0; category < exam.jumlahKategori; category++) {
        const categoryLetter = String.fromCharCode(65 + category)
        
        for (let room = 1; room <= exam.jumlahRuangan; room++) {
          rooms.push({
            kode: `${categoryLetter}${room}`,
            examinerIds: []
          })
        }
      }
      setGeneratedRooms(rooms)
    }
    
    setIsAssignDialogOpen(true)
  }

  const handleRoomAssignment = async () => {
    if (!selectedExam) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/exams/${selectedExam.id}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rooms: generatedRooms })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Rooms assigned successfully")
        setIsAssignDialogOpen(false)
        setSelectedExam(null)
        setGeneratedRooms([])
        fetchExams()
      } else {
        setError(data.error || "Failed to assign rooms")
      }
    } catch (error) {
      setError("An error occurred while assigning rooms")
    }
  }

  const updateRoomRubric = (roomIndex: number, rubricId: string) => {
    const newRooms = [...generatedRooms]
    newRooms[roomIndex].rubricId = rubricId
    setGeneratedRooms(newRooms)
  }

  const updateRoomExaminers = (roomIndex: number, examinerId: string, isChecked: boolean) => {
    const newRooms = [...generatedRooms]
    if (isChecked) {
      if (!newRooms[roomIndex].examinerIds.includes(examinerId)) {
        newRooms[roomIndex].examinerIds.push(examinerId)
      }
    } else {
      newRooms[roomIndex].examinerIds = newRooms[roomIndex].examinerIds.filter(id => id !== examinerId)
    }
    setGeneratedRooms(newRooms)
  }

  const filteredExams = exams.filter(exam =>
    exam.nama.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Exams Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {exams.length} exams
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Exam</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? "Edit Exam" : "Add New Exam"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExam ? "Update exam information" : "Create a new exam with room and category settings"}
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
                        value={formData.jumlahKategori}
                        onChange={(e) => setFormData({ ...formData, jumlahKategori: parseInt(e.target.value) })}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingExam ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Exams Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Exams List</span>
              </CardTitle>
              <CardDescription>
                Manage all exams in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading exams...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rooms/Categories</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{exam.nama}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(exam.tanggal).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exam.tipe === "ujian_utama" ? "default" : "secondary"}>
                            {exam.tipe === "ujian_utama" ? "Main Exam" : "Retake Exam"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Grid3X3 className="h-4 w-4 text-gray-400" />
                            <span>{exam.jumlahRuangan} rooms, {exam.jumlahKategori} categories</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(exam.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignRooms(exam)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(exam)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(exam.id)}
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
        </div>
      </main>

      {/* Room Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Examiners and Rubrics to Rooms</DialogTitle>
            <DialogDescription>
              Assign examiners and rubrics to each generated room for exam: {selectedExam?.nama}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {generatedRooms.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No rooms generated yet</p>
                <Button onClick={generateRooms} className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Rooms</span>
                </Button>
              </div>
            )}
            
            {generatedRooms.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedRooms.map((room, index) => (
                    <Card key={room.kode} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Room {room.kode}</h3>
                          <Badge variant="outline">{room.kode}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Rubric</Label>
                          <Select
                            value={room.rubricId || ""}
                            onValueChange={(value) => updateRoomRubric(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select rubric" />
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
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Examiners</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {examiners.map((examiner) => (
                              <div key={examiner.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`examiner-${room.kode}-${examiner.id}`}
                                  checked={room.examinerIds.includes(examiner.id)}
                                  onChange={(e) => updateRoomExaminers(index, examiner.id, e.target.checked)}
                                  className="rounded"
                                />
                                <Label htmlFor={`examiner-${room.kode}-${examiner.id}`} className="text-sm">
                                  {examiner.nama} ({examiner.nipdn})
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRoomAssignment} className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Save Assignments</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}