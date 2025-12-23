import { getMCPServersWithTools } from "@/features/vmcp-builder/actions";
import { VMCPBuilderClient } from "./vmcp-builder-client";

export const metadata = {
  title: "vMCP Builder | ToolHive",
  description: "Build Virtual MCP Servers with a visual workflow editor",
};

export default async function VMCPBuilderPage() {
  const servers = await getMCPServersWithTools();

  return <VMCPBuilderClient servers={servers} />;
}
