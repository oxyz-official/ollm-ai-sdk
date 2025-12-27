// src/ollm-provider.ts
import {
  OpenAICompatibleChatLanguageModel,
  OpenAICompatibleCompletionLanguageModel
} from "@ai-sdk/openai-compatible";
import {
  NoSuchModelError
} from "@ai-sdk/provider";
import {
  loadApiKey,
  withoutTrailingSlash,
  withUserAgentSuffix
} from "@ai-sdk/provider-utils";
import { z } from "zod/v4";

// src/version.ts
var VERSION = true ? "1.0.0" : "0.0.0-test";

// src/ollm-provider.ts
var ollmErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    param: z.string().nullable().optional(),
    code: z.string().nullable().optional()
  })
});
var ollmErrorStructure = {
  errorSchema: ollmErrorSchema,
  errorToMessage: (data) => data.error.message
};
var defaultBaseURL = "http://localhost:4000/v1";
function createOLLM(options = {}) {
  var _a;
  const baseURL = withoutTrailingSlash((_a = options.baseURL) != null ? _a : defaultBaseURL);
  const getHeaders = () => withUserAgentSuffix(
    {
      Authorization: `Bearer ${loadApiKey({
        apiKey: options.apiKey,
        environmentVariableName: "OLLM_API_KEY",
        description: "OLLM API key"
      })}`,
      ...options.headers
    },
    `ai-sdk/ollm/${VERSION}`
  );
  const getCommonModelConfig = (modelType) => ({
    provider: `ollm.${modelType}`,
    url: ({ path }) => `${baseURL}${path}`,
    headers: getHeaders,
    fetch: options.fetch
  });
  const createChatModel = (modelId) => {
    return new OpenAICompatibleChatLanguageModel(modelId, {
      ...getCommonModelConfig("chat"),
      errorStructure: ollmErrorStructure
    });
  };
  const createCompletionModel = (modelId) => new OpenAICompatibleCompletionLanguageModel(modelId, {
    ...getCommonModelConfig("completion"),
    errorStructure: ollmErrorStructure
  });
  const createEmbeddingModel = (modelId) => {
    throw new NoSuchModelError({ modelId, modelType: "embeddingModel" });
  };
  const provider = (modelId) => createChatModel(modelId);
  provider.specificationVersion = "v3";
  provider.completionModel = createCompletionModel;
  provider.chatModel = createChatModel;
  provider.languageModel = createChatModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.imageModel = (modelId) => {
    throw new NoSuchModelError({ modelId, modelType: "imageModel" });
  };
  return provider;
}
var ollm = createOLLM();
export {
  VERSION,
  createOLLM,
  ollm
};
//# sourceMappingURL=index.mjs.map