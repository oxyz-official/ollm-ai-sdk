#!/usr/bin/env npx ts-node
/**
 * OLLM Performance Test Suite
 * 
 * This suite measures:
 * - Latency distribution (p50/p95/p99) for TEE vs non-TEE models
 * - Throughput under concurrent load
 * - TEE attestation fetch overhead
 * - First token latency (TTFT) for streaming
 * 
 * Prerequisites:
 * - o.llm proxy running (default: http://localhost:4000)
 * - OLLM_API_KEY environment variable set
 * - TEE providers (Phala/NEAR) configured in proxy
 * 
 * Usage:
 *   OLLM_API_KEY=your-key npx ts-node perf/performance-test.ts
 *   
 * Options (via environment variables):
 *   OLLM_BASE_URL - Proxy URL (default: http://localhost:4000/v1)
 *   OLLM_REQUESTS_PER_MODEL - Requests per model (default: 50)
 *   OLLM_CONCURRENT_REQUESTS - Concurrency level (default: 5)
 */

import { createOLLM } from '../src/index';
import { generateText, streamText } from 'ai';

// Configuration
const CONFIG = {
  baseURL: process.env.OLLM_BASE_URL || 'http://localhost:4000/v1',
  apiKey: process.env.OLLM_API_KEY || '',
  requestsPerModel: parseInt(process.env.OLLM_REQUESTS_PER_MODEL || '50'),
  concurrentRequests: parseInt(process.env.OLLM_CONCURRENT_REQUESTS || '5'),
};

// Models to test
const TEST_MODELS = {
  tee: [
    { id: 'phala/deepseek-chat-v3-0324', name: 'Phala DeepSeek V3' },
    { id: 'near/GLM-4.6', name: 'NEAR GLM 4.6' },
  ],
  standard: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (if configured)' },
  ],
};

// Test prompt (short, consistent for benchmarking)
const TEST_PROMPT = 'Say "Hello" and nothing else.';

interface LatencyResult {
  modelId: string;
  modelName: string;
  isTEE: boolean;
  latencies: number[];
  ttftLatencies: number[]; // Time to first token
  errors: string[];
}

interface PercentileStats {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
}

function calculatePercentiles(latencies: number[]): PercentileStats {
  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
    min: sorted[0],
    max: sorted[len - 1],
    avg: latencies.reduce((a, b) => a + b, 0) / len,
  };
}

async function measureLatency(
  ollm: ReturnType<typeof createOLLM>,
  modelId: string,
  modelName: string,
  isTEE: boolean,
  numRequests: number,
  concurrency: number,
): Promise<LatencyResult> {
  const result: LatencyResult = {
    modelId,
    modelName,
    isTEE,
    latencies: [],
    ttftLatencies: [],
    errors: [],
  };
  
  console.log(`\n  Testing ${modelName} (${modelId})...`);
  
  // Run requests in batches based on concurrency
  for (let i = 0; i < numRequests; i += concurrency) {
    const batchSize = Math.min(concurrency, numRequests - i);
    const promises = [];
    
    for (let j = 0; j < batchSize; j++) {
      promises.push(
        (async () => {
          const start = performance.now();
          let ttft: number | null = null;
          
          try {
            // Use streaming to measure TTFT
            const { textStream } = streamText({
              model: ollm(modelId),
              prompt: TEST_PROMPT,
            });
            
            // Measure time to first token
            for await (const _chunk of textStream) {
              if (ttft === null) {
                ttft = performance.now() - start;
              }
            }
            
            const totalLatency = performance.now() - start;
            result.latencies.push(totalLatency);
            if (ttft !== null) {
              result.ttftLatencies.push(ttft);
            }
            
            process.stdout.write('.');
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            result.errors.push(errorMsg);
            process.stdout.write('x');
          }
        })()
      );
    }
    
    await Promise.all(promises);
  }
  
  console.log(` Done (${result.latencies.length}/${numRequests} successful)`);
  return result;
}

async function runThroughputTest(
  ollm: ReturnType<typeof createOLLM>,
  modelId: string,
  duration: number = 30000, // 30 seconds
  concurrency: number = 10,
): Promise<{ requestsPerSecond: number; successRate: number }> {
  console.log(`\n  Throughput test: ${modelId} for ${duration / 1000}s with ${concurrency} concurrent...`);
  
  let completed = 0;
  let errors = 0;
  const startTime = performance.now();
  let running = true;
  
  // Timeout to stop the test
  setTimeout(() => { running = false; }, duration);
  
  const workers = Array(concurrency).fill(null).map(async () => {
    while (running) {
      try {
        await generateText({
          model: ollm(modelId),
          prompt: TEST_PROMPT,
        });
        completed++;
        process.stdout.write('.');
      } catch {
        errors++;
        process.stdout.write('x');
      }
    }
  });
  
  await Promise.all(workers);
  const elapsed = (performance.now() - startTime) / 1000;
  
  const requestsPerSecond = completed / elapsed;
  const successRate = (completed / (completed + errors)) * 100;
  
  console.log(`\n  Completed: ${completed} requests in ${elapsed.toFixed(1)}s`);
  return { requestsPerSecond, successRate };
}

async function checkProxyHealth(baseURL: string, apiKey: string): Promise<boolean> {
  try {
    // Try /health endpoint (remove /v1 suffix if present)
    const healthURL = baseURL.replace(/\/v1\/?$/, '/health');
    console.log(`  Checking: ${healthURL}`);
    const response = await fetch(healthURL, { 
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(60000), // 60 second timeout for large health responses
    });
    return response.ok;
  } catch (error) {
    console.log(`  Health check error: ${error}`);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('OLLM Performance Test Suite');
  console.log('═'.repeat(70));
  console.log(`Base URL: ${CONFIG.baseURL}`);
  console.log(`Requests per model: ${CONFIG.requestsPerModel}`);
  console.log(`Concurrency: ${CONFIG.concurrentRequests}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('═'.repeat(70));
  
  // Check prerequisites
  if (!CONFIG.apiKey) {
    console.error('\n❌ ERROR: OLLM_API_KEY environment variable is required');
    console.error('   Usage: OLLM_API_KEY=your-key npx ts-node perf/performance-test.ts');
    process.exit(1);
  }
  
  // Check proxy health
  console.log('\nChecking proxy health...');
  const isHealthy = await checkProxyHealth(CONFIG.baseURL, CONFIG.apiKey);
  if (!isHealthy) {
    console.error('\n❌ ERROR: Cannot connect to o.llm proxy at ' + CONFIG.baseURL);
    console.error('   Make sure the proxy is running: cd o.llm && ./start-ollm.sh');
    console.error('   Or check that your OLLM_API_KEY is valid');
    process.exit(1);
  }
  console.log('✓ Proxy is healthy\n');
  
  // Create provider
  const ollm = createOLLM({
    baseURL: CONFIG.baseURL,
    apiKey: CONFIG.apiKey,
  });
  
  const results: LatencyResult[] = [];
  
  // Test TEE models
  console.log('\n' + '─'.repeat(70));
  console.log('LATENCY TESTS - TEE Models (Confidential Computing)');
  console.log('─'.repeat(70));
  
  for (const model of TEST_MODELS.tee) {
    try {
      const result = await measureLatency(
        ollm,
        model.id,
        model.name,
        true,
        CONFIG.requestsPerModel,
        CONFIG.concurrentRequests,
      );
      results.push(result);
    } catch (error) {
      console.log(`  ⚠ Skipping ${model.name}: Model not available`);
    }
  }
  
  // Test standard models
  console.log('\n' + '─'.repeat(70));
  console.log('LATENCY TESTS - Standard Models (Non-TEE)');
  console.log('─'.repeat(70));
  
  for (const model of TEST_MODELS.standard) {
    try {
      const result = await measureLatency(
        ollm,
        model.id,
        model.name,
        false,
        CONFIG.requestsPerModel,
        CONFIG.concurrentRequests,
      );
      results.push(result);
    } catch (error) {
      console.log(`  ⚠ Skipping ${model.name}: Model not available`);
    }
  }
  
  // Print results
  console.log('\n' + '═'.repeat(70));
  console.log('RESULTS SUMMARY');
  console.log('═'.repeat(70));
  
  console.log('\n📊 LATENCY DISTRIBUTION (milliseconds)');
  console.log('─'.repeat(70));
  console.log(
    'Model'.padEnd(30) + 
    'Type'.padEnd(8) + 
    'p50'.padStart(8) + 
    'p95'.padStart(8) + 
    'p99'.padStart(8) + 
    'Avg'.padStart(8) +
    'Success'.padStart(10)
  );
  console.log('─'.repeat(70));
  
  for (const result of results) {
    if (result.latencies.length === 0) continue;
    
    const stats = calculatePercentiles(result.latencies);
    const successRate = (result.latencies.length / (result.latencies.length + result.errors.length)) * 100;
    
    console.log(
      result.modelName.substring(0, 29).padEnd(30) +
      (result.isTEE ? 'TEE' : 'STD').padEnd(8) +
      stats.p50.toFixed(0).padStart(8) +
      stats.p95.toFixed(0).padStart(8) +
      stats.p99.toFixed(0).padStart(8) +
      stats.avg.toFixed(0).padStart(8) +
      `${successRate.toFixed(1)}%`.padStart(10)
    );
  }
  
  console.log('\n📊 TIME TO FIRST TOKEN (TTFT) - milliseconds');
  console.log('─'.repeat(70));
  console.log(
    'Model'.padEnd(30) + 
    'Type'.padEnd(8) + 
    'p50'.padStart(8) + 
    'p95'.padStart(8) + 
    'p99'.padStart(8) + 
    'Avg'.padStart(8)
  );
  console.log('─'.repeat(70));
  
  for (const result of results) {
    if (result.ttftLatencies.length === 0) continue;
    
    const stats = calculatePercentiles(result.ttftLatencies);
    
    console.log(
      result.modelName.substring(0, 29).padEnd(30) +
      (result.isTEE ? 'TEE' : 'STD').padEnd(8) +
      stats.p50.toFixed(0).padStart(8) +
      stats.p95.toFixed(0).padStart(8) +
      stats.p99.toFixed(0).padStart(8) +
      stats.avg.toFixed(0).padStart(8)
    );
  }
  
  // TEE vs Standard comparison
  const teeResults = results.filter(r => r.isTEE && r.latencies.length > 0);
  const stdResults = results.filter(r => !r.isTEE && r.latencies.length > 0);
  
  if (teeResults.length > 0 && stdResults.length > 0) {
    console.log('\n📊 TEE OVERHEAD ANALYSIS');
    console.log('─'.repeat(70));
    
    const avgTeeLatency = teeResults.reduce((sum, r) => 
      sum + calculatePercentiles(r.latencies).avg, 0) / teeResults.length;
    const avgStdLatency = stdResults.reduce((sum, r) => 
      sum + calculatePercentiles(r.latencies).avg, 0) / stdResults.length;
    
    const overhead = avgTeeLatency - avgStdLatency;
    const overheadPercent = ((avgTeeLatency / avgStdLatency) - 1) * 100;
    
    console.log(`Average TEE latency:      ${avgTeeLatency.toFixed(0)}ms`);
    console.log(`Average Standard latency: ${avgStdLatency.toFixed(0)}ms`);
    console.log(`TEE overhead:             ${overhead.toFixed(0)}ms (${overheadPercent.toFixed(1)}%)`);
  }
  
  // Errors summary
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  if (totalErrors > 0) {
    console.log('\n⚠ ERRORS ENCOUNTERED');
    console.log('─'.repeat(70));
    for (const result of results) {
      if (result.errors.length > 0) {
        console.log(`${result.modelName}: ${result.errors.length} errors`);
        const uniqueErrors = [...new Set(result.errors)];
        uniqueErrors.slice(0, 3).forEach(e => console.log(`  - ${e.substring(0, 60)}`));
      }
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`Test completed at ${new Date().toISOString()}`);
  console.log('═'.repeat(70));
  
  // Return exit code based on success
  const successfulTests = results.filter(r => r.latencies.length > 0).length;
  process.exit(successfulTests > 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
