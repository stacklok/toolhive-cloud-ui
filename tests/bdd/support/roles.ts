import type { AriaRole } from "@playwright/test";
import { roles as ariaRolesMap } from "aria-query";

// Set of all valid ARIA roles sourced from aria-query
export const validAriaRoles = new Set<string>([...ariaRolesMap.keys()]);

// Map human-friendly phrases to real ARIA roles (keep this minimal and sensible)
export const roleAliases: Record<string, AriaRole> = {
  "menu item": "menuitem",
  "radio button": "radio",
  "check box": "checkbox",
  // common synonyms
  dropdown: "combobox",
  "list box": "listbox",
};
