import {
  OpenAICompatibleChatLanguageModel,
  OpenAICompatibleCompletionLanguageModel,
  ProviderErrorStructure,
} from '@ai-sdk/openai-compatible';
import {
  EmbeddingModelV3,
  ImageModelV3,
  LanguageModelV3,
  NoSuchModelError,
  ProviderV3,
} from '@ai-sdk/provider';
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
  withUserAgentSuffix,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';
import { OLLMChatModelId } from './ollm-chat-options';
import { OLLMCompletionModelId } from './ollm-completion-options';
import { OLLMEmbeddingModelId } from './ollm-embedding-options';
import { VERSION } from './version';

export type OLLMErrorData = z.infer<typeof ollmErrorSchema>;

const ollmErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    param: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
  }),
});

const ollmErrorStructure: ProviderErrorStructure<OLLMErrorData> = {
  errorSchema: ollmErrorSchema,
  errorToMessage: data => data.error.message,
};

export interface OLLMProviderSettings {
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

export interface OLLMProvider extends ProviderV3 {
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

const defaultBaseURL = 'http://localhost:4000/v1';

export function createOLLM(options: OLLMProviderSettings = {}): OLLMProvider {
  const baseURL = withoutTrailingSlash(options.baseURL ?? defaultBaseURL);

  const getHeaders = () =>
    withUserAgentSuffix(
      {
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'OLLM_API_KEY',
          description: 'OLLM API key',
        })}`,
        ...options.headers,
      },
      `ai-sdk/ollm/${VERSION}`,
    );

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `ollm.${modelType}`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch,
  });

  const createChatModel = (modelId: OLLMChatModelId) => {
    return new OpenAICompatibleChatLanguageModel(modelId, {
      ...getCommonModelConfig('chat'),
      errorStructure: ollmErrorStructure,
    });
  };

  const createCompletionModel = (modelId: OLLMCompletionModelId) =>
    new OpenAICompatibleCompletionLanguageModel(modelId, {
      ...getCommonModelConfig('completion'),
      errorStructure: ollmErrorStructure,
    });

  // OLLM does not support embedding models
  const createEmbeddingModel = (modelId: OLLMEmbeddingModelId) => {
    throw new NoSuchModelError({ modelId, modelType: 'embeddingModel' });
  };

  const provider = (modelId: OLLMChatModelId) => createChatModel(modelId);

  provider.specificationVersion = 'v3' as const;
  provider.completionModel = createCompletionModel;
  provider.chatModel = createChatModel;
  provider.languageModel = createChatModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;

  // OLLM doesn't have native image model support via OpenAI-compatible API
  provider.imageModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
  };

  return provider;
}

/**
 * Default OLLM provider instance.
 */
export const ollm = createOLLM();
