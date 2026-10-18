import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// ─── Anthropic Claude transport ──────────────────────────────────────────────
// Replaces the Manus built-in LLM. Callers keep using the OpenAI-style
// `invokeLLM` contract above; requests are translated to the Anthropic
// Messages API and responses are translated back.

const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 16000;

type AnthropicBlock = Record<string, unknown>;
type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicBlock[] };

const textOf = (content: MessageContent | MessageContent[]): string =>
  ensureArray(content)
    .map(part => (typeof part === "string" ? part : part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("\n");

function toAnthropicBlock(part: TextContent | ImageContent | FileContent): AnthropicBlock | null {
  if (part.type === "text") return part.text ? { type: "text", text: part.text } : null;
  if (part.type === "image_url") {
    const url = part.image_url.url;
    const dataUrl = /^data:([^;]+);base64,([\s\S]*)$/.exec(url);
    if (dataUrl) return { type: "image", source: { type: "base64", media_type: dataUrl[1], data: dataUrl[2] } };
    return { type: "image", source: { type: "url", url } };
  }
  if (part.type === "file_url") {
    const url = part.file_url.url;
    const dataUrl = /^data:([^;]+);base64,([\s\S]*)$/.exec(url);
    if (dataUrl) return { type: "document", source: { type: "base64", media_type: dataUrl[1], data: dataUrl[2] } };
    if (part.file_url.mime_type === "application/pdf" || /\.pdf($|\?)/i.test(url)) {
      return { type: "document", source: { type: "url", url } };
    }
    return { type: "text", text: `[Attached file: ${url}]` };
  }
  return null;
}

function toAnthropicMessages(messages: Message[]): { system: string; messages: AnthropicMessage[] } {
  const systemParts: string[] = [];
  const out: AnthropicMessage[] = [];

  const push = (role: "user" | "assistant", blocks: AnthropicBlock[]) => {
    if (!blocks.length) return;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(...blocks);
    else out.push({ role, content: blocks });
  };

  for (const message of messages) {
    if (message.role === "system") {
      const text = textOf(message.content);
      if (text) systemParts.push(text);
      continue;
    }
    if (message.role === "tool" || message.role === "function") {
      push("user", [{ type: "tool_result", tool_use_id: message.tool_call_id ?? message.name ?? "tool", content: textOf(message.content) || "(empty)" }]);
      continue;
    }
    const blocks = ensureArray(message.content)
      .map(normalizeContentPart)
      .map(toAnthropicBlock)
      .filter((block): block is AnthropicBlock => block !== null);
    const toolCalls = (message as Message & { tool_calls?: ToolCall[] }).tool_calls;
    if (message.role === "assistant" && toolCalls?.length) {
      for (const call of toolCalls) {
        let input: unknown = {};
        try { input = JSON.parse(call.function.arguments || "{}"); } catch { input = {}; }
        blocks.push({ type: "tool_use", id: call.id, name: call.function.name, input });
      }
    }
    push(message.role === "assistant" ? "assistant" : "user", blocks);
  }

  // The Messages API expects the conversation to open with a user turn.
  if (!out.length || out[0].role !== "user") {
    out.unshift({ role: "user", content: [{ type: "text", text: "Hello." }] });
  }
  return { system: systemParts.join("\n\n"), messages: out };
}

const stripCodeFences = (value: string) =>
  value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

class AnthropicError extends Error {
  constructor(message: string, readonly status: number, readonly body: string) {
    super(message);
  }
}

const SUPPORTED_STRING_FORMATS = new Set(["date-time", "time", "date", "duration", "email", "hostname", "uri", "ipv4", "ipv6", "uuid"]);
const UNSUPPORTED_SCHEMA_KEYS = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "pattern", "maxItems", "uniqueItems", "minProperties", "maxProperties", "strict"];

/**
 * Adapts a JSON schema to what Anthropic structured outputs accept:
 * every object gets additionalProperties:false and numeric/length limits are
 * dropped (the prompt still describes them).
 */
export function toStructuredOutputSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toStructuredOutputSchema);
  if (!schema || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (UNSUPPORTED_SCHEMA_KEYS.includes(key)) continue;
    if (key === "minItems" && typeof value === "number" && value > 1) {
      out.minItems = 1;
      continue;
    }
    if (key === "format" && typeof value === "string" && !SUPPORTED_STRING_FORMATS.has(value)) continue;
    if (key === "properties" && value && typeof value === "object") {
      out.properties = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, sub]) => [name, toStructuredOutputSchema(sub)]));
      continue;
    }
    if (["items", "anyOf", "allOf", "oneOf", "$defs", "definitions", "not"].includes(key)) {
      out[key === "oneOf" ? "anyOf" : key] =
        key === "$defs" || key === "definitions"
          ? Object.fromEntries(Object.entries((value ?? {}) as Record<string, unknown>).map(([name, sub]) => [name, toStructuredOutputSchema(sub)]))
          : toStructuredOutputSchema(value);
      continue;
    }
    out[key] = value;
  }
  const type = out.type;
  if (type === "object" || (Array.isArray(type) && type.includes("object")) || out.properties) {
    out.additionalProperties = false;
  }
  return out;
}

async function postToAnthropic(payload: Record<string, unknown>, apiKey: string) {
  const delays = [0, 1500, 4000];
  let lastError = "";
  for (const delay of delays) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const response = await fetch(`${ENV.anthropicBaseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) return (await response.json()) as Record<string, any>;
    const body = await response.text().catch(() => "");
    lastError = `${response.status} ${response.statusText} – ${body}`;
    // Retry only on rate limits, overload and transient server errors.
    if (![429, 500, 502, 503, 504, 529].includes(response.status)) {
      throw new AnthropicError(`LLM invoke failed: ${lastError}`, response.status, body);
    }
  }
  throw new AnthropicError(`LLM invoke failed: ${lastError}`, 0, lastError);
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = ENV.anthropicApiKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const { system, messages } = toAnthropicMessages(params.messages);
  const responseFormat = normalizeResponseFormat(params);
  const payload: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: params.maxTokens ?? params.max_tokens ?? DEFAULT_MAX_TOKENS,
    messages,
  };

  let systemPrompt = system;
  const anthropicTools: AnthropicBlock[] = [];

  if (params.tools?.length) {
    for (const tool of params.tools) {
      anthropicTools.push({
        name: tool.function.name,
        description: tool.function.description ?? "",
        input_schema: tool.function.parameters ?? { type: "object", properties: {} },
      });
    }
    const choice = normalizeToolChoice(params.toolChoice || params.tool_choice, params.tools);
    if (choice === "none") payload.tool_choice = { type: "none" };
    else if (choice === "auto") payload.tool_choice = { type: "auto" };
    // Forcing a specific tool is not supported by current models; let the model choose.
    else if (choice) payload.tool_choice = { type: "auto" };
  }

  let structuredSchema: unknown = null;
  if (responseFormat?.type === "json_schema") {
    // Structured output (Anthropic `output_config.format`): the reply text is JSON matching the schema.
    structuredSchema = toStructuredOutputSchema(responseFormat.json_schema.schema);
    payload.output_config = { format: { type: "json_schema", schema: structuredSchema } };
  } else if (responseFormat?.type === "json_object") {
    systemPrompt = `${systemPrompt}\n\nRespond with a single valid JSON object only — no prose and no code fences.`.trim();
  }

  if (anthropicTools.length) payload.tools = anthropicTools;
  if (systemPrompt) payload.system = systemPrompt;

  let data: Record<string, any>;
  try {
    data = await postToAnthropic(payload, apiKey);
  } catch (error) {
    // If the chosen model rejects structured outputs, fall back to asking for JSON in the prompt.
    if (structuredSchema && error instanceof AnthropicError && error.status === 400) {
      console.warn("[LLM] Structured output rejected; retrying with JSON instructions:", error.body.slice(0, 300));
      delete payload.output_config;
      payload.system = `${systemPrompt}\n\nRespond with a single valid JSON object only — no prose and no code fences — matching this JSON schema exactly:\n${JSON.stringify(structuredSchema)}`.trim();
      data = await postToAnthropic(payload, apiKey);
    } else {
      throw error;
    }
  }
  const blocks: Array<Record<string, any>> = Array.isArray(data.content) ? data.content : [];

  let content = blocks
    .filter(block => block.type === "text")
    .map(block => String(block.text ?? ""))
    .join("");
  const toolCalls: ToolCall[] = [];

  for (const block of blocks) {
    if (block.type !== "tool_use") continue;
    toolCalls.push({
      id: String(block.id),
      type: "function",
      function: { name: String(block.name), arguments: JSON.stringify(block.input ?? {}) },
    });
  }

  if (responseFormat?.type === "json_object" || structuredSchema) content = stripCodeFences(content);

  const finishReason =
    data.stop_reason === "end_turn" ? "stop"
      : data.stop_reason === "max_tokens" ? "length"
      : data.stop_reason === "tool_use" ? "tool_calls"
      : (data.stop_reason ?? null);

  const usage = data.usage
    ? {
        prompt_tokens: Number(data.usage.input_tokens ?? 0),
        completion_tokens: Number(data.usage.output_tokens ?? 0),
        total_tokens: Number(data.usage.input_tokens ?? 0) + Number(data.usage.output_tokens ?? 0),
      }
    : undefined;

  return {
    id: String(data.id ?? ""),
    created: Math.floor(Date.now() / 1000),
    model: String(data.model ?? ENV.anthropicModel),
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: finishReason,
      },
    ],
    usage,
  };
}
