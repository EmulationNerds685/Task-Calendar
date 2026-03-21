import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  assignedTo: z.string().min(1, "assignedTo is required"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  category: z.enum([
    "Research",
    "Admin",
    "Investment Analysis",
    "Compliance",
    "Operations"
  ]).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  estimatedTime: z.number().min(1).optional(),
  status: z.enum(["Not Started", "In Progress", "Completed", "Overdue"])
    .default("Not Started")
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  category: z.enum([
    "Research",
    "Admin",
    "Investment Analysis",
    "Compliance",
    "Operations"
  ]).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  estimatedTime: z.number().min(1).optional(),
  status: z.enum(["Not Started", "In Progress", "Completed", "Overdue"]).optional(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format"
}).optional(),
});