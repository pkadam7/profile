"use client"

import { useForm, Controller, useFieldArray } from "react-hook-form"
import { useRef, useState, useEffect, useCallback, Component } from "react"
import { useRouter } from "next/navigation"
import { updateProfile, getProfile } from "../api/profile_api"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Loader2, X, Upload } from "lucide-react"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
  skills: z.string().optional(),
  educationLevel: z.string().optional(),
  university: z.string().optional(),
  courseName: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyStudying: z.boolean().optional(),
  experienceLevel: z.string().optional(),
  certificates: z.array(z.object({
    certificateName: z.string().optional(),
    certificateStart: z.string().optional(),
    certificateEnd: z.string().optional(),
    certificateDescription: z.string().optional(),
  })).optional(),
  profilePhoto: z.any().optional(),
  resume: z.any().optional(),
})

const toDateInput = (val) => {
  if (!val) return ""
  try { return new Date(val).toISOString().split("T")[0] } catch { return "" }
}
const toMonthInput = (val) => {
  if (!val) return ""
  try {
    const d = new Date(val)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  } catch { return "" }
}

const validateFile = (file, maxSize, allowedTypes) => {
  if (!file) return { valid: true }
  if (file.size > maxSize) return { valid: false, error: `File must be less than ${maxSize / 1024 / 1024}MB` }
  if (!allowedTypes.includes(file.type)) return { valid: false, error: "Invalid file type" }
  return { valid: true }
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error("Error boundary:", error, info) }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Something went wrong. Please refresh and try again.
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-2 text-xs">{this.state.error?.message}</pre>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
    return this.props.children
  }
}

const FileUpload = ({ label, accept, fileName, onFileChange, onClear, fileRef, description, disabled }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <input 
      type="file" 
      accept={accept} 
      className="hidden" 
      ref={fileRef} 
      onChange={onFileChange} 
      disabled={disabled} 
      aria-label={label} 
    />
    
    {!fileName ? (
      <div
        onClick={() => !disabled && fileRef.current?.click()}
        onKeyDown={(e) => !disabled && e.key === "Enter" && fileRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label={`Upload ${label}`}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 hover:border-primary/50"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Click to upload or drag and drop</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
    ) : (
      <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-green-900 truncate">{fileName}</div>
              <div className="text-xs text-green-600">File uploaded successfully</div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            disabled={disabled}
            className="ml-2 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
  </div>
)

function RegistrationFormInner() {
  const router = useRouter()
  const { register, control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
      skills: "",
      educationLevel: "",
      university: "",
      courseName: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      currentlyStudying: false,
      experienceLevel: "",
      certificates: [],
      profilePhoto: null,
      resume: null,
    }
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: "certificates" })

  const photoRef = useRef(null)
  const resumeRef = useRef(null)
  const formDraftKey = "registration-form-draft"

  const [photoName, setPhotoName] = useState("")
  const [resumeName, setResumeName] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [resumeError, setResumeError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  
  const [hasExistingPhoto, setHasExistingPhoto] = useState(false)
  const [hasExistingResume, setHasExistingResume] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const d = {
        firstName: document.querySelector('[name="firstName"]')?.value,
        lastName: document.querySelector('[name="lastName"]')?.value,
        email: document.querySelector('[name="email"]')?.value,
      }
      if (d.firstName || d.lastName || d.email) sessionStorage.setItem(formDraftKey, JSON.stringify(d))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getProfile()
        if (!result.success) { 
          console.log("Profile fetch failed:", result)
          setFetching(false)
          return 
        }
        const data = result.data
        const edu = Array.isArray(data.education) && data.education.length > 0 ? data.education[0] : null
        let skillsString = ""
        if (data.skills) {
          if (Array.isArray(data.skills)) {
            skillsString = data.skills.join(", ")
          } else if (typeof data.skills === 'string') {
            try {
              const parsed = JSON.parse(data.skills)
              skillsString = Array.isArray(parsed) ? parsed.join(", ") : data.skills
            } catch {
              skillsString = data.skills
            }
          }
        }

        const formData = {
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          bio: data.bio || "",
          skills: skillsString,
          educationLevel: edu?.degree || "",
          university: edu?.institution || "",
          courseName: edu?.course || "",
          fieldOfStudy: edu?.fieldOfStudy || "",
          startDate: toMonthInput(edu?.startDate),
          endDate: toMonthInput(edu?.endDate),
          currentlyStudying: edu?.currentlyStudying || false,
          experienceLevel: edu?.experienceLevel || "",
          certificates: [],
          profilePhoto: null, 
          resume: null,
        }

        reset(formData)

        if (Array.isArray(data.certificates) && data.certificates.length > 0) {
          const certs = data.certificates.map((c) => ({
            certificateName: c.certificate_name || "",
            certificateStart: toDateInput(c.start_date),
            certificateEnd: toDateInput(c.end_date),
            certificateDescription: c.description || "",
          }))
          replace(certs)
        }
        if (data.profile_photo) {
          const filename = data.profile_photo.split(/[/\\]/).pop()
          setPhotoName(filename)
          setHasExistingPhoto(true)
        }
        if (data.resume_file) {
          const filename = data.resume_file.split(/[/\\]/).pop()
          setResumeName(filename)
          setHasExistingResume(true)
        }
        
        sessionStorage.removeItem(formDraftKey)

      } catch (err) {
        console.error("Fetch profile error:", err)
        setError("Failed to load profile. You can still fill out the form.")
      } finally {
        setFetching(false)
      }
    }
    fetchProfile()
  }, [reset, replace])

  const handleAIGenerate = useCallback(async () => {
    setAiGenerating(true)
    setError(null)
    try {
      const currentValues = watch()

      const values = {
        firstName: currentValues.firstName || "",
        lastName: currentValues.lastName || "",
        email: currentValues.email || "",
        phone: currentValues.phone || "",
        address: currentValues.address || "",
        skills: currentValues.skills || "",
        educationLevel: currentValues.educationLevel || "",
        university: currentValues.university || "",
        courseName: currentValues.courseName || "",
        fieldOfStudy: currentValues.fieldOfStudy || "",
        experienceLevel: currentValues.experienceLevel || "",
        currentlyStudying: currentValues.currentlyStudying || false,
        certificates: currentValues.certificates || [],
      }

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "AI generation failed. Please try again.")
        return
      }
      setValue("bio", data.bio, { shouldValidate: true, shouldDirty: true })
    } catch (err) {
      console.error("AI generation error:", err)
      setError("Failed to connect to AI. Please try again.")
    } finally {
      setAiGenerating(false)
    }
  }, [setValue, watch])

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingFile(true)
    setPhotoError("")
    
    const v = validateFile(file, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES)
    if (!v.valid) {
      setPhotoError(v.error)
      setPhotoName("")
      setValue("profilePhoto", null)
      if (photoRef.current) photoRef.current.value = ""
      setHasExistingPhoto(false)
    } else {
      setPhotoName(file.name)
      setValue("profilePhoto", file, { shouldValidate: true })
      setPhotoError("")
      setHasExistingPhoto(false) 
    }
    setUploadingFile(false)
  }, [setValue])

  const handleResumeChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingFile(true)
    setResumeError("")
    
    const v = validateFile(file, MAX_FILE_SIZE, ACCEPTED_DOCUMENT_TYPES)
    if (!v.valid) {
      setResumeError(v.error)
      setResumeName("")
      setValue("resume", null)
      if (resumeRef.current) resumeRef.current.value = ""
      setHasExistingResume(false)
    } else {
      setResumeName(file.name)
      setValue("resume", file, { shouldValidate: true })
      setResumeError("")
      setHasExistingResume(false) 
    }
    setUploadingFile(false)
  }, [setValue])

  const clearPhoto = useCallback(() => {
    setPhotoName("")
    setPhotoError("")
    setValue("profilePhoto", null, { shouldValidate: false })
    if (photoRef.current) photoRef.current.value = ""
    setHasExistingPhoto(false)
  }, [setValue])

  const clearResume = useCallback(() => {
    setResumeName("")
    setResumeError("")
    setValue("resume", null, { shouldValidate: false })
    if (resumeRef.current) resumeRef.current.value = ""
    setHasExistingResume(false)
  }, [setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    
    try {
      const submitData = {
        ...data,
        profilePhoto: hasExistingPhoto && !data.profilePhoto ? null : data.profilePhoto,
        resume: hasExistingResume && !data.resume ? null : data.resume,
      }
      
      const result = await updateProfile(submitData)
      
      if (!result.success) {
        setError(result.error || "Failed to update profile.")
        return
      }
      
      sessionStorage.removeItem(formDraftKey)
      setSuccessOpen(true)
      
      if (data.profilePhoto instanceof File) {
        setHasExistingPhoto(true)
      }
      if (data.resume instanceof File) {
        setHasExistingResume(true)
      }

      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (err) {
      console.error("Submit error:", err)
      setError(err?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const onError = (validationErrors) => {
    console.error("Form validation errors:", validationErrors)
    const errorFields = Object.keys(validationErrors)
    if (errorFields.length > 0) {
      setError(`Please fix the errors in: ${errorFields.join(", ")}`)
    }
  }

  if (fetching) return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground text-sm">Loading your profile...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/40 py-12 px-4">
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl">✓</div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">Profile Submitted!</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground mt-2">
              Your profile has been updated successfully.
              <br />
              <span className="text-xs">Redirecting to home in 2 seconds...</span>
            </DialogDescription>
          </DialogHeader>
          <Button 
            className="mt-4 w-full" 
            onClick={() => router.push("/home")}>
            Go to Home Now
          </Button>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-semibold">Full Registration Form</h1>
          <p className="text-muted-foreground mt-1">Please complete all required fields to finalize your professional profile.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <section className="space-y-6">
          <h2 className="text-lg font-medium">1. Identity</h2>
          <Separator />
          <Card>
            <CardContent className="p-6 space-y-6">

              <FileUpload 
                label="Profile Photo" 
                accept="image/*" 
                fileName={photoName}
                onFileChange={handlePhotoChange}
                onClear={clearPhoto}
                fileRef={photoRef}
                description="SVG, PNG, JPG or GIF (max. 10MB)" 
                disabled={loading || uploadingFile} />
              {photoError && <p className="text-sm text-red-500">{photoError}</p>}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" {...register("firstName")} disabled={loading} />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" {...register("lastName")} disabled={loading} />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" {...register("email")} disabled={loading} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" {...register("phone")} disabled={loading} placeholder="+1234567890" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...register("address")} disabled={loading} rows={3} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Tell Us Where You Want to Go</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || aiGenerating}
                    onClick={handleAIGenerate}
                    className="gap-1.5"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Generate
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Add your career goals and what inspires you. This helps us tailor recommendations, learning paths, and opportunities just for you"
                  {...register("bio")}
                  disabled={loading || aiGenerating}
                  maxLength={1000}
                  rows={5}
                  className={aiGenerating ? "animate-pulse bg-muted/50" : ""}
                />
                {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Click <strong>AI Generate</strong> to auto-fill based on your profile information.
                </p>
              </div>

            </CardContent>
          </Card>
        </section>
        <section className="space-y-6">
          <h2 className="text-lg font-medium">2. Academic History</h2>
          <Separator />
          <Card>
            <CardContent className="p-6 space-y-6">

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Education Level</Label>
                  <Controller name="educationLevel" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={loading}>
                      <SelectTrigger id="educationLevel"><SelectValue placeholder="Choose level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highschool">High School</SelectItem>
                        <SelectItem value="bachelor">Bachelor</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">College / University Name</Label>
                  <Input id="university" {...register("university")} disabled={loading} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input id="courseName" {...register("courseName")} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input id="fieldOfStudy" {...register("fieldOfStudy")} disabled={loading} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Month/Year</Label>
                  <Input id="startDate" type="month" {...register("startDate")} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Month/Year</Label>
                  <Input id="endDate" type="month" {...register("endDate")} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience</Label>
                  <Controller name="experienceLevel" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={loading}>
                      <SelectTrigger id="experienceLevel"><SelectValue placeholder="Choose level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry</SelectItem>
                        <SelectItem value="mid">Mid</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Controller name="currentlyStudying" control={control} render={({ field }) => (
                  <Checkbox id="currentlyStudying" checked={!!field.value} onCheckedChange={field.onChange} disabled={loading} />
                )} />
                <Label htmlFor="currentlyStudying" className="cursor-pointer">Currently studying (Present)</Label>
              </div>

            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-medium">3. Professional Details</h2>
          <Separator />
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input id="skills" placeholder="JavaScript, React, Node.js (comma-separated)" {...register("skills")} disabled={loading} />
                <p className="text-xs text-muted-foreground">Separate each skill with a comma</p>
              </div>
              <FileUpload 
                label="Resume Upload" 
                accept=".pdf,.doc,.docx" 
                fileName={resumeName}
                onFileChange={handleResumeChange}
                onClear={clearResume}
                fileRef={resumeRef}
                description="PDF, DOCX up to 10MB" 
                disabled={loading || uploadingFile} 
              />
              {resumeError && <p className="text-sm text-red-500">{resumeError}</p>}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">4. Certificates (Optional)</h2>
            <Button type="button" variant="outline" size="sm" disabled={loading}
              onClick={() => append({ certificateName: "", certificateStart: "", certificateEnd: "", certificateDescription: "" })}>
              + Add Certificate
            </Button>
          </div>
          <Separator />

          {fields.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No certificates added yet. Click "+ Add Certificate" to add one.
              </CardContent>
            </Card>
          )}

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Certificate #{index + 1}</h3>
                  <Button type="button" variant="ghost" size="sm"
                    className="text-xs text-muted-foreground hover:text-red-500"
                    onClick={() => remove(index)} disabled={loading}>
                    <X className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`certificate-name-${index}`}>Certificate Name</Label>
                    <Input id={`certificate-name-${index}`} {...register(`certificates.${index}.certificateName`)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`certificate-start-${index}`}>Start Date</Label>
                    <Input id={`certificate-start-${index}`} type="date" {...register(`certificates.${index}.certificateStart`)} disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`certificate-end-${index}`}>Expiration Date</Label>
                    <Input id={`certificate-end-${index}`} type="date" {...register(`certificates.${index}.certificateEnd`)} disabled={loading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`certificate-description-${index}`}>Description</Label>
                  <Textarea id={`certificate-description-${index}`} {...register(`certificates.${index}.certificateDescription`)} disabled={loading} rows={3} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Button type="submit" className="w-full py-6 text-base" disabled={loading || uploadingFile}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "SUBMIT REGISTRATION"
          )}
        </Button>
      </form>
    </div>
  )
}

export default function RegistrationForm() {
  return <ErrorBoundary><RegistrationFormInner /></ErrorBoundary>
}