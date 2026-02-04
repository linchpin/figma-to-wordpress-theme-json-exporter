/**
 * WordPress Extended Settings Processor
 *
 * Handles additional WordPress theme.json settings sections:
 * - wp.settings.background
 * - wp.settings.border
 * - wp.settings.dimensions
 * - wp.settings.position
 *
 * These are newer settings sections added in WordPress theme.json v3.
 */

import { processCollectionData } from "../../collection/index";
import { convertObjectKeysToCamelCase, deepMerge } from "../../utils/index";
import type { CollectionProcessor } from "../types";

/**
 * Extended settings sections supported by this processor
 */
const EXTENDED_SECTIONS = ["background", "border", "dimensions", "position"] as const;

type ExtendedSection = typeof EXTENDED_SECTIONS[number];

/**
 * Extracts the extended settings section name from a collection name
 * @param name Collection name (e.g., "wp.settings.background")
 * @returns The section name (e.g., "background") or null if not matched
 */
function extractExtendedSubset(name: string): ExtendedSection | null {
  const pattern = new RegExp(
    `^wp\\.settings\\.(${EXTENDED_SECTIONS.join("|")})(?:\\.|$)`,
    "i"
  );
  const match = name.trim().match(pattern);
  return match ? (match[1].toLowerCase() as ExtendedSection) : null;
}

/**
 * Unwraps a nested object if it contains a key matching the section name
 * This handles cases like { background: { backgroundImage: true } }
 * becoming just { backgroundImage: true }
 *
 * @param section The section name to look for
 * @param data The data object to unwrap
 * @returns Unwrapped data or original data if no matching key
 */
function unwrapSubsetRoot(
  section: string,
  data: Record<string, any>
): Record<string, any> {
  if (!data || typeof data !== "object") return data;
  if (
    Object.prototype.hasOwnProperty.call(data, section) &&
    typeof data[section] === "object"
  ) {
    return data[section];
  }
  return data;
}

/**
 * Processor for extended WordPress settings sections
 *
 * Collection naming examples:
 * - wp.settings.background → settings.background
 * - wp.settings.border → settings.border
 * - wp.settings.dimensions → settings.dimensions
 * - wp.settings.position → settings.position
 *
 * Expected variable structure:
 *
 * For background:
 * - backgroundImage → settings.background.backgroundImage (boolean)
 * - backgroundSize → settings.background.backgroundSize (boolean)
 *
 * For border:
 * - color → settings.border.color (boolean)
 * - radius → settings.border.radius (boolean)
 * - style → settings.border.style (boolean)
 * - width → settings.border.width (boolean)
 *
 * For dimensions:
 * - aspectRatio → settings.dimensions.aspectRatio (boolean)
 * - minHeight → settings.dimensions.minHeight (boolean)
 *
 * For position:
 * - sticky → settings.position.sticky (boolean)
 */
export const wpSettingsExtendedProcessor: CollectionProcessor = {
  matches: (name) => extractExtendedSubset(name) !== null,

  process: async (collection, ctx, options) => {
    const section = extractExtendedSubset(collection.name);
    if (!section) return;

    // Check if this settings section is enabled in options
    const enableKey = `enable${section.charAt(0).toUpperCase() + section.slice(1)}Settings` as
      | "enableBackgroundSettings"
      | "enableBorderSettings"
      | "enableDimensionsSettings"
      | "enablePositionSettings";

    // If the option exists and is explicitly false, skip processing
    if (options[enableKey] === false) {
      return;
    }

    const data = await processCollectionData(collection, options);
    const unwrapped = unwrapSubsetRoot(section, convertObjectKeysToCamelCase(data));

    // Ensure settings object exists
    ctx.theme.settings = ctx.theme.settings || {};
    ctx.theme.settings[section] = ctx.theme.settings[section] || {};

    // Deep merge the processed data
    ctx.theme.settings[section] = deepMerge(
      ctx.theme.settings[section],
      unwrapped
    );
  },
};
