/**
 * WordPress Blocks Processor
 *
 * Handles wp.blocks.{namespace/block-name} collections for block-level styling.
 * Supports both WordPress core blocks and custom/third-party blocks.
 *
 * Collection pattern: wp.blocks.{namespace}/{block-name}
 * Target: styles.blocks.{namespace/block-name}
 */

import { processCollectionData } from "../../collection/index";
import {
  convertObjectKeysToCamelCase,
  deepMerge,
  extractWordPressBlockName,
  isWordPressBlocksCollection,
  isCoreBlock,
} from "../../utils/index";
import { validatePseudoSelectorsDeep } from "../../utils/pseudo-selectors";
import type { CollectionProcessor } from "../types";

/**
 * Stores validation warnings during processing
 */
let processingWarnings: string[] = [];

/**
 * Gets and clears the processing warnings
 * @returns Array of warning messages from the last processing run
 */
export function getBlockProcessingWarnings(): string[] {
  const warnings = [...processingWarnings];
  processingWarnings = [];
  return warnings;
}

/**
 * Processor for WordPress block styles
 *
 * Collection naming examples:
 * - wp.blocks.core/button → styles.blocks["core/button"]
 * - wp.blocks.core/paragraph → styles.blocks["core/paragraph"]
 * - wp.blocks.acf/hero → styles.blocks["acf/hero"]
 * - wp.blocks.theme/feature-card → styles.blocks["theme/feature-card"]
 *
 * Expected variable structure:
 *
 * For wp.blocks.core/button collection:
 * - color/background → styles.blocks["core/button"].color.background
 * - color/text → styles.blocks["core/button"].color.text
 * - :hover/color/background → styles.blocks["core/button"][":hover"].color.background
 * - typography/fontSize → styles.blocks["core/button"].typography.fontSize
 * - spacing/padding/top → styles.blocks["core/button"].spacing.padding.top
 *
 * Nested elements within blocks:
 * - elements/link/color/text → styles.blocks["core/button"].elements.link.color.text
 *
 * Output example:
 * {
 *   "styles": {
 *     "blocks": {
 *       "core/button": {
 *         "color": {
 *           "background": "#0073aa",
 *           "text": "#ffffff"
 *         },
 *         ":hover": {
 *           "color": {
 *             "background": "#005a87"
 *           }
 *         },
 *         "elements": {
 *           "link": {
 *             "color": {
 *               "text": "#ffffff"
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const wpBlocksProcessor: CollectionProcessor = {
  matches: (name) => isWordPressBlocksCollection(name),

  process: async (collection, ctx, options) => {
    const blockName = extractWordPressBlockName(collection.name);
    if (!blockName) return;

    const data = await processCollectionData(collection, options);
    const converted = convertObjectKeysToCamelCase(data);

    // Validate pseudo-selectors and collect warnings
    const warnings = validatePseudoSelectorsDeep(converted, `wp.blocks.${blockName}`);
    if (warnings.length > 0) {
      processingWarnings.push(...warnings);
      // Log warnings for debugging
      warnings.forEach((w) => console.warn(`[wp-blocks] ${w}`));
    }

    // Log whether this is a core or custom block for debugging
    const blockType = isCoreBlock(blockName) ? "core" : "custom";
    console.log(`[wp-blocks] Processing ${blockType} block: ${blockName}`);

    // Ensure styles.blocks exists
    ctx.theme.styles = ctx.theme.styles || {};
    ctx.theme.styles.blocks = ctx.theme.styles.blocks || {};

    // Deep merge into the block's styles
    ctx.theme.styles.blocks[blockName] = deepMerge(
      ctx.theme.styles.blocks[blockName] || {},
      converted
    );
  },
};

/**
 * Gets all detected block collections from a list of collections
 * Useful for UI display of detected blocks with badges
 *
 * @param collections Array of collection objects with name property
 * @returns Array of block info objects with name, isCoreBlock, and badge info
 */
export function getDetectedBlocks(
  collections: Array<{ name: string }>
): Array<{
  blockName: string;
  collectionName: string;
  isCore: boolean;
  badge: { label: string; cssClass: string };
}> {
  const blocks: Array<{
    blockName: string;
    collectionName: string;
    isCore: boolean;
    badge: { label: string; cssClass: string };
  }> = [];

  for (const collection of collections) {
    if (isWordPressBlocksCollection(collection.name)) {
      const blockName = extractWordPressBlockName(collection.name);
      if (blockName) {
        const isCore = isCoreBlock(blockName);
        blocks.push({
          blockName,
          collectionName: collection.name,
          isCore,
          badge: isCore
            ? { label: "Core", cssClass: "badge-core" }
            : { label: "Custom", cssClass: "badge-custom" },
        });
      }
    }
  }

  // Sort: core blocks first, then alphabetically
  blocks.sort((a, b) => {
    if (a.isCore !== b.isCore) {
      return a.isCore ? -1 : 1;
    }
    return a.blockName.localeCompare(b.blockName);
  });

  return blocks;
}
