import type { GetRegistryV01ServersResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";
import { HttpResponse } from "msw";

export const mockedGetRegistryV01Servers =
  AutoAPIMock<GetRegistryV01ServersResponse>({
    servers: [
      {
        server: {
          title: "AWS Nova Canvas",
          name: "awslabs/aws-nova-canvas",
          version: "1.0.0",
          description:
            "MCP server for AI-powered image generation using Amazon Nova Canvas and AWS services",
          repository: {
            source: "github",
            id: "awslabs",
            url: "https://github.com/awslabs/aws-nova-canvas",
          },
          _meta: {
            "io.modelcontextprotocol.registry/publisher-provided": {},
          },
          icons: [
            {
              sizes: ["32x32"],
              mimeType: "image/x-icon",
              src: "https://www.amazon.com/favicon.ico",
            },
          ],
          packages: [
            {
              version: "1.0.0",
              environmentVariables: [
                {
                  name: "AWS_ACCESS_KEY_ID",
                  description: "AWS Access Key ID",
                  format: "string",
                },
              ],
            },
          ],
          remotes: [
            {
              type: "http",
              url: "https://example.com/awslabs/aws-nova-canvas",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: false,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "AgentQL MCP",
          name: "tinyfish/agentql-mcp",
          version: "1.0.1",
          description: "A powerful MCP server for building AI agents",
          repository: {
            source: "github",
            id: "tinyfish",
            url: "https://github.com/tinyfish/agentql-mcp",
          },
          _meta: {
            "io.modelcontextprotocol.registry/publisher-provided": {},
          },
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/tinyfish/agentql-mcp",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-02-09T18:53:24.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Astra DB MCP",
          name: "datastax/astra-db-mcp",
          version: "1.0.2",
          description: "Integrate AI assistants with Astra DB",
          repository: {
            source: "github",
            id: "datastax",
            url: "https://github.com/datastax/astra-db-mcp",
          },
          _meta: {
            "io.modelcontextprotocol.registry/publisher-provided": {},
          },
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/datastax/astra-db-mcp",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-06-16T06:09:48.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Microsoft Azure",
          name: "microsoft/azure-mcp",
          version: "1.0.0",
          description: "Connect AI assistants to Azure services",
          repository: {
            source: "github",
            id: "microsoft",
            url: "https://github.com/microsoft/azure-mcp",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/microsoft/azure-mcp",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Google Workspace",
          name: "google/mcp-google-apps",
          version: "1.0.0",
          description:
            "Access your Google Workspace apps, including calendar, mail, drive, docs, slides and sheets",
          repository: {
            source: "github",
            id: "google",
            url: "https://github.com/google/mcp-google-apps",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/google",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Figma Desktop",
          name: "figma/mcp-desktop",
          version: "1.0.0",
          description:
            "Connect AI assistants to Figma Desktop for design collaboration and automation",
          repository: {
            source: "github",
            id: "figma",
            url: "https://github.com/figma/mcp-desktop",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/figma",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Slack Workspace",
          name: "slack/mcp-slack",
          version: "1.0.0",
          description:
            "Integrate AI assistants with Slack for team communication and automation",
          repository: {
            source: "github",
            id: "slack",
            url: "https://github.com/slack/mcp-slack",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/slack",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "GitHub API",
          name: "github/mcp-github",
          version: "1.0.0",
          description:
            "Interact with GitHub repositories, issues, and pull requests",
          repository: {
            source: "github",
            id: "github",
            url: "https://github.com/github/mcp-github",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/github",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Stripe Payments",
          name: "stripe/mcp-stripe",
          version: "1.0.0",
          description:
            "Manage Stripe payments, subscriptions, and customer data",
          repository: {
            source: "github",
            id: "stripe",
            url: "https://github.com/stripe/mcp-stripe",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/stripe",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Notion Workspace",
          name: "notion/mcp-notion",
          version: "1.0.0",
          description: "Access and manage Notion pages, databases, and content",
          repository: {
            source: "github",
            id: "notion",
            url: "https://github.com/notion/mcp-notion",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/notion",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Salesforce CRM",
          name: "salesforce/mcp-salesforce",
          version: "1.0.0",
          description:
            "Connect to Salesforce CRM for customer management and automation",
          repository: {
            source: "github",
            id: "salesforce",
            url: "https://github.com/salesforce/mcp-salesforce",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/salesforce",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "HubSpot Marketing",
          name: "hubspot/mcp-hubspot",
          version: "1.0.0",
          description:
            "Integrate with HubSpot for marketing automation and CRM",
          repository: {
            source: "github",
            id: "hubspot",
            url: "https://github.com/hubspot/mcp-hubspot",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/hubspot",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Linear Project",
          name: "linear/mcp-linear",
          version: "1.0.0",
          description: "Manage Linear issues, projects, and team workflows",
          repository: {
            source: "github",
            id: "linear",
            url: "https://github.com/linear/mcp-linear",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/linear",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Trello Boards",
          name: "trello/mcp-trello",
          version: "1.0.0",
          description: "Access and manage Trello boards, cards, and lists",
          repository: {
            source: "github",
            id: "trello",
            url: "https://github.com/trello/mcp-trello",
          },
          _meta: {},
          icons: [],
          packages: [],
          remotes: [
            {
              type: "http",
              url: "https://example.com/trello",
              headers: [],
            },
          ],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
      {
        server: {
          title: "Jira Management",
          name: "atlassian/mcp-jira",
          version: "1.0.0",
          description:
            "Manage Jira issues, projects, and workflows through AI assistants",
          repository: {
            source: "github",
            id: "atlassian",
            url: "https://github.com/atlassian/mcp-jira",
          },
          websiteUrl: "https://github.com/atlassian/mcp-jira",
          _meta: {},
          icons: [],
          packages: [],
          remotes: [],
        },
        _meta: {
          "io.modelcontextprotocol.registry/official": {
            isLatest: true,
            publishedAt: "2024-01-16T07:47:41.0Z",
            status: "active",
          },
        },
      },
    ],
    metadata: {
      count: 15,
      nextCursor: "next-page",
    },
  })
    .scenario("empty-servers", (self) =>
      self.override(() => ({
        servers: [],
        metadata: { count: 0 },
      })),
    )
    .scenario("server-error", (self) =>
      self.overrideHandler(() =>
        HttpResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      ),
    );
