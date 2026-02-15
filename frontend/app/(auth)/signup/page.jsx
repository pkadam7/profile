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

import { registerUser } from "../../api/auth_api";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignupPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    setServerError("");
    setIsLoading(true);

    const { success, error } = await registerUser(values);

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
          <CardTitle className="text-center text-2xl">Signup</CardTitle>
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
                  type={show ? "text" : "password"}
                  placeholder="Password"
                  {...form.register("password")}
                />
                <span
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-2 cursor-pointer"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </span>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            {serverError && (
              <p className="text-center text-sm text-red-500">{serverError}</p>
            )}

            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Signing up…" : "Signup"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="underline">
              Signin
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}