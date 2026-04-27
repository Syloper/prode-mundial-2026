import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/, "Solo letras y espacios"),
  email: z.string().email("Email inválido").max(254, "Email muy largo"),
  dni: z
    .string()
    .min(7, "DNI inválido: mínimo 7 dígitos")
    .max(9, "DNI inválido: máximo 9 dígitos")
    .regex(/^\d+$/, "DNI debe contener solo números"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres")
    .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
    .regex(/[0-9]/, "Debe incluir al menos un número"),
});

export const prizeSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  description: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .max(500, "Máximo 500 caracteres"),
  photoUrl: z
    .string()
    .url("Ingresa una URL válida")
    .optional()
    .or(z.literal("")),
  criteria: z.enum([
    "most_points_date",
    "most_points_phase",
    "most_points_tournament",
  ]),
  assignmentType: z.enum(["automatic", "manual"]),
  tieResolution: z.enum(["all", "draw", "first"]).default("all"),
  phase: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PrizeFormData = z.infer<typeof prizeSchema>;
