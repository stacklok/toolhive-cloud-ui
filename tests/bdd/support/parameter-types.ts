import { defineParameterType } from "@cucumber/cucumber";
import type { AriaRole } from "@playwright/test";
import { roleAliases, validAriaRoles } from "./roles.ts";

defineParameterType({
  name: "role",
  // Match human-written role text, e.g., "menu item", "radio button", "checkbox"
  regexp: /[A-Za-z ][A-Za-z -]*/,
  transformer: (text: string): AriaRole => {
    const input = text.trim().toLowerCase();

    // 1) Exact match
    if (validAriaRoles.has(input)) {
      return input as AriaRole;
    }

    // 2) Compact variant: remove spaces and hyphens
    const compact = input.replace(/[\s-]+/g, "");
    if (validAriaRoles.has(compact)) {
      return compact as AriaRole;
    }

    // 3) Aliases
    const alias = roleAliases[input];
    if (alias) {
      return alias;
    }

    // 4) Helpful error
    const sample = Array.from(validAriaRoles).slice(0, 15).join(", ");
    throw new Error(
      `Unknown role "${text}".\n` +
        `- Tried: "${input}" and "${compact}".\n` +
        "- Add an alias in roleAliases if this is a valid custom phrase.\n" +
        `- Example known roles: ${sample} ...`,
    );
  },
});
