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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Search, 
  Users, 
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react"

interface Examiner {
  id: string
  nama: string
  nipdn: string
  user: {
    email: string
    name: string
  }
  createdAt: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

export default function ExaminersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [examiners, setExaminers] = useState<Examiner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExaminer, setEditingExaminer] = useState<Examiner | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    nipdn: "",
    email: "",
    password: ""
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
      fetchExaminers()
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

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
      } else {
        setError("Failed to fetch examiners")
      }
    } catch (error) {
      setError("An error occurred while fetching examiners")
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
      const url = editingExaminer ? `/api/examiners/${editingExaminer.id}` : "/api/examiners"
      const method = editingExaminer ? "PUT" : "POST"

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
        setSuccess(editingExaminer ? "Examiner updated successfully" : "Examiner created successfully")
        setIsDialogOpen(false)
        setFormData({ nama: "", nipdn: "", email: "", password: "" })
        setEditingExaminer(null)
        fetchExaminers()
      } else {
        setError(data.error || "Failed to save examiner")
      }
    } catch (error) {
      setError("An error occurred while saving examiner")
    }
  }

  const handleEdit = (examiner: Examiner) => {
    setEditingExaminer(examiner)
    setFormData({
      nama: examiner.nama,
      nipdn: examiner.nipdn,
      email: examiner.user.email,
      password: ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this examiner?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/examiners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess("Examiner deleted successfully")
        fetchExaminers()
      } else {
        setError("Failed to delete examiner")
      }
    } catch (error) {
      setError("An error occurred while deleting examiner")
    }
  }

  const filteredExaminers = examiners.filter(examiner =>
    examiner.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    examiner.nipdn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    examiner.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
  }

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
                Examiners Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {examiners.length} examiners
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
                placeholder="Search examiners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
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
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nama" className="text-right">
                        Name
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
                      <Label htmlFor="nipdn" className="text-right">
                        NIPDN
                      </Label>
                      <Input
                        id="nipdn"
                        value={formData.nipdn}
                        onChange={(e) => setFormData({ ...formData, nipdn: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="col-span-3"
                        required={!editingExaminer}
                        placeholder={editingExaminer ? "Leave blank to keep current" : ""}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingExaminer ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Examiners Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Examiners List</span>
              </CardTitle>
              <CardDescription>
                Manage all examiners in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading examiners...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Examiner</TableHead>
                      <TableHead>NIPDN</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExaminers.map((examiner) => (
                      <TableRow key={examiner.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(examiner.nama)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{examiner.nama}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{examiner.nipdn}</TableCell>
                        <TableCell>{examiner.user.email}</TableCell>
                        <TableCell>
                          {new Date(examiner.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(examiner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(examiner.id)}
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