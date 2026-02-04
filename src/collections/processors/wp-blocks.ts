/**
 * WordPress Blocks Processor
 *
 * Handles wp.blocks.{namespace/block-name} collections for block-level styling.
 * Also supports group-based structure where wp.blocks collection contains
 * variables organized in namespace/block-name groups (e.g., core/cover, core/heading).
 *
 * Collection patterns:
 * - wp.blocks.{namespace}/{block-name} (legacy, namespace in collection name)
 * - wp.blocks with groups like core/cover, core/heading (preferred, Figma-friendly)
 *
 * Target: styles.blocks.{namespace/block-name}
 */

import { processCollectionData } from "../../collection/index";
import {
  convertObjectKeysToCamelCase,
  deepMerge,
  extractWordPressBlockName,
  isWordPressBlocksCollection,
  isGroupBasedBlocksCollection,
  isCoreBlock,
  formatValueWithUnits,
} from "../../utils/index";
import { rgbToHex } from "../../utils/color";
import { validatePseudoSelectorsDeep } from "../../utils/pseudo-selectors";
import type { CollectionProcessor } from "../types";
import type { ExportOptions } from "../../types";

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
    // Check if this is the group-based wp.blocks collection
    if (isGroupBasedBlocksCollection(collection.name)) {
      await processGroupBasedBlocks(collection, ctx, options);
      return;
    }

    // Legacy: handle wp.blocks.{namespace}/{block-name} collections
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
 * Process a group-based wp.blocks collection
 * Variables are organized in groups like core/cover, core/heading
 * Variable names follow pattern: {namespace}/{block-name}/{property-path}
 * e.g., core/cover/color/background, core/heading/typography/fontSize
 */
async function processGroupBasedBlocks(
  collection: any,
  ctx: any,
  options: ExportOptions | undefined
) {
  const { variableIds, modes } = collection;
  const modeId = modes[0]?.modeId;
  if (!modeId) return;

  // Group variables by block name (first two segments: namespace/block-name)
  const blockVariables: Map<string, Array<{ name: string; variable: any }>> = new Map();

  for (const variableId of variableIds) {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) continue;

    const parts = variable.name.split("/");
    // Need at least namespace/block-name/property (3 parts minimum)
    if (parts.length < 3) continue;

    const blockName = `${parts[0]}/${parts[1]}`;
    if (!blockVariables.has(blockName)) {
      blockVariables.set(blockName, []);
    }
    blockVariables.get(blockName)!.push({ name: variable.name, variable });
  }

  // Ensure styles.blocks exists
  ctx.theme.styles = ctx.theme.styles || {};
  ctx.theme.styles.blocks = ctx.theme.styles.blocks || {};

  // Process each block's variables
  for (const [blockName, variables] of blockVariables) {
    const blockData: Record<string, any> = {};

    for (const { name, variable } of variables) {
      const { resolvedType, valuesByMode } = variable;
      const value = valuesByMode[modeId];

      if (value === undefined || !["COLOR", "FLOAT"].includes(resolvedType)) continue;

      // Get property path (everything after namespace/block-name)
      const parts = name.split("/");
      const propertyParts = parts.slice(2); // Skip namespace and block-name

      // Build nested structure
      let obj = blockData;
      for (let i = 0; i < propertyParts.length - 1; i++) {
        const part = propertyParts[i];
        obj[part] = obj[part] || {};
        obj = obj[part];
      }

      const leafName = propertyParts[propertyParts.length - 1];

      // Handle the value
      if (resolvedType === "COLOR") {
        obj[leafName] = rgbToHex(value);
      } else {
        obj[leafName] = formatValueWithUnits(
          propertyParts,
          value,
          options?.useRem,
          options?.remCollections
        );
      }
    }

    const converted = convertObjectKeysToCamelCase(blockData);

    // Validate pseudo-selectors
    const warnings = validatePseudoSelectorsDeep(converted, `wp.blocks.${blockName}`);
    if (warnings.length > 0) {
      processingWarnings.push(...warnings);
      warnings.forEach((w) => console.warn(`[wp-blocks] ${w}`));
    }

    const blockType = isCoreBlock(blockName) ? "core" : "custom";
    console.log(`[wp-blocks] Processing ${blockType} block from groups: ${blockName}`);

    // Deep merge into the block's styles
    ctx.theme.styles.blocks[blockName] = deepMerge(
      ctx.theme.styles.blocks[blockName] || {},
      converted
    );
  }
}

/**
 * Gets all detected block collections from a list of collections
 * Useful for UI display of detected blocks with badges
 *
 * Supports two patterns:
 * 1. Legacy: collections named wp.blocks.{namespace}/{block-name}
 * 2. Group-based: wp.blocks collection with variableNames containing block info
 *
 * @param collections Array of collection objects with name property
 * @param variableNames Optional array of variable names from wp.blocks collection (for group-based detection)
 * @returns Array of block info objects with name, isCoreBlock, and badge info
 */
export function getDetectedBlocks(
  collections: Array<{ name: string }>,
  variableNames?: string[]
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

  const addedBlockNames = new Set<string>();

  for (const collection of collections) {
    // Check for group-based wp.blocks collection
    if (isGroupBasedBlocksCollection(collection.name) && variableNames && variableNames.length > 0) {
      // Extract unique block names from variable names
      // Variable names follow pattern: {namespace}/{block-name}/{property}
      for (const varName of variableNames) {
        const parts = varName.split("/");
        if (parts.length >= 3) {
          const blockName = `${parts[0]}/${parts[1]}`;
          if (!addedBlockNames.has(blockName)) {
            addedBlockNames.add(blockName);
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
    }
    // Legacy: wp.blocks.{namespace}/{block-name} pattern
    else if (isWordPressBlocksCollection(collection.name) && !isGroupBasedBlocksCollection(collection.name)) {
      const blockName = extractWordPressBlockName(collection.name);
      if (blockName && !addedBlockNames.has(blockName)) {
        addedBlockNames.add(blockName);
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
