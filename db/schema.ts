import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    boolean,
    jsonb,
    vector,
    index,
} from "drizzle-orm/pg-core";

// mirrors Supabase's auth.users — we reference its id
export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey(), // = auth.users.id
    githubUsername: text("github_username"),
    fullName: text("full_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    label: text("label").default("My Resume").notNull(), // user-facing name, e.g. "ML-focused v2"
    fileUrl: text("file_url").notNull(),
    rawText: text("raw_text"),
    analysis: jsonb("analysis"), // score, suggestions — Claude's JSON
    // exactly one primary per user — enforced in actions (set new -> unset old)
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    githubRepoId: text("github_repo_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    languages: jsonb("languages"),
    stars: integer("stars").default(0),
    enrichment: jsonb("enrichment"), // summary, skills, bullets — Claude's JSON
    isVisible: boolean("is_visible").default(true).notNull(),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    title: text("title").notNull(),
    company: text("company"),
    rawDescription: text("raw_description").notNull(),
    extracted: jsonb("extracted").notNull(), // Zod-validated JD extraction
    // embedding of the extracted requirements summary; null in v1 —
    // populated once an embedding provider lands with the advisor feature
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull().references(() => jobs.id),
    resumeId: uuid("resume_id").notNull().references(() => resumes.id),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    score: integer("score").notNull(), // 0-100 overall match
    analysis: jsonb("analysis").notNull(), // Zod-validated match analysis
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    role: text("role").notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memories = pgTable(
    "memories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").notNull().references(() => profiles.id),
        content: text("content").notNull(), // the distilled memory chunk
        embedding: vector("embedding", { dimensions: 1536 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("memories_embedding_idx").using(
            "hnsw",
            table.embedding.op("vector_cosine_ops")
        ),
    ]
);