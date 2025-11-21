import type { AriaRole } from "@playwright/test";
import { roles as ariaRolesMap } from "aria-query";

// Set of all valid ARIA roles sourced from aria-query (for diagnostics)
export const validAriaRoles = new Set<string>([...ariaRolesMap.keys()]);

// Canonical phrases allowed in features → mapped to ARIA role
// Keep exactly one human-facing variant per role to minimize duplication
export const allowedRolePhrases: Record<string, AriaRole> = {
  // common interactive roles
  button: "button",
  link: "link",
  checkbox: "checkbox",
  "menu item": "menuitem",
  "radio button": "radio",
  combobox: "combobox",
  listbox: "listbox",
  // useful extras (read-only)
  heading: "heading",
  textbox: "textbox",
};

// Inverse lookup for recommendations (ARIA role → preferred phrase)
export const preferredPhraseByRole: Record<AriaRole, string> = Object.entries(
  allowedRolePhrases,
).reduce(
  (acc, [phrase, role]) => {
    acc[role] = phrase;
    return acc;
  },
  {} as Record<AriaRole, string>,
);
