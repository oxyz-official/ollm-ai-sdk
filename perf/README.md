# OLLM Performance Test Suite

This directory contains performance tests for the `@ai-sdk/ollm` package.

## Prerequisites

1. **o.llm proxy running** with TEE models configured
2. **OLLM_API_KEY** environment variable set
3. **Node.js 18+** installed

## Quick Start

```bash
# From the ollm-ai-sdk directory
npm install

# Run performance tests (proxy must be running)
OLLM_API_KEY=your-key npm run perf
```

## Configuration

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLM_BASE_URL` | `http://localhost:4000/v1` | o.llm proxy URL |
| `OLLM_API_KEY` | (required) | API key for authentication |
| `OLLM_REQUESTS_PER_MODEL` | `50` | Number of requests per model |
| `OLLM_CONCURRENT_REQUESTS` | `5` | Concurrency level |

## What's Measured

### Latency Distribution
- **p50** (median): Typical user experience
- **p95**: Experience for 95% of requests (SLA target)
- **p99**: Worst case for almost all users

### Time to First Token (TTFT)
- Measures streaming responsiveness
- Critical for user-perceived latency

### TEE Overhead Analysis
- Compares TEE models (Phala/NEAR) vs standard models
- Quantifies the cost of confidential computing

## Models Tested

### TEE Models (Confidential Computing)
- `phala/deepseek-chat-v3-0324` - DeepSeek V3 on Phala Network
- `near/GLM-4.6` - GLM 4.6 on NEAR AI

### Standard Models (if configured)
- `gpt-4o-mini` - OpenAI GPT-4o Mini

## Sample Output

```
═══════════════════════════════════════════════════════════════════════
OLLM Performance Test Suite
═══════════════════════════════════════════════════════════════════════
Base URL: http://localhost:4000/v1
Requests per model: 50
Concurrency: 5

📊 LATENCY DISTRIBUTION (milliseconds)
──────────────────────────────────────────────────────────────────────
Model                         Type      p50     p95     p99     Avg   Success
──────────────────────────────────────────────────────────────────────
Phala DeepSeek V3             TEE      1250    2100    2500    1380    100.0%
NEAR GLM 4.6                  TEE      1100    1850    2200    1220    100.0%
GPT-4o Mini                   STD       450     750     950     520    100.0%

📊 TEE OVERHEAD ANALYSIS
──────────────────────────────────────────────────────────────────────
Average TEE latency:      1300ms
Average Standard latency:  520ms
TEE overhead:             780ms (150.0%)
```

## Enterprise Benchmark Requirements

For enterprise sales documentation, run with:

```bash
OLLM_REQUESTS_PER_MODEL=500 \
OLLM_CONCURRENT_REQUESTS=20 \
OLLM_API_KEY=your-key \
npm run perf 2>&1 | tee benchmark-results.txt
```

This provides statistically significant results for:
- SLA documentation (p95/p99 latency guarantees)
- Capacity planning (throughput limits)
- TEE overhead quantification
