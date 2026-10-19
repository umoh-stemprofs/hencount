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

export const flockSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a flock name.")
    .max(40, "Keep the flock name under 40 characters."),
});

/** Hens, eggs and feed arrive as strings from number inputs. */
export const dayLogSchema = z.object({
  flockId: z.string().min(1, "Choose a flock."),
  hens: z.coerce
    .number({ invalid_type_error: "Hens must be a number." })
    .int("Hens must be a whole number of at least 1.")
    .min(1, "Hens must be a whole number of at least 1.")
    .max(100_000, "Hens looks too big. Check it."),
  eggs: z.coerce
    .number({ invalid_type_error: "Eggs must be a number." })
    .int("Eggs must be a whole number of 0 or more.")
    .min(0, "Eggs must be a whole number of 0 or more.")
    .max(100_000, "Eggs looks too big. Check it."),
  feedKg: z.coerce
    .number({ invalid_type_error: "Feed must be a number of kg." })
    .positive("Feed must be more than 0 kg.")
    .max(10_000, "Feed looks too big. Check it."),
});

export const eggSaleSchema = z.object({
  flockId: z.string().min(1, "Choose a flock."),
  eggs: z.coerce
    .number({ invalid_type_error: "Eggs sold must be a number." })
    .int("Eggs sold must be a whole number of 1 or more.")
    .min(1, "Eggs sold must be a whole number of 1 or more."),
  pricePerTrayNaira: z.coerce
    .number({ invalid_type_error: "Price per tray must be a number of naira." })
    .positive("Price per tray must be more than ₦0.")
    .max(1_000_000, "Price per tray looks too big. Check it."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FarmInput = z.infer<typeof farmSchema>;
export type FlockInput = z.infer<typeof flockSchema>;
export type DayLogInput = z.infer<typeof dayLogSchema>;
export type EggSaleInput = z.infer<typeof eggSaleSchema>;
