"use client";

import { useForm } from "react-hook-form";
import { useState, useRef, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import { updateProfile } from "../../api/profile_api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const skillsSchema = z.object({
    skills: z.string().optional(),
    resume: z.any().optional(),
});

const validateFile = (file, maxSize, allowedTypes) => {
    if (!file) return { valid: true };
    if (file.size > maxSize) return { valid: false, error: `File must be less than ${maxSize / 1024 / 1024}MB` };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: "Invalid file type" };
    return { valid: true };
};

const FileUpload = ({ label, accept, fileName, onFileChange, onClear, fileRef, description, disabled }) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <input type="file" accept={accept} className="hidden" ref={fileRef} onChange={onFileChange} disabled={disabled} />
        {!fileName ? (
            <div onClick={() => !disabled && fileRef.current?.click()} className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 hover:border-primary/50"}`}>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Click to upload or drag and drop</div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </div>
        ) : (
            <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900 truncate">{fileName}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClear(); }} disabled={disabled}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
    </div>
);

export default function SkillsForm({ initialData, onSuccess }) {
    const [resumeName, setResumeName] = useState("");
    const [hasExistingResume, setHasExistingResume] = useState(!!initialData?.resume_file);

    useEffect(() => {
        if (initialData?.resume_file) {
            const filename = initialData.resume_file.split(/[/\\]/).pop();
            setResumeName(filename);
        }
    }, [initialData]);

    let skillsString = "";
    if (initialData?.skills) {
        if (Array.isArray(initialData.skills)) {
            skillsString = initialData.skills.join(", ");
        } else if (typeof initialData.skills === 'string') {
            try {
                const parsed = JSON.parse(initialData.skills);
                skillsString = Array.isArray(parsed) ? parsed.join(", ") : initialData.skills;
            } catch {
                skillsString = initialData.skills;
            }
        }
    }


    const { register, handleSubmit, setValue } = useForm({
        resolver: zodResolver(skillsSchema),
        defaultValues: {
            skills: skillsString,
            resume: null,
        },
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const resumeRef = useRef(null);
    const [resumeError, setResumeError] = useState("");

    const handleResumeChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        setResumeError("");
        const v = validateFile(file, MAX_FILE_SIZE, ACCEPTED_DOCUMENT_TYPES);
        if (!v.valid) {
            setResumeError(v.error);
            setResumeName("");
            setValue("resume", null);
            setHasExistingResume(false);
        } else {
            setResumeName(file.name);
            setValue("resume", file);
            setResumeError("");
            setHasExistingResume(false);
        }
        setUploadingFile(false);
    }, [setValue]);

    const clearResume = useCallback(() => {
        setResumeName("");
        setResumeError("");
        setValue("resume", null);
        if (resumeRef.current) resumeRef.current.value = "";
        setHasExistingResume(false);
    }, [setValue]);

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const submitData = { ...initialData, ...data, resume: hasExistingResume && !data.resume ? null : data.resume };
            const res = await updateProfile(submitData);
            if (res.success) {
                onSuccess();
            } else {
                setErrorMessage(res.error || "Failed to update skills");
            }
        } catch (error) {
            setErrorMessage(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div>
                        <Label>Skills</Label>
                        <Input placeholder="Comma separated skills" {...register("skills")} disabled={loading} />
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
            <Button type="submit" className="w-full" disabled={loading || uploadingFile}>{loading ? "Saving..." : "Save Changes"}</Button>
        </form>
    );
}
