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
    fileUrl: text("file_url").notNull(),
    rawText: text("raw_text"),
    analysis: jsonb("analysis"), // score, suggestions — Claude's JSON
    isPrimary: boolean("is_primary").default(true).notNull(),
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

export const jobMatches = pgTable("job_matches", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    jobTitle: text("job_title"),
    company: text("company"),
    jobDescription: text("job_description").notNull(),
    matchScore: integer("match_score"),
    analysis: jsonb("analysis"), // covered, gaps, hidden strengths
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