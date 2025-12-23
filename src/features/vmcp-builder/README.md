# vMCP Builder - POC

This is a **Proof of Concept** for a visual Virtual MCP Server (vMCP) builder using React Flow.

## Overview

The vMCP Builder allows users to visually create Virtual MCP Server configurations by:

1. **Dragging MCP servers** from a palette onto a canvas
2. **Selecting which tools** to include from each server
3. **Connecting servers** to the output node
4. **Previewing the YAML** configuration
5. **Deploying** the vMCP

## Features

### Current POC Features

- ✅ **Server Palette**: Drag and drop MCP servers onto the canvas
- ✅ **Tool Selection**: Select/deselect individual tools from each server
- ✅ **Visual Flow Editor**: React Flow canvas with nodes and connections
- ✅ **Configuration Panel**: Real-time summary of selected tools
- ✅ **YAML Preview**: View the generated VirtualMCPServer CRD
- ✅ **Deploy Button**: Trigger deployment (mocked)

### MSW Mock Endpoints

The POC uses MSW to mock the following API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vmcp/servers` | GET | List MCP servers with their tools |
| `/api/vmcp` | GET | List saved vMCP configurations |
| `/api/vmcp` | POST | Create a new vMCP |
| `/api/vmcp/:id` | GET | Get a specific vMCP |
| `/api/vmcp/:id` | PUT | Update a vMCP |
| `/api/vmcp/:id` | DELETE | Delete a vMCP |
| `/api/vmcp/:id/deploy` | POST | Deploy a vMCP |
| `/api/vmcp/preview` | POST | Generate YAML preview |

## File Structure

\`\`\`
src/features/vmcp-builder/
├── README.md              # This file
├── index.ts               # Feature exports
├── types.ts               # TypeScript types for vMCP
├── actions.ts             # Server actions
├── components/
│   ├── vmcp-flow-editor.tsx    # Main React Flow editor
│   ├── server-palette.tsx       # Draggable server list
│   ├── vmcp-preview-panel.tsx   # Configuration preview
│   └── nodes/
│       ├── index.ts            # Node type exports
│       ├── mcp-server-node.tsx # MCP server node component
│       └── output-node.tsx     # Output node component
└── mocks/
    ├── fixtures.ts        # Mock data
    └── handlers.ts        # MSW request handlers
\`\`\`

## Usage

1. Start the dev server with mock:
   \`\`\`bash
   pnpm dev:mock-server
   \`\`\`

2. Navigate to `/vmcp-builder`

3. Drag servers from the left palette onto the canvas

4. Select/deselect tools by clicking checkboxes

5. View the configuration in the right panel

6. Toggle YAML view to see the generated CRD

## Integration with ToolHive

This POC demonstrates how the UI would integrate with the ToolHive Kubernetes Operator:

1. **VirtualMCPServer CRD**: The YAML output matches the VirtualMCPServer CRD spec
2. **Tool Aggregation**: Uses the \`aggregation.tools\` field for tool filtering
3. **Conflict Resolution**: Supports prefix, priority, and manual strategies
4. **Composite Tools**: Future enhancement for multi-step workflows

## Future Enhancements

- [ ] Composite tool workflow editor (multi-step tool chains)
- [ ] Conflict resolution strategy selector
- [ ] Tool renaming/override UI
- [ ] Save/load configurations
- [ ] Real API integration with registry-server
- [ ] Authentication configuration
- [ ] Service type selection
- [ ] Validation and error handling
- [ ] Undo/redo support
- [ ] Export/import configurations

## Screenshots

### Initial State
![Initial](./docs/initial.png)

### With Servers Added
![With Servers](./docs/with-servers.png)

### YAML Preview
![YAML Preview](./docs/yaml-preview.png)

