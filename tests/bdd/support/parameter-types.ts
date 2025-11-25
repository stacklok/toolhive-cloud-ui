import { defineParameterType } from "@cucumber/cucumber";
import type { AriaRole } from "@playwright/test";
import { allowedRolePhrases } from "./roles.ts";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phrases = Object.keys(allowedRolePhrases).map(escapeRegex).join("|");
const rolePattern = new RegExp(`(?:${phrases})`);

defineParameterType({
  name: "role",
  useForSnippets: false,
  regexp: rolePattern,
  transformer: (text: string): AriaRole => {
    const key = text.trim().toLowerCase();
    const role = allowedRolePhrases[key];
    if (role) return role;
    throw new Error(`Unknown role phrase "${text}".`);
  },
});
