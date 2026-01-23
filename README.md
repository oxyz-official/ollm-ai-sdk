# @ai-sdk/ollm

OLLM provider for the [AI SDK](https://ai-sdk.dev/docs).

OLLM is a proxy server that enables you to call 100+ LLMs using the OpenAI format. This provider wraps the OLLM API for seamless integration with the AI SDK.

## Installation

```bash
pnpm add @ai-sdk/ollm
```

## Usage

### Basic Chat Completion

```typescript
import { ollm } from '@ai-sdk/ollm';
import { generateText } from 'ai';

const { text } = await generateText({
  model: ollm('gpt-4o'),
  prompt: 'Hello, how are you?',
});

console.log(text);
```

### Custom Configuration

```typescript
import { createOLLM } from '@ai-sdk/ollm';

const ollm = createOLLM({
  baseURL: 'https://api.ollm.com/v1', // Your OLLM server URL
  apiKey: 'your-api-key', // Or set OLLM_API_KEY environment variable
});

const model = ollm('claude-3-5-sonnet-20241022');
```

### Streaming

```typescript
import { ollm } from '@ai-sdk/ollm';
import { streamText } from 'ai';

const { textStream } = await streamText({
  model: ollm('gpt-4o-mini'),
  prompt: 'Write a short story about a robot.',
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

### Embeddings

```typescript
import { ollm } from '@ai-sdk/ollm';
import { embed } from 'ai';

const { embedding } = await embed({
  model: ollm.embeddingModel('text-embedding-3-small'),
  value: 'The quick brown fox jumps over the lazy dog.',
});

console.log(embedding);
```

### Tool Calling

```typescript
import { ollm } from '@ai-sdk/ollm';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text, toolCalls } = await generateText({
  model: ollm('gpt-4o'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the weather for a location',
      parameters: z.object({
        location: z.string().describe('The city to get weather for'),
      }),
      execute: async ({ location }) => {
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
});
```

## Configuration Options

| Option    | Type                     | Description                                           | Default                   |
| --------- | ------------------------ | ----------------------------------------------------- | ------------------------- |
| `apiKey`  | `string`                 | OLLM API key (or set `OLLM_API_KEY` env variable)     | -                         |
| `baseURL` | `string`                 | Base URL for OLLM API                                 | `https://api.ollm.com/v1` |
| `headers` | `Record<string, string>` | Custom headers to include in requests                 | -                         |
| `fetch`   | `FetchFunction`          | Custom fetch implementation                           | -                         |

## Supported Models

Since OLLM is a proxy that supports 100+ LLMs, you can use any model that your OLLM server has configured. Common examples include:

### Chat Models
- `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307`
- `gemini-1.5-pro`, `gemini-1.5-flash`
- `mistral-large-latest`, `mistral-small-latest`
- And many more...

### Embedding Models
- `text-embedding-ada-002`
- `text-embedding-3-small`
- `text-embedding-3-large`

## Environment Variables

- `OLLM_API_KEY`: Your OLLM API key

## License

Apache-2.0

