"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useRef, useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { updateProfile } from "../../api/profile_api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const identitySchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional(),
    bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
    profilePhoto: z.any().optional(),
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
                <div className="text-sm text-muted-foreground">Click to upload</div>
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

export default function IdentityForm({ initialData, onSuccess }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            firstName: initialData?.first_name || "",
            lastName: initialData?.last_name || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            bio: initialData?.bio || "",
            profilePhoto: null,
        },
    });

    const [loading, setLoading] = useState(false);
    const [photoName, setPhotoName] = useState("");
    const [aiGenerating, setAiGenerating] = useState(false);
    const photoRef = useRef(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [hasExistingPhoto, setHasExistingPhoto] = useState(!!initialData?.profile_photo);
    const [errorMessage, setErrorMessage] = useState(null)

    useEffect(() => {
        if (initialData?.profile_photo) {
            const filename = initialData.profile_photo.split(/[/\\]/).pop();
            setPhotoName(filename);
        }
    }, [initialData])


    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        const v = validateFile(file, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES);
        if (v.valid) {
            setPhotoName(file.name);
            setValue("profilePhoto", file, { shouldValidate: true });
            setHasExistingPhoto(false);
        }
        setUploadingFile(false);
    }, [setValue]);

    const clearPhoto = useCallback(() => {
        setPhotoName("");
        setValue("profilePhoto", null);
        if (photoRef.current) photoRef.current.value = "";
        setHasExistingPhoto(false);
    }, [setValue]);

    const handleAIGenerate = async () => {
        setAiGenerating(true);
        try {
            const values = watch();
            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })
            const data = await res.json()
            if (data.bio) setValue("bio", data.bio);
        } catch (e) { console.error(e); }
        finally { setAiGenerating(false); }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const submitData = { ...data, profilePhoto: hasExistingPhoto && !data.profilePhoto ? null : data.profilePhoto };
            const res = await updateProfile(submitData);
            if (res.success) {
                onSuccess();
            } else {
                setErrorMessage(res.error || "Failed to update profile");
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
                    <FileUpload label="Profile Photo" accept="image/*" fileName={photoName} onFileChange={handlePhotoChange} onClear={clearPhoto} fileRef={photoRef} description="Max 10MB" disabled={loading} />

                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>First Name</Label><Input {...register("firstName")} disabled={loading} /></div>
                        <div><Label>Last Name</Label><Input {...register("lastName")} disabled={loading} /></div>
                    </div>

                    <div><Label>Email</Label><Input type="email" {...register("email")} disabled={loading} /></div>
                    <div><Label>Phone</Label><Input {...register("phone")} disabled={loading} /></div>
                    <div><Label>Address</Label><Textarea {...register("address")} disabled={loading} /></div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <Label>Bio</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAIGenerate} disabled={loading || aiGenerating}>
                                {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Generate
                            </Button>
                        </div>
                        <Textarea {...register("bio")} disabled={loading} rows={4} />
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" className="w-full" disabled={loading || uploadingFile}>{loading ? "Saving..." : "Save Changes"}</Button>
        </form>
    );
}
