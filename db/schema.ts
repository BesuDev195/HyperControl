import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('TODO'), // 'TODO', 'IN PROGRESS', 'COMPLETED'
  priority: text('priority').notNull().default('Medium'), // 'High', 'Medium', 'Low'
  topPriorityRank: integer('top_priority_rank'), // 1, 2, or 3 for Today's top priorities
  dueDate: integer('due_date', { mode: 'timestamp' }),
  estimatedMinutes: integer('estimated_minutes'),
  projectId: integer('project_id'),
  category: text('category').default('personal'), // 'class', 'personal', 'work'
  isToday: integer('is_today', { mode: 'boolean' }).notNull().default(false), // Keep existing field for compatibility
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const captures = sqliteTable('ideas', { // Use existing 'ideas' table to preserve data
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  imageUri: text('image_uri'),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const focusSessions = sqliteTable('focus_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => tasks.id),
  focusTitle: text('focus_title'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  interrupted: integer('interrupted', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  content: text('content').notNull(),
  question: text('question'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

