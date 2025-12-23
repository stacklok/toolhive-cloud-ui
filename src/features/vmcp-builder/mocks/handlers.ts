/**
 * MSW handlers for vMCP Builder POC.
 * These mock the API endpoints that would be needed for vMCP management.
 */

import type { RequestHandler } from "msw";
import { HttpResponse, http, delay } from "msw";
import {
  mockMCPServersWithTools,
  mockSavedVMCPs,
} from "@/features/vmcp-builder/mocks/fixtures";
import type {
  CreateVMCPRequest,
  VirtualMCPServer,
} from "@/features/vmcp-builder/types";

// In-memory store for created vMCPs (simulates database)
let vmcpStore: VirtualMCPServer[] = [...mockSavedVMCPs];

/**
 * Generate a unique ID for new vMCPs
 */
function generateId(): string {
  return `vmcp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * MSW handlers for vMCP API endpoints
 */
export const vmcpHandlers: RequestHandler[] = [
  // GET /api/vmcp/servers - List MCP servers with their tools
  http.get("*/api/vmcp/servers", async () => {
    // Simulate network delay
    await delay(300);

    return HttpResponse.json({
      servers: mockMCPServersWithTools,
    });
  }),

  // GET /api/vmcp - List all saved vMCPs
  http.get("*/api/vmcp", async () => {
    await delay(200);

    return HttpResponse.json({
      vmcps: vmcpStore,
      total: vmcpStore.length,
    });
  }),

  // GET /api/vmcp/:id - Get a specific vMCP
  http.get("*/api/vmcp/:id", async ({ params }) => {
    await delay(150);

    const vmcp = vmcpStore.find((v) => v.id === params.id);

    if (!vmcp) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(vmcp);
  }),

  // POST /api/vmcp - Create a new vMCP
  http.post("*/api/vmcp", async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as CreateVMCPRequest;

    const newVMCP: VirtualMCPServer = {
      id: generateId(),
      name: body.spec.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spec: body.spec,
      status: {
        phase: "Pending",
        message: "Virtual MCP Server is being created...",
        backendCount: body.spec.aggregation.tools.length,
      },
    };

    vmcpStore.push(newVMCP);

    // Simulate async deployment - status changes to Ready after a delay
    setTimeout(() => {
      const vmcp = vmcpStore.find((v) => v.id === newVMCP.id);
      if (vmcp) {
        vmcp.status = {
          phase: "Ready",
          url: `https://vmcp.example.com/${vmcp.name}`,
          backendCount: vmcp.spec.aggregation.tools.length,
        };
      }
    }, 2000);

    return HttpResponse.json(newVMCP, { status: 201 });
  }),

  // PUT /api/vmcp/:id - Update a vMCP
  http.put("*/api/vmcp/:id", async ({ params, request }) => {
    await delay(400);

    const index = vmcpStore.findIndex((v) => v.id === params.id);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as CreateVMCPRequest;

    vmcpStore[index] = {
      ...vmcpStore[index],
      name: body.spec.name,
      updatedAt: new Date().toISOString(),
      spec: body.spec,
    };

    return HttpResponse.json(vmcpStore[index]);
  }),

  // DELETE /api/vmcp/:id - Delete a vMCP
  http.delete("*/api/vmcp/:id", async ({ params }) => {
    await delay(300);

    const index = vmcpStore.findIndex((v) => v.id === params.id);

    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    vmcpStore.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/vmcp/:id/deploy - Deploy/redeploy a vMCP
  http.post("*/api/vmcp/:id/deploy", async ({ params }) => {
    await delay(600);

    const vmcp = vmcpStore.find((v) => v.id === params.id);

    if (!vmcp) {
      return new HttpResponse(null, { status: 404 });
    }

    vmcp.status = {
      phase: "Pending",
      message: "Deploying Virtual MCP Server...",
      backendCount: vmcp.spec.aggregation.tools.length,
    };

    // Simulate deployment completion
    setTimeout(() => {
      vmcp.status = {
        phase: "Ready",
        url: `https://vmcp.example.com/${vmcp.name}`,
        backendCount: vmcp.spec.aggregation.tools.length,
      };
    }, 3000);

    return HttpResponse.json({ message: "Deployment started" });
  }),

  // POST /api/vmcp/preview - Preview the generated YAML
  http.post("*/api/vmcp/preview", async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as CreateVMCPRequest;

    // Generate a YAML preview of the VirtualMCPServer CRD
    const yaml = `apiVersion: toolhive.stacklok.dev/v1alpha1
kind: VirtualMCPServer
metadata:
  name: ${body.spec.name}
  namespace: default
spec:
  groupRef:
    name: ${body.spec.groupName}
  incomingAuth:
    type: ${body.spec.incomingAuth.type}
  aggregation:
    conflictResolution: ${body.spec.aggregation.conflictResolution}
    tools:
${body.spec.aggregation.tools
  .map(
    (t) => `      - workload: ${t.workload}
        filter:
${t.filter.map((f) => `          - ${f}`).join("\n")}`,
  )
  .join("\n")}
  serviceType: ${body.spec.serviceType ?? "ClusterIP"}`;

    return HttpResponse.json({ yaml });
  }),
];

