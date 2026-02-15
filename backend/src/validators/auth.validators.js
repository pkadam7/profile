const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .max(100, "Password too long")
  .regex(/[A-Z]/, "Must include uppercase letter")
  .regex(/[a-z]/, "Must include lowercase letter")
  .regex(/[0-9]/, "Must include number")
  .regex(/[^A-Za-z0-9]/, "Must include special character");

exports.registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: passwordSchema
});

exports.loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required")
});

exports.resetByEmailSchema = z.object({
  email: z.string().email("Invalid email"),
  newPassword: passwordSchema
});