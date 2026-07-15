import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY automatically

export const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Structured-outputs call with one retry. The API guarantees schema-shaped
 * JSON; the retry covers the rare client-side validation failure (e.g. a
 * numeric range zodOutputFormat can't enforce server-side). On retry the
 * validation error is appended to the user message so the model can correct.
 */
export async function parseWithSchema<Schema extends z.ZodType>(args: {
    system: string;
    userMessage: string;
    schema: Schema;
    maxTokens?: number;
}): Promise<z.infer<Schema>> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
        const content =
            attempt === 0
                ? args.userMessage
                : `${args.userMessage}\n\nYour previous response failed validation:\n${String(
                      lastError instanceof Error ? lastError.message : lastError
                  )}\nCorrect these issues and respond again.`;

        try {
            const response = await anthropic.messages.parse({
                model: CLAUDE_MODEL,
                max_tokens: args.maxTokens ?? 3000,
                system: args.system,
                messages: [{ role: "user", content }],
                output_config: { format: zodOutputFormat(args.schema) },
            });
            if (response.parsed_output !== null && response.parsed_output !== undefined) {
                return response.parsed_output;
            }
            lastError = new Error(
                `No parsable output (stop_reason: ${response.stop_reason})`
            );
        } catch (e) {
            // API-level errors (auth, rate limit, overload) are already
            // retried by the SDK — don't burn a second paid call on them
            if (e instanceof Anthropic.APIError) throw e;
            lastError = e;
        }
    }

    throw lastError;
}
