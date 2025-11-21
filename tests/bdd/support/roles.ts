import type { AriaRole } from "@playwright/test";
import { roles as ariaRolesMap } from "aria-query";

// Set of all valid ARIA roles sourced from aria-query (for diagnostics)
export const validAriaRoles = new Set<string>([...ariaRolesMap.keys()]);

// Customized human-friendly phrases → ARIA roles.
// Only add entries here when the preferred phrase differs from the raw ARIA role name.
const customizedRoleNames: Record<string, AriaRole> = {
  // Prefer "menu item" over the raw ARIA role string "menuitem"
  "menu item": "menuitem",
};

// Build the canonical mapping of phrases allowed in features → ARIA roles.
// - Start from customized phrases
// - Then add every remaining ARIA role mapping to itself (phrase === role)
// - Do NOT add a self-mapping for roles already covered by a custom phrase,
//   so there is exactly one canonical phrase per role.
const buildAllowedRolePhrases = (): Record<string, AriaRole> => {
  const mapping: Record<string, AriaRole> = {};

  // Seed with custom phrases (lowercased keys)
  for (const [phrase, role] of Object.entries(customizedRoleNames)) {
    mapping[phrase.trim().toLowerCase()] = role;
  }

  const customizedRoles = new Set(Object.values(customizedRoleNames));
  for (const roleName of ariaRolesMap.keys()) {
    const role = String(roleName) as AriaRole;
    if (!customizedRoles.has(role)) {
      mapping[role] = role; // default: phrase equals role name
    }
  }
  return mapping;
};

export const allowedRolePhrases = buildAllowedRolePhrases();

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
