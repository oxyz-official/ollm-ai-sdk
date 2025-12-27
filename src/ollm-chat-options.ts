import { z } from 'zod/v4';

/**
 * OLLM Chat Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 * Below are some common examples.
 */
export type OLLMChatModelId =
  | 'phala/deepseek-r1-0528'
  | 'phala/qwen3-coder-480b-a35b-instruct'
  | 'phala/deepseek-chat-v3-0324'
  | 'phala/qwen2.5-vl-72b-instruct'
  | 'phala/qwen3-vl-30b-a3b-instruct'
  | 'phala/llama-3.3-70b-instruct'
  | 'phala/gpt-oss-20b'
  | 'phala/gpt-oss-120b'
  | 'near/gpt-oss-120b'
  | 'phala/deepseek-chat-v3.1'
  | 'near/GLM-4.6'
  | 'near/DeepSeek-V3.1'
  | 'near/Qwen3-30B-A3B-Instruct-2507'
  | 'phala/glm-4.6'
  | 'phala/qwen-2.5-7b-instruct'
  | 'phala/gemma-3-27b-it'
  | 'phala/qwen3-30b-a3b-instruct-2507'
  | (string & {});

/**
 * OLLM-specific provider options for chat models.
 */
export const ollmChatProviderOptions = z.object({
  /**
   * A unique identifier representing your end-user, which can help
   * monitor and detect abuse.
   */
  user: z.string().optional(),

  /**
   * Reasoning effort for reasoning models (e.g., o1, o3).
   * Defaults to 'medium'.
   */
  reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
});

export type OLLMChatProviderOptions = z.infer<typeof ollmChatProviderOptions>;
