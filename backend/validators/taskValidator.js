import { z } from "zod";

/*
 CHANGE #4: Category and status are no longer hardcoded enums here.
 They're validated loosely (any non-empty string) since valid values
 are now managed via the Settings model. The database is the source of truth.

 CHANGE #3: assignedTo accepts either a single string or array of strings.
 CHANGE #11: referenceLinks is an optional array of URL strings (or comma-sep string).
*/

const assignedToField = z.union([
  z.string().min(1),
  z.array(z.string().min(1))
]).optional();

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  assignedTo: assignedToField,
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  category: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  estimatedTime: z.number().min(1).optional(),
  status: z.string().optional().default("Not Started"),
  referenceLinks: z.union([
    z.array(z.string()),
    z.string()
  ]).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    fileType: z.enum(["link", "file"])
  })).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  assignedTo: z.union([
    z.string().optional(),
    z.array(z.string()).optional()
  ]).optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  category: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  estimatedTime: z.number().min(1).optional(),
  status: z.string().optional(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }).optional(),
  referenceLinks: z.union([
    z.array(z.string()),
    z.string()
  ]).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    fileType: z.enum(["link", "file"])
  })).optional()
});