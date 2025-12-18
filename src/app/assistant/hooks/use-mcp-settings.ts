"use client";

import { useContext } from "react";
import {
  McpSettingsContext,
  type McpSettingsContextValue,
} from "../mcp-settings-context";

export function useMcpSettings(): McpSettingsContextValue {
  const context = useContext(McpSettingsContext);
  if (!context) {
    throw new Error("useMcpSettings must be used within McpSettingsProvider");
  }
  return context;
}
