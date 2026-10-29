import {
  IDEA_MUTATION_AXES,
  buildIdeaMutationPrompt,
  validateIdeaMutationResult,
  type IdeaMutationContext,
  type IdeaMutationResult,
} from "./idea-mutation-lab";

type ResponsesApiOutput = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractOutputText(data: ResponsesApiOutput): string {
  const texts: string[] = [];

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        texts.push(content.text);
      }
    }
  }

  return texts.join("\n").trim();
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue: model may have wrapped JSON in a fenced block.
  }

  const fenced = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i,
  );

  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("IDEA_MUTATION_JSON_NOT_FOUND");
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
}

export async function runIdeaMutationLab(
  context: IdeaMutationContext,
): Promise<IdeaMutationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const model =
    process.env.OPENAI_JOPD_MODEL ||
    process.env.OPENAI_CRM_MODEL;

  if (!model) {
    throw new Error("OPENAI_JOPD_MODEL_MISSING");
  }

  const instructions = buildIdeaMutationPrompt(context);

  const schemaInstruction = `
Return ONLY one valid JSON object.

Required top-level shape:

{
  "version": "JOPD_IDEA_MUTATION_V1",
  "truthClass": "CREATED",
  "mutations": [...exactly 20...],
  "survivors": [...exactly 5...],
  "best": {...one of the survivors...},
  "realityCheckRequired": [...]
}

Each mutations item:

{
  "id": 1,
  "axis": "exact axis string",
  "firstVisibleAction": "...",
  "protagonistExpectation": "...",
  "actualEvent": "...",
  "characterCausality": "...",
  "forcedNextEvent": "...",
  "status": "SURVIVE" or "KILL",
  "killReason": "..."
}

Use these axis strings EXACTLY and in this exact order:

${IDEA_MUTATION_AXES.map(
  (axis, index) => `${index + 1}. ${axis}`,
).join("\n")}

Each survivors item must repeat the full candidate and additionally contain:

{
  "versionB": "...",
  "scores": {
    "visual": 0-10,
    "character": 0-10,
    "escalation": 0-10,
    "callback": 0-10,
    "aiSmell": 0-10
  },
  "status": "SURVIVE"
}

"best" must be the full winning survivor object.

Do not use markdown.
Do not add commentary outside JSON.
`.trim();

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: `${instructions}\n\n${schemaInstruction}`,
        input:
          "Run the JOPD Idea Mutation Lab. " +
          "Generate 20 genuinely different mutations, kill the safe ideas, " +
          "create Version B for the final five, select one best candidate, " +
          "and explicitly list every factual or physical assumption that requires Reality verification.",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `IDEA_MUTATION_OPENAI_ERROR_${response.status}: ${body.slice(0, 1200)}`,
    );
  }

  const data = (await response.json()) as ResponsesApiOutput;
  const raw = extractOutputText(data);

  if (!raw) {
    throw new Error("IDEA_MUTATION_EMPTY_MODEL_OUTPUT");
  }

  let parsed: unknown;

  try {
    parsed = extractJsonObject(raw);
  } catch (error) {
    throw new Error(
      `IDEA_MUTATION_JSON_PARSE_FAILED: ${
        error instanceof Error ? error.message : String(error)
      }\nRAW_OUTPUT:\n${raw.slice(0, 4000)}`,
    );
  }

  try {
    return validateIdeaMutationResult(parsed);
  } catch (error) {
    throw new Error(
      `IDEA_MUTATION_VALIDATION_FAILED: ${
        error instanceof Error ? error.message : String(error)
      }\nRAW_OUTPUT:\n${raw.slice(0, 6000)}`,
    );
  }
}
