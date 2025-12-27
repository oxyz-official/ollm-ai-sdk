import { z } from 'zod/v4';
import { ProviderV3, LanguageModelV3, EmbeddingModelV3, ImageModelV3 } from '@ai-sdk/provider';
import { FetchFunction } from '@ai-sdk/provider-utils';

/**
 * OLLM Chat Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 * Below are some common examples.
 */
type OLLMChatModelId = 'phala/deepseek-r1-0528' | 'phala/qwen3-coder-480b-a35b-instruct' | 'phala/deepseek-chat-v3-0324' | 'phala/qwen2.5-vl-72b-instruct' | 'phala/qwen3-vl-30b-a3b-instruct' | 'phala/llama-3.3-70b-instruct' | 'phala/gpt-oss-20b' | 'phala/gpt-oss-120b' | 'near/gpt-oss-120b' | 'phala/deepseek-chat-v3.1' | 'near/GLM-4.6' | 'near/DeepSeek-V3.1' | 'near/Qwen3-30B-A3B-Instruct-2507' | 'phala/glm-4.6' | 'phala/qwen-2.5-7b-instruct' | 'phala/gemma-3-27b-it' | 'phala/qwen3-30b-a3b-instruct-2507' | (string & {});
/**
 * OLLM-specific provider options for chat models.
 */
declare const ollmChatProviderOptions: z.ZodObject<{
    user: z.ZodOptional<z.ZodString>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>>;
}, z.core.$strip>;
type OLLMChatProviderOptions = z.infer<typeof ollmChatProviderOptions>;

/**
 * OLLM Completion Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 */
type OLLMCompletionModelId = 'gpt-3.5-turbo-instruct' | (string & {});

/**
 * OLLM Embedding Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 */
type OLLMEmbeddingModelId = 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large' | (string & {});
declare const ollmEmbeddingProviderOptions: z.ZodObject<{}, z.core.$strip>;
type OLLMEmbeddingProviderOptions = z.infer<typeof ollmEmbeddingProviderOptions>;

type OLLMErrorData = z.infer<typeof ollmErrorSchema>;
declare const ollmErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        message: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        param: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
interface OLLMProviderSettings {
    /**
     * OLLM API key. Default value is taken from the `OLLM_API_KEY`
     * environment variable.
     */
    apiKey?: string;
    /**
     * Base URL for the OLLM API calls.
     * @default 'http://localhost:4000/v1'
     */
    baseURL?: string;
    /**
     * Custom headers to include in the requests.
     */
    headers?: Record<string, string>;
    /**
     * Custom fetch implementation. You can use it as a middleware to intercept requests,
     * or to provide a custom fetch implementation for e.g. testing.
     */
    fetch?: FetchFunction;
}
interface OLLMProvider extends ProviderV3 {
    /**
     * Creates a model for text generation.
     */
    (modelId: OLLMChatModelId): LanguageModelV3;
    /**
     * Creates a chat model for text generation.
     */
    chatModel(modelId: OLLMChatModelId): LanguageModelV3;
    /**
     * Creates a completion model for text generation.
     */
    completionModel(modelId: OLLMCompletionModelId): LanguageModelV3;
    /**
     * Creates a language model for text generation.
     */
    languageModel(modelId: OLLMChatModelId): LanguageModelV3;
    /**
     * Creates an embedding model for text embeddings.
     */
    embeddingModel(modelId: OLLMEmbeddingModelId): EmbeddingModelV3;
    /**
     * @deprecated Use `embeddingModel` instead.
     */
    textEmbeddingModel(modelId: OLLMEmbeddingModelId): EmbeddingModelV3;
    /**
     * Creates an image model.
     * Note: OLLM does not natively support image generation models.
     * This will throw a NoSuchModelError.
     */
    imageModel(modelId: string): ImageModelV3;
}
declare function createOLLM(options?: OLLMProviderSettings): OLLMProvider;
/**
 * Default OLLM provider instance.
 */
declare const ollm: OLLMProvider;

declare const VERSION: string;

export { type OLLMChatModelId, type OLLMChatProviderOptions, type OLLMCompletionModelId, type OLLMEmbeddingModelId, type OLLMEmbeddingProviderOptions, type OLLMErrorData, type OLLMProvider, type OLLMProviderSettings, VERSION, createOLLM, ollm };
