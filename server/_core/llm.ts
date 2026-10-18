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
const STRUCTURED_TOOL_PREFIX = "structured_output_";

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
    lastError = `${response.status} ${response.statusText} – ${await response.text().catch(() => "")}`;
    // Retry only on rate limits, overload and transient server errors.
    if (![429, 500, 502, 503, 504, 529].includes(response.status)) break;
  }
  throw new Error(`LLM invoke failed: ${lastError}`);
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
  let structuredToolName: string | null = null;
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
    else if (choice) payload.tool_choice = { type: "tool", name: choice.function.name };
  }

  if (responseFormat?.type === "json_schema") {
    // Structured output: force a single tool whose input schema is the requested schema.
    structuredToolName = `${STRUCTURED_TOOL_PREFIX}${responseFormat.json_schema.name}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
    anthropicTools.push({
      name: structuredToolName,
      description: "Return the final answer as structured data matching this schema exactly.",
      input_schema: responseFormat.json_schema.schema,
    });
    payload.tool_choice = { type: "tool", name: structuredToolName };
  } else if (responseFormat?.type === "json_object") {
    systemPrompt = `${systemPrompt}\n\nRespond with a single valid JSON object only — no prose and no code fences.`.trim();
  }

  if (anthropicTools.length) payload.tools = anthropicTools;
  if (systemPrompt) payload.system = systemPrompt;

  const data = await postToAnthropic(payload, apiKey);
  const blocks: Array<Record<string, any>> = Array.isArray(data.content) ? data.content : [];

  let content = blocks
    .filter(block => block.type === "text")
    .map(block => String(block.text ?? ""))
    .join("");
  const toolCalls: ToolCall[] = [];

  for (const block of blocks) {
    if (block.type !== "tool_use") continue;
    if (structuredToolName && block.name === structuredToolName) {
      content = JSON.stringify(block.input ?? {});
      continue;
    }
    toolCalls.push({
      id: String(block.id),
      type: "function",
      function: { name: String(block.name), arguments: JSON.stringify(block.input ?? {}) },
    });
  }

  if (responseFormat?.type === "json_object") content = stripCodeFences(content);

  const finishReason =
    data.stop_reason === "end_turn" ? "stop"
      : data.stop_reason === "max_tokens" ? "length"
      : data.stop_reason === "tool_use" ? (structuredToolName ? "stop" : "tool_calls")
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
