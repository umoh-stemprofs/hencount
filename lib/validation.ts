// Zod schemas for every server input (00-global.md §2: never trust the
// client). Error sentences follow design.md §6: say what happened and what
// to do. Passwords are at least 8 characters.
import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const farmSchema = z.object({
  name: z.string().trim().min(1, "Enter a farm name."),
  lat: z.coerce
    .number({ invalid_type_error: "Latitude must be a number." })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  lon: z.coerce
    .number({ invalid_type_error: "Longitude must be a number." })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
  feedPriceNaira: z.coerce
    .number({ invalid_type_error: "Feed price must be a number of naira." })
    .positive("Feed price must be more than ₦0 per kg.")
    .max(1_000_000, "Feed price looks too big. Check it."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FarmInput = z.infer<typeof farmSchema>;
