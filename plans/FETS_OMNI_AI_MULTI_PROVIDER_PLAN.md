# FETS OMNI AI - Multi-Provider Architecture Plan

## Problem Statement

The current Google Gemini API key (**REDACTED**) is returning **404 errors** for all model attempts:
- `gemini-1.5-pro` - 404
- `gemini-1.5-flash` - 404  
- `gemini-1.0-pro` - 404
- `gemini-pro` - 404

**Root Cause Analysis:**
The API key is likely from an older Google Cloud project that doesn't have access to the latest Gemini models, or the models have been deprecated.

## Proposed Solutions

### Option 1: Get a New Gemini API Key (Recommended - Free)
1. Go to Google AI Studio: https://aistudio.google.com/
2. Create a new API key
3. Replace the key in `fets-point/.env`
4. Test with the new key

### Option 2: Add OpenAI Provider (Requires paid API key)
Add GPT-4o or GPT-3.5-turbo as an alternative:
- Install: `npm install openai`
- Add `VITE_OPENAI_API_KEY` to `.env`
- Create `openai.ts` library
- Update `askGemini` to try OpenAI as fallback

### Option 3: Add Anthropic Claude Provider (Requires paid API key)
Add Claude 3.5/3.7 as an alternative:
- Install: `npm install @anthropic-ai/sdk`
- Add `VITE_ANTHROPIC_API_KEY` to `.env`
- Create `anthropic.ts` library
- Update `askGemini` to try Claude as fallback

### Option 4: Multi-Provider Architecture (Recommended)
Implement a unified AI interface that supports multiple providers with automatic fallback:

```
fets-point/src/lib/ai/
├── index.ts          # Unified AI interface
├── gemini.ts         # Gemini provider (fixed)
├── openai.ts         # OpenAI provider (new)
└── anthropic.ts      # Anthropic provider (new)
```

## Recommended Implementation Plan

### Phase 1: Quick Fix (Same Day)
1. Generate new Gemini API key from Google AI Studio
2. Test with simple model list

### Phase 2: Multi-Provider Support (1-2 Days)
1. Create `ai/index.ts` with unified interface
2. Add OpenAI provider
3. Add Anthropic provider
4. Implement intelligent routing based on query type

### Phase 3: Advanced Features (1 Week)
1. Cache responses for common queries
2. Implement rate limiting
3. Add cost tracking
4. Add query analysis for provider selection

## Implementation Details

### Updated Model List for Gemini (v1 API)
```typescript
const modelPriorityList = [
    "gemini-2.0-flash-exp",  // Latest experimental
    "gemini-2.0-flash",       // Latest stable
    "gemini-1.5-pro",         // Pro model
    "gemini-1.5-flash",       // Flash model
];
```

### OpenAI Integration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

async function callOpenAI(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
    });
    return response.choices[0]?.message?.content || '';
}
```

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `fets-point/.env` | Modify | Add new API keys |
| `fets-point/src/lib/gemini.ts` | Modify | Fix model list |
| `fets-point/src/lib/ai/index.ts` | Create | Unified AI interface |
| `fets-point/src/lib/ai/openai.ts` | Create | OpenAI provider |
| `fets-point/src/lib/ai/anthropic.ts` | Create | Anthropic provider |

## Estimated Effort

- **Option 1 (New API Key)**: 5 minutes
- **Option 2 (OpenAI)**: 30 minutes
- **Option 3 (Multi-Provider)**: 2-3 hours

## Next Steps

1. **Immediate**: User generates new Gemini API key from Google AI Studio
2. **If that fails**: Implement OpenAI as fallback provider
3. **Long-term**: Build multi-provider architecture for reliability

## Questions for User

1. Do you have access to Google AI Studio to generate a new API key?
2. Would you like to add OpenAI (GPT-4) as an alternative provider?
3. What's your budget for AI API calls (free vs paid)?
