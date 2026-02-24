import { z } from "zod";

export const postSchema = z.object({
  content: z
    .string()
    .min(1, "Post content cannot be empty")
    .max(1000, "Post content is too long"),
});

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title cannot be empty")
    .max(100, "Task title is too long"),
  description: z.string().max(1000, "Task description is too long").optional(),
  assigned_to: z.string().uuid("Invalid user ID"),
  due_date: z.string().optional(),
});

export const kudosSchema = z.object({
  receiver_id: z.string().uuid("Invalid user ID"),
  message: z
    .string()
    .min(1, "Kudos message cannot be empty")
    .max(500, "Kudos message is too long"),
});
