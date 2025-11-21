import { defineParameterType } from "@cucumber/cucumber";
import type { AriaRole } from "@playwright/test";
import {
  allowedRolePhrases,
  preferredPhraseByRole,
  validAriaRoles,
} from "./roles.ts";

defineParameterType({
  name: "role",
  // Match human-written role text, e.g., "menu item", "radio button", "checkbox"
  regexp: /[A-Za-z ][A-Za-z -]*/,
  transformer: (text: string): AriaRole => {
    const input = text.trim().toLowerCase();

    // Accept only canonical phrases to reduce variants
    const canonical = allowedRolePhrases[input];
    if (canonical) {
      return canonical;
    }

    // If user provided an ARIA role directly, recommend the canonical phrase
    if (validAriaRoles.has(input)) {
      const role = input as AriaRole;
      const preferred = preferredPhraseByRole[role];
      if (preferred && preferred !== input) {
        throw new Error(
          `Use canonical role phrase "${preferred}" instead of "${input}".`,
        );
      }
      // Role equals its canonical phrase (e.g., "button", "link", "checkbox")
      return role;
    }

    // Helpful error with allowed phrases
    const examples = Object.keys(allowedRolePhrases).slice(0, 10).join(", ");
    throw new Error(
      `Unknown role phrase "${text}". Use one of the canonical phrases (e.g., ${examples} ...).`,
    );
  },
});
