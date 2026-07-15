import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY automatically

export const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Structured-outputs call with one retry. The API guarantees schema-shaped
 * JSON; the retry covers the rare client-side validation failure (e.g. a
 * numeric range zodOutputFormat can't enforce server-side).
 */
export async function parseWithSchema<Schema extends z.ZodType>(args: {
    system: string;
    userMessage: string;
    schema: Schema;
    maxTokens?: number;
}): Promise<z.infer<Schema>> {
    let lastError: unknown;
    let failedOutput: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
        const validationError = String(
            lastError instanceof Error ? lastError.message : lastError
        );
        const correctiveMessage = `Your previous response failed validation:\n${validationError}\nReturn a corrected response that strictly complies with the requested JSON schema.`;
        const messages =
            attempt === 0
                ? [{ role: "user" as const, content: args.userMessage }]
                : failedOutput
                  ? [
                        { role: "user" as const, content: args.userMessage },
                        { role: "assistant" as const, content: failedOutput },
                        { role: "user" as const, content: correctiveMessage },
                    ]
                  : [
                        {
                            role: "user" as const,
                            content: `${args.userMessage}\n\nA previous attempt failed validation. Strictly comply with the requested JSON schema.\nValidation error:\n${validationError}`,
                        },
                    ];

        let rawOutput: Promise<string | null> = Promise.resolve(null);

        try {
            const request = anthropic.messages.parse({
                model: CLAUDE_MODEL,
                max_tokens: args.maxTokens ?? 3000,
                system: args.system,
                messages,
                output_config: { format: zodOutputFormat(args.schema) },
            });
            rawOutput = request
                .asResponse()
                .then(async (response) => {
                    const body: unknown = await response.clone().json();
                    if (!body || typeof body !== "object" || !("content" in body)) {
                        return null;
                    }
                    const content = (body as { content?: unknown }).content;
                    if (!Array.isArray(content)) return null;

                    const text = content
                        .filter(
                            (block): block is { type: "text"; text: string } =>
                                !!block &&
                                typeof block === "object" &&
                                "type" in block &&
                                block.type === "text" &&
                                "text" in block &&
                                typeof block.text === "string"
                        )
                        .map((block) => block.text)
                        .join("\n");
                    return text || null;
                })
                .catch(() => null);

            const response = await request;
            if (response.parsed_output !== null && response.parsed_output !== undefined) {
                return response.parsed_output;
            }
            failedOutput = await rawOutput;
            lastError = new Error(
                `No parsable output (stop_reason: ${response.stop_reason})`
            );
        } catch (e) {
            // API-level errors (auth, rate limit, overload) are already
            // retried by the SDK — don't burn a second paid call on them
            if (e instanceof Anthropic.APIError) throw e;
            failedOutput = await rawOutput;
            lastError = e;
        }
    }

    throw lastError;
}
