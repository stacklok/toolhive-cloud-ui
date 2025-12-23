import { VMCPBuilderClient } from "./vmcp-builder-client";
import { getMCPServersWithTools } from "@/features/vmcp-builder/actions";

export const metadata = {
  title: "vMCP Builder | ToolHive",
  description: "Build Virtual MCP Servers with a visual workflow editor",
};

export default async function VMCPBuilderPage() {
  const servers = await getMCPServersWithTools();

  return <VMCPBuilderClient servers={servers} />;
}

