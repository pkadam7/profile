"use client";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { updateProfile } from "../../api/profile_api";

const educationSchema = z.object({
    educationLevel: z.string().optional(),
    university: z.string().optional(),
    courseName: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    currentlyStudying: z.boolean().optional(),
    experienceLevel: z.string().optional(),
});

const toMonthInput = (val) => {
    if (!val) return "";
    try {
        const d = new Date(val);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } catch { return ""; }
};

export default function EducationForm({ initialData, onSuccess }) {
    const edu = Array.isArray(initialData?.education) && initialData.education.length > 0 ? initialData.education[0] : null;

    const { register, control, handleSubmit } = useForm({
        resolver: zodResolver(educationSchema),
        defaultValues: {
            educationLevel: edu?.degree || "",
            university: edu?.institution || "",
            courseName: edu?.course || "",
            fieldOfStudy: edu?.fieldOfStudy || "",
            startDate: toMonthInput(edu?.startDate),
            endDate: toMonthInput(edu?.endDate),
            currentlyStudying: edu?.currentlyStudying || false,
            experienceLevel: edu?.experienceLevel || "",
        },
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            // Prepare data for API - API expects flat structure for updateProfile usually, 
            // but let's check profile_form/page.jsx logic. 
            // It seems updateProfile takes the whole object. 
            // We should probably merge with existing data or just send what we have if the API handles partial updates.
            // Looking at `profile_form/page.jsx`, it sends a huge object.
            // We might need to send other fields as they are, or the API handles partials.
            // SAFE ASSUMPTION: The API might expect all fields or at least we should retain old ones if not provided.
            // However, for this component, we only care about education fields.

            const submitData = { ...initialData, ...data }; // Merge with initial to keep other fields if needed, or just send partial if API supports it.
            // Ideally we should just send the fields we modified.
            // Let's assume updateProfile handles partial updates or we pass what we have.

            const res = await updateProfile(submitData);
            if (res.success) {
                onSuccess();
            } else {
                setErrorMessage(res.error || "Failed to update education");
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Education Level</Label>
                            <Controller name="educationLevel" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="highschool">High School</SelectItem>
                                        <SelectItem value="bachelor">Bachelor</SelectItem>
                                        <SelectItem value="master">Master</SelectItem>
                                        <SelectItem value="phd">PhD</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <div><Label>University</Label><Input {...register("university")} disabled={loading} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Course Name</Label><Input {...register("courseName")} disabled={loading} /></div>
                        <div><Label>Field of Study</Label><Input {...register("fieldOfStudy")} disabled={loading} /></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div><Label>Start Date</Label><Input type="month" {...register("startDate")} disabled={loading} /></div>
                        <div><Label>End Date</Label><Input type="month" {...register("endDate")} disabled={loading} /></div>
                        <div>
                            <Label>Experience</Label>
                            <Controller name="experienceLevel" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                        <Label htmlFor="currentlyStudying">Currently studying</Label>
                    </div>
                </CardContent>
            </Card>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </form>
    );
}
