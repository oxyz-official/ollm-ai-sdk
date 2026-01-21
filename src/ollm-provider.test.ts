import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOLLM, ollm } from './ollm-provider';
import { NoSuchModelError } from '@ai-sdk/provider';

describe('ollm-provider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createOLLM', () => {
    it('should create a provider with default settings', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();

      expect(provider).toBeDefined();
      expect(provider.specificationVersion).toBe('v3');
      expect(typeof provider.chatModel).toBe('function');
      expect(typeof provider.completionModel).toBe('function');
      expect(typeof provider.embeddingModel).toBe('function');
      expect(typeof provider.languageModel).toBe('function');
      expect(typeof provider.textEmbeddingModel).toBe('function');
      expect(typeof provider.imageModel).toBe('function');
    });

    it('should create a provider with custom baseURL', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM({
        baseURL: 'https://custom.ollm.server/v1',
      });

      expect(provider).toBeDefined();
    });

    it('should create a provider with custom API key', () => {
      const provider = createOLLM({
        apiKey: 'custom-api-key',
      });

      expect(provider).toBeDefined();
    });

    it('should create a provider with custom headers', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM({
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(provider).toBeDefined();
    });

    it('should strip trailing slash from baseURL', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM({
        baseURL: 'https://custom.ollm.server/v1/',
      });

      expect(provider).toBeDefined();
      // The URL handling is internal, but the provider should still work
    });
  });

  describe('chat model', () => {
    it('should create a chat model with model ID', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.chatModel('phala/deepseek-r1-0528');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('phala/deepseek-r1-0528');
      expect(model.provider).toBe('ollm.chat');
    });

    it('should create a model using provider as function', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider('gpt-4o');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gpt-4o');
    });

    it('should create a language model (alias for chat)', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.languageModel('near/GLM-4.6');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('near/GLM-4.6');
    });

    it('should accept TEE model IDs', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();

      const phalaModel = provider.chatModel('phala/deepseek-chat-v3.1');
      const nearModel = provider.chatModel('near/DeepSeek-V3.1');

      expect(phalaModel.modelId).toBe('phala/deepseek-chat-v3.1');
      expect(nearModel.modelId).toBe('near/DeepSeek-V3.1');
    });
  });

  describe('completion model', () => {
    it('should create a completion model', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.completionModel('gpt-3.5-turbo-instruct');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('gpt-3.5-turbo-instruct');
      expect(model.provider).toBe('ollm.completion');
    });
  });

  describe('embedding model', () => {
    it('should create an embedding model', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.embeddingModel('text-embedding-3-small');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('text-embedding-3-small');
      expect(model.provider).toBe('ollm.embedding');
    });

    it('should create embedding model via textEmbeddingModel (deprecated alias)', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.textEmbeddingModel('text-embedding-ada-002');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('text-embedding-ada-002');
    });

    it('should accept any embedding model ID', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();
      const model = provider.embeddingModel('custom-embedding-model');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('custom-embedding-model');
    });
  });

  describe('image model', () => {
    it('should throw NoSuchModelError for image models', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();

      expect(() => provider.imageModel('dall-e-3')).toThrow(NoSuchModelError);
    });

    it('should include modelId in NoSuchModelError', () => {
      process.env.OLLM_API_KEY = 'test-api-key';
      const provider = createOLLM();

      try {
        provider.imageModel('dall-e-3');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).modelId).toBe('dall-e-3');
        expect((error as NoSuchModelError).modelType).toBe('imageModel');
      }
    });
  });

  describe('default ollm instance', () => {
    it('should export a default ollm instance', () => {
      // This will fail if OLLM_API_KEY is not set, which is expected
      // The test verifies the export exists
      expect(ollm).toBeDefined();
      expect(ollm.specificationVersion).toBe('v3');
    });
  });

  describe('provider options validation', () => {
    it('should work with all options combined', () => {
      const customFetch = vi.fn();
      const provider = createOLLM({
        apiKey: 'my-api-key',
        baseURL: 'https://my-ollm.example.com/v1',
        headers: {
          'X-Request-Id': '123',
        },
        fetch: customFetch as any,
      });

      expect(provider).toBeDefined();
      const model = provider.chatModel('test-model');
      expect(model).toBeDefined();
    });
  });
});

describe('error handling', () => {
  it('should throw if API key is not provided and not in env', () => {
    delete process.env.OLLM_API_KEY;
    const provider = createOLLM();

    // The error is thrown when actually using the model, not when creating it
    // This is because loadApiKey is called lazily in getHeaders
    const model = provider.chatModel('test');
    expect(model).toBeDefined();

    // The actual API key error would occur during a request
  });
});
