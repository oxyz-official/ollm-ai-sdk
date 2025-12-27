"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  VERSION: () => VERSION,
  createOLLM: () => createOLLM,
  ollm: () => ollm
});
module.exports = __toCommonJS(src_exports);

// src/ollm-provider.ts
var import_openai_compatible = require("@ai-sdk/openai-compatible");
var import_provider = require("@ai-sdk/provider");
var import_provider_utils = require("@ai-sdk/provider-utils");
var import_v4 = require("zod/v4");

// src/version.ts
var VERSION = true ? "1.0.0" : "0.0.0-test";

// src/ollm-provider.ts
var ollmErrorSchema = import_v4.z.object({
  error: import_v4.z.object({
    message: import_v4.z.string(),
    type: import_v4.z.string().optional(),
    param: import_v4.z.string().nullable().optional(),
    code: import_v4.z.string().nullable().optional()
  })
});
var ollmErrorStructure = {
  errorSchema: ollmErrorSchema,
  errorToMessage: (data) => data.error.message
};
var defaultBaseURL = "http://localhost:4000/v1";
function createOLLM(options = {}) {
  var _a;
  const baseURL = (0, import_provider_utils.withoutTrailingSlash)((_a = options.baseURL) != null ? _a : defaultBaseURL);
  const getHeaders = () => (0, import_provider_utils.withUserAgentSuffix)(
    {
      Authorization: `Bearer ${(0, import_provider_utils.loadApiKey)({
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
    return new import_openai_compatible.OpenAICompatibleChatLanguageModel(modelId, {
      ...getCommonModelConfig("chat"),
      errorStructure: ollmErrorStructure
    });
  };
  const createCompletionModel = (modelId) => new import_openai_compatible.OpenAICompatibleCompletionLanguageModel(modelId, {
    ...getCommonModelConfig("completion"),
    errorStructure: ollmErrorStructure
  });
  const createEmbeddingModel = (modelId) => {
    throw new import_provider.NoSuchModelError({ modelId, modelType: "embeddingModel" });
  };
  const provider = (modelId) => createChatModel(modelId);
  provider.specificationVersion = "v3";
  provider.completionModel = createCompletionModel;
  provider.chatModel = createChatModel;
  provider.languageModel = createChatModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.imageModel = (modelId) => {
    throw new import_provider.NoSuchModelError({ modelId, modelType: "imageModel" });
  };
  return provider;
}
var ollm = createOLLM();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VERSION,
  createOLLM,
  ollm
});
//# sourceMappingURL=index.js.map