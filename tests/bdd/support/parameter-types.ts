import { defineParameterType } from "@cucumber/cucumber";
import type { AriaRole } from "@playwright/test";
import { allowedRolePhrases } from "./roles.ts";

// Build a tight, case-insensitive pattern from the canonical phrases
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phrases = Object.keys(allowedRolePhrases).map(escapeRegex).join("|");
// Important: do not anchor (no ^ or $). Cucumber composes parameter regexps
// into a larger expression; anchors can prevent proper matching.
const rolePattern = new RegExp(`(?:${phrases})`);

defineParameterType({
  name: "role",
  // keep snippets focused on canonical phrases in feature files
  useForSnippets: false,
  regexp: rolePattern,
  transformer: (text: string): AriaRole => {
    const key = text.trim().toLowerCase();
    const role = allowedRolePhrases[key];
    if (role) return role;
    const examples = Object.keys(allowedRolePhrases).slice(0, 10).join(", ");
    throw new Error(
      `Unknown role phrase "${text}". Use one of the canonical phrases (e.g., ${examples} ...).`,
    );
  },
});
