# AI Assistant Feature

The AI Assistant is a sidebar chat interface that allows users to interact with AI models using MCP (Model Context Protocol) tools from the catalog.

## Overview

The assistant provides:

- **AI Chat Interface**: Conversational UI in a sidebar panel
- **MCP Tool Integration**: Select MCP servers from the catalog and use their tools in conversations
- **Model Selection**: Choose from various AI models via OpenRouter
- **Tool Calling**: AI models can invoke MCP tools to perform actions

## Requirements

### OpenRouter API Key

This feature requires an [OpenRouter](https://openrouter.ai/) API key to function.

OpenRouter provides a unified API to access multiple AI models (Claude, GPT-4, Gemini, Llama, etc.) through a single endpoint.

#### Getting an API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Create an account or sign in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add the key to your environment variables

#### Configuration

Add the API key to your `.env.local` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Note**: This is a server-side environment variable (no `NEXT_PUBLIC_` prefix) - the API key is never exposed to the browser.

## Architecture

```
src/features/assistant/
├── actions/
│   ├── mcp-actions.ts      # Server actions for MCP tool fetching
│   └── model-actions.ts    # Server actions for OpenRouter model fetching
├── components/
│   ├── sidebar.tsx         # Main sidebar component
│   ├── sidebar-content.tsx # Sidebar content wrapper
│   └── trigger.tsx         # Button to open the sidebar
├── contexts/
│   ├── chat-context.tsx        # Chat state management
│   ├── mcp-settings-context.tsx # MCP server/tool selection state
│   └── models-context.tsx      # Available models state
├── hooks/
│   ├── use-mcp-settings.ts     # Hook for MCP settings
│   └── use-mcp-tools-fetch.ts  # Hook for fetching MCP tools
├── constants.ts            # Default model and other constants
├── index.ts                # Public API exports
└── README.md               # This file
```

## Usage

### Basic Integration

The assistant is integrated into the app layout. To use it in a page:

```tsx
import {
  AssistantSidebar,
  AssistantTrigger,
  ChatProvider,
  McpSettingsProvider,
  ModelsProvider,
} from "@/features/assistant";

function Layout({ children }) {
  return (
    <ModelsProvider>
      <McpSettingsProvider>
        <ChatProvider>
          {children}
          <AssistantTrigger />
          <AssistantSidebar />
        </ChatProvider>
      </McpSettingsProvider>
    </ModelsProvider>
  );
}
```

### Available Exports

```tsx
// Actions (server-side)
import { getMcpServerTools, getOpenRouterModels } from "@/features/assistant";

// Components
import {
  AssistantSidebar,
  AssistantSidebarContent,
  AssistantTrigger,
} from "@/features/assistant";

// Contexts & Hooks
import {
  ChatProvider,
  useChatContext,
  McpSettingsProvider,
  useMcpSettings,
  ModelsProvider,
  useModels,
} from "@/features/assistant";

// Constants
import { DEFAULT_MODEL } from "@/features/assistant";
```

## Supported Models

The assistant supports any OpenRouter model with tool/function calling capabilities. Models are fetched dynamically from the OpenRouter API.

If the API is unavailable, it falls back to a curated list of known tool-capable models:

- **Anthropic**: Claude 4.5 Sonnet, Claude Opus 4, Claude 3.5 Sonnet/Haiku
- **OpenAI**: GPT-4o, GPT-4.1, O3
- **Google**: Gemini 2.5 Pro/Flash, Gemini 2.0 Flash
- **Meta**: Llama 3.3 70B
- **DeepSeek**: R1, V3
- **Qwen**: Qwen3 235B/32B

## Development

### Testing Without API Key

For development without an OpenRouter API key, the model fetching will fall back to the hardcoded list. However, actual chat functionality requires a valid API key.

### Environment Variables

| Variable             | Required | Description                      |
| -------------------- | -------- | -------------------------------- |
| `OPENROUTER_API_KEY` | Yes      | OpenRouter API key for AI models |

## Related Documentation

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
