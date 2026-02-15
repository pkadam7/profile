"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { resetPassword } from "@/lib/auth_api";

const schema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], 
  });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values) {
    setServerError("");
    setIsLoading(true);

    const { success, error } = await resetPassword(values);

    setIsLoading(false);

    if (!success) {
      setServerError(error || "Something went wrong. Please try again.");
      return;
    }

    router.push("/signin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input placeholder="Email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <Input
                  type={show1 ? "text" : "password"}
                  placeholder="New Password"
                  {...form.register("newPassword")}
                />
                <span
                  onClick={() => setShow1(!show1)}
                  className="absolute right-3 top-2 cursor-pointer"
                >
                  {show1 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </span>
              </div>
              {form.formState.errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <Input
                  type={show2 ? "text" : "password"}
                  placeholder="Confirm Password"
                  {...form.register("confirmPassword")}
                />
                <span
                  onClick={() => setShow2(!show2)}
                  className="absolute right-3 top-2 cursor-pointer"
                >
                  {show2 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </span>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {serverError && (
              <p className="text-center text-sm text-red-500">{serverError}</p>
            )}

            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting…" : "Reset Password"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/signin">Back to Signin</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}