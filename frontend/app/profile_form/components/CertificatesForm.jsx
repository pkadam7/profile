"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { updateProfile } from "../../api/profile_api";

const certificatesSchema = z.object({
    certificates: z.array(z.object({
        certificateName: z.string().optional(),
        certificateStart: z.string().optional(),
        certificateEnd: z.string().optional(),
        certificateDescription: z.string().optional(),
    })).optional(),
});

const toDateInput = (val) => {
    if (!val) return "";
    try { return new Date(val).toISOString().split("T")[0]; } catch { return ""; }
};

export default function CertificatesForm({ initialData, onSuccess }) {
    const initialCerts = Array.isArray(initialData?.certificates) && initialData.certificates.length > 0
        ? initialData.certificates.map((c) => ({
            certificateName: c.certificate_name || "",
            certificateStart: toDateInput(c.start_date),
            certificateEnd: toDateInput(c.end_date),
            certificateDescription: c.description || "",
        }))
        : [];

    const { register, control, handleSubmit } = useForm({
        resolver: zodResolver(certificatesSchema),
        defaultValues: {
            certificates: initialCerts,
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "certificates" });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const submitData = { ...initialData, ...data };
            const res = await updateProfile(submitData);
            if (res.success) {
                onSuccess();
            } else {
                setErrorMessage(res.error || "Failed to update certificates");
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
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Certificates</h2>
                <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => append({ certificateName: "", certificateStart: "", certificateEnd: "", certificateDescription: "" })}>
                    + Add Certificate
                </Button>
            </div>

            {fields.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        No certificates added yet.
                    </CardContent>
                </Card>
            )}

            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Certificate #{index + 1}</h3>
                            <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-red-500" onClick={() => remove(index)} disabled={loading}>
                                <X className="w-3 h-3 mr-1" /> Remove
                            </Button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div><Label>Name</Label><Input {...register(`certificates.${index}.certificateName`)} disabled={loading} /></div>
                            <div><Label>Start Date</Label><Input type="date" {...register(`certificates.${index}.certificateStart`)} disabled={loading} /></div>
                            <div><Label>Expiration</Label><Input type="date" {...register(`certificates.${index}.certificateEnd`)} disabled={loading} /></div>
                        </div>
                        <div><Label>Description</Label><Textarea {...register(`certificates.${index}.certificateDescription`)} disabled={loading} rows={3} /></div>
                    </CardContent>
                </Card>
            ))}

            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </form>
    );
}
