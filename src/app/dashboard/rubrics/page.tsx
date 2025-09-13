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
import { 
  Plus, 
  Search, 
  ClipboardList, 
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  MinusCircle,
  PlusCircle
} from "lucide-react"

interface RubricQuestion {
  id: string
  pertanyaan: string
  rangeMin: number
  rangeMax: number
}

interface Rubric {
  id: string
  nama: string
  createdAt: string
  questions: RubricQuestion[]
}

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

export default function RubricsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    questions: [
      { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
    ]
  })
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
      fetchRubrics()
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

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
      } else {
        setError("Failed to fetch rubrics")
      }
    } catch (error) {
      setError("An error occurred while fetching rubrics")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const url = editingRubric ? `/api/rubrics/${editingRubric.id}` : "/api/rubrics"
      const method = editingRubric ? "PUT" : "POST"

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
        setSuccess(editingRubric ? "Rubric updated successfully" : "Rubric created successfully")
        setIsDialogOpen(false)
        setFormData({
          nama: "",
          questions: [
            { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
          ]
        })
        setEditingRubric(null)
        fetchRubrics()
      } else {
        setError(data.error || "Failed to save rubric")
      }
    } catch (error) {
      setError("An error occurred while saving rubric")
    }
  }

  const handleEdit = (rubric: Rubric) => {
    setEditingRubric(rubric)
    setFormData({
      nama: rubric.nama,
      questions: rubric.questions.map(q => ({
        pertanyaan: q.pertanyaan,
        rangeMin: q.rangeMin,
        rangeMax: q.rangeMax
      }))
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rubric?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/rubrics/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess("Rubric deleted successfully")
        fetchRubrics()
      } else {
        setError("Failed to delete rubric")
      }
    } catch (error) {
      setError("An error occurred while deleting rubric")
    }
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { pertanyaan: "", rangeMin: 0, rangeMax: 1 }
      ]
    })
  }

  const removeQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = [...formData.questions]
      newQuestions.splice(index, 1)
      setFormData({
        ...formData,
        questions: newQuestions
      })
    }
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    }
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const filteredRubrics = rubrics.filter(rubric =>
    rubric.nama.toLowerCase().includes(searchTerm.toLowerCase())
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
                Rubrics Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {rubrics.length} rubrics
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
                placeholder="Search rubrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
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
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nama" className="text-right">
                        Rubric Name
                      </Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-left">Questions</Label>
                      {formData.questions.map((question, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Question {index + 1}</span>
                            {formData.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label htmlFor={`pertanyaan-${index}`}>Question</Label>
                              <Input
                                id={`pertanyaan-${index}`}
                                value={question.pertanyaan}
                                onChange={(e) => updateQuestion(index, "pertanyaan", e.target.value)}
                                required
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`rangeMin-${index}`}>Min Score</Label>
                                <Input
                                  id={`rangeMin-${index}`}
                                  type="number"
                                  value={question.rangeMin}
                                  onChange={(e) => updateQuestion(index, "rangeMin", parseInt(e.target.value))}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor={`rangeMax-${index}`}>Max Score</Label>
                                <Input
                                  id={`rangeMax-${index}`}
                                  type="number"
                                  value={question.rangeMax}
                                  onChange={(e) => updateQuestion(index, "rangeMax", parseInt(e.target.value))}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addQuestion}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingRubric ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rubrics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5" />
                <span>Rubrics List</span>
              </CardTitle>
              <CardDescription>
                Manage all rubrics in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading rubrics...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rubric Name</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRubrics.map((rubric) => (
                      <TableRow key={rubric.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{rubric.nama}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {rubric.questions.map((q, index) => (
                              <div key={q.id} className="text-sm">
                                <span className="font-medium">{index + 1}.</span> {q.pertanyaan}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {q.rangeMin}-{q.rangeMax}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(rubric.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(rubric)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(rubric.id)}
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
    </div>
  )
}