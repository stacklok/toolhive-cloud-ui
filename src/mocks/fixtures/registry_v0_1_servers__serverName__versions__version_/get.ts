import type { GetRegistryV01ServersByServerNameVersionsByVersionResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";

export const mockedGetRegistryV01ServersByServerNameVersionsByVersion =
  AutoAPIMock<GetRegistryV01ServersByServerNameVersionsByVersionResponse>({
    server: {
      name: "awslabs/aws-nova-canvas",
      title: "AWS Nova Canvas MCP Server",
      version: "1.0.0",
      description:
        "Image generation using Amazon Nova Canvas. A Model Context Protocol server that integrates with AWS services for AI-powered image generation.\n\nAmazon Nova Canvas is a cutting-edge image generation service that leverages advanced AI models to create high-quality images from text descriptions. This MCP server provides seamless integration with AWS services, allowing you to generate images programmatically within your applications.\n\nKey Features:\n- High-quality image generation with customizable parameters\n- Support for multiple image formats (PNG, JPEG, WebP)\n- Configurable image dimensions and aspect ratios\n- Advanced prompt engineering capabilities\n- Cost-effective pricing with pay-as-you-go model\n- Enterprise-grade security and compliance\n- Real-time generation with low latency\n- Batch processing support for multiple images\n\nUse Cases:\n- Content creation for marketing and advertising\n- Product visualization and mockups\n- Social media content generation\n- E-commerce product images\n- Game asset creation\n- Architectural visualization\n- Educational materials and illustrations\n\nThis server requires valid AWS credentials with appropriate permissions to access the Amazon Nova Canvas service. Make sure your IAM role has the necessary policies attached before using this integration.\n\nFor more information about pricing, limits, and best practices, please refer to the official AWS documentation.",
      repository: {
        source: "github",
        id: "awslabs",
        url: "https://github.com/awslabs/aws-nova-canvas",
      },
      websiteUrl: "https://github.com/awslabs/aws-nova-canvas",
      icons: [
        {
          src: "https://www.amazon.com/favicon.ico",
          sizes: ["32x32"],
          mimeType: "image/x-icon",
        },
      ],
      packages: [
        {
          version: "1.0.0",
          environmentVariables: [
            {
              name: "AWS_ACCESS_KEY_ID",
            },
            {
              name: "AWS_SECRET_ACCESS_KEY",
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
        isLatest: true,
        publishedAt: "2024-11-20T10:00:00.0Z",
        status: "active",
      },
    },
  });
