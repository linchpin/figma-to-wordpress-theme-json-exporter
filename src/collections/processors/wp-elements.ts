/**
 * WordPress Elements Processor
 *
 * Handles wp.elements.{element-name} collections for element-level styling.
 * Supports pseudo-selectors for interactive states.
 *
 * Collection pattern: wp.elements or wp.elements.{element-name}
 * Target: styles.elements.{element-name}
 */

import { processCollectionData } from "../../collection/index";
import { processButtonStyles } from "../../button/index";
import {
  convertObjectKeysToCamelCase,
  extractWordPressElementsPath,
  isWordPressElementsCollection,
  mergeCollectionData,
  isValidElement,
} from "../../utils/index";
import {
  validatePseudoSelectorsDeep,
  validatePseudoSelectorsForElement,
} from "../../utils/pseudo-selectors";
import { VALID_ELEMENTS } from "../../types/theme-json";
import type { CollectionProcessor } from "../types";

/**
 * Stores validation warnings during processing
 */
let processingWarnings: string[] = [];

/**
 * Gets and clears the processing warnings
 * @returns Array of warning messages from the last processing run
 */
export function getElementProcessingWarnings(): string[] {
  const warnings = [...processingWarnings];
  processingWarnings = [];
  return warnings;
}

/**
 * Validates an element name against WordPress valid elements
 * @param elementName The element name to validate
 * @returns Array of warning messages (empty if valid)
 */
function validateElementName(elementName: string): string[] {
  if (!elementName) return [];

  const normalized = elementName.toLowerCase();
  if (!isValidElement(normalized)) {
    return [
      `Unknown element "${elementName}". Valid elements: ${VALID_ELEMENTS.join(", ")}`,
    ];
  }
  return [];
}

/**
 * Processor for WordPress element styles
 *
 * Collection naming examples:
 * - wp.elements → styles.elements (merges all elements)
 * - wp.elements.button → styles.elements.button
 * - wp.elements.link → styles.elements.link
 * - wp.elements.heading → styles.elements.heading
 * - wp.elements.h1 through wp.elements.h6 → individual heading levels
 *
 * Expected variable structure:
 *
 * For wp.elements.button collection:
 * - color/background → styles.elements.button.color.background
 * - color/text → styles.elements.button.color.text
 * - :hover/color/background → styles.elements.button[":hover"].color.background
 * - :focus/color/background → styles.elements.button[":focus"].color.background
 *
 * For wp.elements.link collection (supports additional pseudo-selectors):
 * - color/text → styles.elements.link.color.text
 * - :hover/color/text → styles.elements.link[":hover"].color.text
 * - :visited/color/text → styles.elements.link[":visited"].color.text
 * - :link/color/text → styles.elements.link[":link"].color.text
 */
export const wpElementsProcessor: CollectionProcessor = {
  matches: (name) => isWordPressElementsCollection(name),
  process: async (collection, ctx, options) => {
    const collectionData = await processCollectionData(collection, options);
    const converted = convertObjectKeysToCamelCase(collectionData);

    ctx.theme.styles = ctx.theme.styles || ({} as any);
    (ctx.theme.styles as any).elements = (ctx.theme.styles as any).elements || {};
    const target = (ctx.theme.styles as any).elements as Record<string, any>;

    const rawPath = extractWordPressElementsPath(collection.name);
    // Normalize "buttons" to "button" for WordPress compatibility
    const elementsPath = rawPath === "buttons" ? "button" : rawPath;

    if (elementsPath) {
      // Validate element name
      const elementWarnings = validateElementName(elementsPath);
      if (elementWarnings.length > 0) {
        processingWarnings.push(...elementWarnings);
        elementWarnings.forEach((w) => console.warn(`[wp-elements] ${w}`));
      }

      // Validate pseudo-selectors for this specific element
      const pseudoWarnings = validatePseudoSelectorsForElement(elementsPath, converted);
      if (pseudoWarnings.length > 0) {
        processingWarnings.push(...pseudoWarnings);
        pseudoWarnings.forEach((w) => console.warn(`[wp-elements] ${w}`));
      }

      // Also validate nested pseudo-selectors
      const deepWarnings = validatePseudoSelectorsDeep(converted, `wp.elements.${elementsPath}`);
      if (deepWarnings.length > 0) {
        processingWarnings.push(...deepWarnings);
        deepWarnings.forEach((w) => console.warn(`[wp-elements] ${w}`));
      }

      target[elementsPath] = target[elementsPath] || {};
      mergeCollectionData(target[elementsPath], "", converted);

      // Process button styles for style variations
      if (elementsPath === "button" && collectionData && (collectionData as any).button) {
        processButtonStyles((collectionData as any).button, ctx.files);
      }
    } else {
      // Root wp.elements collection: merge all elements into styles.elements
      // Validate each top-level key as an element name
      for (const key of Object.keys(converted)) {
        if (!key.startsWith(":")) {
          const warnings = validateElementName(key);
          if (warnings.length > 0) {
            processingWarnings.push(...warnings);
            warnings.forEach((w) => console.warn(`[wp-elements] ${w}`));
          }
        }
      }

      // Validate all pseudo-selectors deeply
      const deepWarnings = validatePseudoSelectorsDeep(converted, "wp.elements");
      if (deepWarnings.length > 0) {
        processingWarnings.push(...deepWarnings);
        deepWarnings.forEach((w) => console.warn(`[wp-elements] ${w}`));
      }

      mergeCollectionData(target, "", converted);

      // Process button styles if present
      if (collectionData && (collectionData as any).button) {
        processButtonStyles((collectionData as any).button, ctx.files);
      }
    }
  },
};


