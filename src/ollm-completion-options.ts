/**
 * OLLM Completion Model IDs.
 * Since OLLM is a proxy that supports 100+ LLMs, any model string is accepted.
 */
export type OLLMCompletionModelId =
  | 'gpt-3.5-turbo-instruct'
  | (string & {});

