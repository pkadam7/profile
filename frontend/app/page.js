"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { getProfile } from "./api/profile_api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Mail, Download, ChevronRight, MoreVertical, Pencil,
  Plus, Award, GraduationCap, Sparkles, MapPin, Loader2
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import SignInDialog from "@/components/SignInDialog"

// Lazy load form components
const IdentityForm = lazy(() => import("./profile_form/components/IdentityForm"))
const EducationForm = lazy(() => import("./profile_form/components/EducationForm"))
const SkillsForm = lazy(() => import("./profile_form/components/SkillsForm"))
const CertificatesForm = lazy(() => import("./profile_form/components/CertificatesForm"))

const formatMonth = (val) => {
  if (!val) return ""
  try {
    return new Date(val).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch { return "" }
}

const formatDate = (val) => {
  if (!val) return ""
  try {
    return new Date(val).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch { return "" }
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeModal, setActiveModal] = useState(null) // 'identity', 'education', 'skills', 'certificates'
  const [showSignInAPI, setShowSignInAPI] = useState(false)

  const fetchProfile = () => {
    setLoading(true)
    getProfile()
      .then((res) => { if (res.success) setProfile(res.data); else setError(res.error) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSuccess = () => {
    setActiveModal(null)
    fetchProfile() // Refresh data
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500 text-sm">{error || "Profile not found"}</p>
          <Button size="sm" onClick={() => setShowSignInAPI(true)}>Complete Your Profile</Button>
          <SignInDialog open={showSignInAPI} onOpenChange={setShowSignInAPI} />
        </div>
      </div>
    )
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "No Name"
  const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?"
  const education = Array.isArray(profile.education) && profile.education.length > 0 ? profile.education[0] : null

  let skills = []
  if (Array.isArray(profile.skills)) {
    skills = profile.skills
  } else if (typeof profile.skills === 'string') {
    try {
      skills = JSON.parse(profile.skills)
    } catch {
      skills = []
    }
  }

  const certificates = Array.isArray(profile.certificates) ? profile.certificates : []

  const completionFields = [
    profile.first_name, profile.last_name, profile.phone,
    profile.bio, profile.address, profile.resume_file,
    skills.length > 0 || null,
    education || null,
    certificates.length > 0 || null,
  ]
  const progress = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)

  const IconBtn = ({ onClick }) => (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0">
      <Plus className="w-4 h-4 text-gray-500" />
    </button>
  )

  const ModalContent = () => {
    switch (activeModal) {
      case 'identity': return <IdentityForm initialData={profile} onSuccess={handleSuccess} />
      case 'education': return <EducationForm initialData={profile} onSuccess={handleSuccess} />
      case 'skills': return <SkillsForm initialData={profile} onSuccess={handleSuccess} />
      case 'certificates': return <CertificatesForm initialData={profile} onSuccess={handleSuccess} />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="px-6 py-2.5">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-1 ring-gray-100 shrink-0">
                  {profile.profile_photo ? (
                    <AvatarImage
                      src={`${process.env.NEXT_PUBLIC_API_URL}/${profile.profile_photo}`}
                      alt={fullName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 mb-0">{fullName}</h1>
                  <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5 mb-0.5">
                    {education?.experienceLevel
                      ? `${education.experienceLevel.charAt(0).toUpperCase() + education.experienceLevel.slice(1)} / `
                      : "Fresher / "}
                    {education?.degree || "Graduate"}
                  </Badge>
                  {profile.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.address}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveModal('identity')}
                className="text-gray-400 hover:text-gray-600 transition shrink-0">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-1.5">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </a>
              )}
              {profile.resume_file && (
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/${profile.resume_file}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-3">
                    <Download className="w-3.5 h-3.5" />
                    Download Resume
                  </Button>
                </a>
              )}
            </div>

            <div className="flex items-end justify-end gap-8 ml-auto">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-0.5">League</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-lg shadow-sm">
                    🥉
                  </div>
                  <p className="text-base font-semibold text-gray-800">Bronze</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-0.5">Rank</p>
                <p className="text-2xl font-bold text-gray-800">29</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-0.5">Points</p>
                <p className="text-2xl font-bold text-gray-800">50</p>
              </div>
            </div>

            <div className="mt-1 text-right">
              <a href="#" className="inline-flex items-center gap-0.5 text-yellow-600 hover:text-yellow-700 text-xs font-medium">
                View My Rewards <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardContent className="p-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Tell us where you want to go</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                {profile.bio || "Add your career goals and what inspires you. This helps us tailor recommendations, learning paths, and opportunities just for you."}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs gap-1.5 shrink-0"
              onClick={() => setActiveModal('identity')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {profile.bio ? "Edit career goals" : "Add career goals"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Level Up Profile</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Just a few clicks away from awesomeness, complete your profile!
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-semibold text-gray-800">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-gray-100" />
                </div>
                {!profile.bio && (
                  <button
                    onClick={() => setActiveModal('identity')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm shrink-0">✏️</div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-900">
                          Complete Your Bio <span className="text-green-600 font-semibold">(+20%)</span>
                        </p>
                        <p className="text-[10px] text-gray-400">Tell us about yourself in a few words!</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
                  <IconBtn onClick={() => setActiveModal('skills')} />
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary"
                        className="text-xs px-2.5 py-1 font-normal bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => setActiveModal('skills')} className="text-xs text-blue-500 hover:text-blue-600">
                    + Add skills
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Experience</h3>
                  <IconBtn onClick={() => setActiveModal('identity')} />
                </div>
                <p className="text-xs text-gray-400">No experience added yet.</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Education</h3>
                  <IconBtn onClick={() => setActiveModal('education')} />
                </div>
                {education ? (
                  <div className="flex gap-3">
                    <div className="w-11 h-11 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-gray-900 leading-snug">
                          {education.course || education.degree}
                        </p>
                        <button onClick={() => setActiveModal('education')} className="text-gray-300 hover:text-gray-500 ml-1 shrink-0">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{education.institution}</p>
                      {education.fieldOfStudy && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{education.fieldOfStudy}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatMonth(education.startDate)}
                        {education.currentlyStudying ? " — Present" : education.endDate ? ` — ${formatMonth(education.endDate)}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setActiveModal('education')} className="text-xs text-blue-500 hover:text-blue-600">
                    + Add education
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Certification</h3>
                  <IconBtn onClick={() => setActiveModal('certificates')} />
                </div>
                {certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="flex gap-3">
                        <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-xs font-semibold text-gray-900 leading-snug">{cert.certificate_name}</p>
                            <button onClick={() => setActiveModal('certificates')} className="text-gray-300 hover:text-gray-500 ml-1 shrink-0">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {cert.description && (
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{cert.description}</p>
                          )}
                          {cert.end_date && (
                            <p className="text-[10px] text-gray-400 mt-1">Provided on: {formatDate(cert.end_date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => setActiveModal('certificates')} className="text-xs text-blue-500 hover:text-blue-600">
                    + Add certificate
                  </button>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setActiveModal('identity')}
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg gap-2 px-5 h-10 text-sm rounded-full"
        >
          <Pencil className="w-4 h-4" />
          Update Your Profile
        </Button>
      </div>

      <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeModal === 'identity' && "Edit Identity"}
              {activeModal === 'education' && "Edit Education"}
              {activeModal === 'skills' && "Edit Skills"}
              {activeModal === 'certificates' && "Edit Certificates"}
            </DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
            <ModalContent />
          </Suspense>
        </DialogContent>
      </Dialog>

    </div>
  )
}