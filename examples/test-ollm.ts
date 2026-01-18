import { createOLLM } from '../src/index';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';

// Configure your OLLM provider
const ollm = createOLLM({
  baseURL: 'https://api.ollm.com/v1', // Change to your OLLM server URL
  apiKey: 'sk-4G4Eeo9LL-SE4ukrztU18A', // Or set OLLM_API_KEY environment variable
});

async function testChatCompletion() {
  console.log('\n=== Testing Chat Completion ===\n');

  try {
    const { text, usage } = await generateText({
      model: ollm('near/GLM-4.6'), // Change to any model your OLLM supports
      prompt: 'Say hello and tell me a fun fact about programming.',
    });

    console.log('Response:', text);
    console.log('Usage:', usage);
  } catch (error) {
    console.error('Chat completion error:', error);
  }
}

async function testStreaming() {
  console.log('\n=== Testing Streaming ===\n');

  try {
    const { textStream } = streamText({
      model: ollm('near/GLM-4.6'), // Change to any model your OLLM supports
      prompt: 'Count from 1 to 5 slowly, explaining each number.',
    });

    process.stdout.write('Streaming: ');
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

// OLLM does not support embedding models
// async function testEmbeddings() {
//   console.log('\n=== Testing Embeddings ===\n');
//   try {
//     const { embedding } = await embed({
//       model: ollm.embeddingModel('text-embedding-model'),
//       value: 'The quick brown fox jumps over the lazy dog.',
//     });
//     console.log('Embedding dimensions:', embedding.length);
//     console.log('First 5 values:', embedding.slice(0, 5));
//   } catch (error) {
//     console.error('Embedding error:', error);
//   }
// }

async function testWithMessages() {
  console.log('\n=== Testing with Messages ===\n');

  try {
    const { text } = await generateText({
      model: ollm('near/GLM-4.6'),
      messages: [
        {
          role: 'system',
          content:
            "You are a helpful assistant that responds concisely.",
        },
        {
          role: 'user',
          content: 'What is TypeScript in one sentence, in street lang?',
        },
      ],
    });

    console.log('Response:', text);
  } catch (error) {
    console.error('Messages test error:', error);
  }
}

async function testToolCalling() {
  console.log('\n=== Testing Tool Calling ===\n');

  try {
    const { text, toolCalls } = await generateText({
      model: ollm('near/GLM-4.6'),
      prompt: 'What is the weather in San Francisco?',
      tools: {
        getWeather: tool({
          description: 'Get the current weather for a location',
          inputSchema: z.object({
            location: z.string().describe('The city to get weather for'),
          }),
        }),
      },
    });

    console.log('Response:', text);
    console.log('Tool calls:', JSON.stringify(toolCalls, null, 2));
  } catch (error) {
    console.error('Tool calling error:', error);
  }
}

async function testProviderOptions() {
  console.log('\n=== Testing Provider Options ===\n');

  try {
    // Example with provider-specific options
    const { text } = await generateText({
      model: ollm('near/GLM-4.6'),
      prompt: 'Explain quantum computing briefly.',
      // Provider options can be passed for OLLM-specific features
      providerOptions: {
        ollm: {
          user: 'de08cd1e-524b-4184-ae09-67425dadcf3e',
        },
      },
    });

    console.log('Response:', text);
  } catch (error) {
    console.error('Provider options error:', error);
  }
}

// Run all tests

async function main() {
  console.log('🚀 Starting OLLM Provider Tests\n');
  console.log('Make sure your OLLM server is running at the configured URL.');
  console.log(
    'Update the model names to match what your OLLM server supports.\n',
  );

  await testChatCompletion();
  await testStreaming();
  await testWithMessages();
  await testToolCalling();
  await testProviderOptions();

  console.log('\n✅ All tests completed!');
}

main().catch(console.error);
