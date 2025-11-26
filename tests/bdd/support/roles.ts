import type { AriaRole } from "@playwright/test";
import { roles as ariaRolesMap } from "aria-query";

// Custom phrases for ARIA roles (when the phrase differs from the role name)
const customPhrases: Record<string, AriaRole> = {
  "menu item": "menuitem",
};

function buildAllowedRolePhrases(): Record<string, AriaRole> {
  const mapping: Record<string, AriaRole> = {};

  for (const [phrase, role] of Object.entries(customPhrases)) {
    mapping[phrase.trim().toLowerCase()] = role;
  }

  const customRoles = new Set(Object.values(customPhrases));
  for (const roleName of ariaRolesMap.keys()) {
    const role = String(roleName) as AriaRole;
    if (!customRoles.has(role)) {
      mapping[role] = role;
    }
  }
  return mapping;
}

export const allowedRolePhrases = buildAllowedRolePhrases();
