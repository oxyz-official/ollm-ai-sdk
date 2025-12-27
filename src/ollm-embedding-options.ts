import { z } from 'zod/v4';

/**
 * OLLM Embedding Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 */
export type OLLMEmbeddingModelId =
  | 'text-embedding-ada-002'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | (string & {});

export const ollmEmbeddingProviderOptions = z.object({});

export type OLLMEmbeddingProviderOptions = z.infer<
  typeof ollmEmbeddingProviderOptions
>;

