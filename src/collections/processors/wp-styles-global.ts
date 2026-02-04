/**
 * WordPress Global Styles Processor
 *
 * Handles the wp.styles collection for body-level global styles.
 * These styles apply to the document body and serve as defaults.
 *
 * Collection pattern: wp.styles or wp.styles.*
 * Target: styles.* (root of styles object)
 */

import { processCollectionData } from "../../collection/index";
import { convertObjectKeysToCamelCase, deepMerge, isWordPressStylesCollection } from "../../utils/index";
import type { CollectionProcessor } from "../types";

/**
 * Processor for WordPress global styles
 *
 * Collection naming examples:
 * - wp.styles → styles (root)
 * - wp.styles.color → styles (color properties at root)
 * - wp.styles.typography → styles (typography properties at root)
 *
 * Expected variable structure:
 *
 * For wp.styles collection:
 * - color/background → styles.color.background
 * - color/text → styles.color.text
 * - typography/fontFamily → styles.typography.fontFamily
 * - typography/fontSize → styles.typography.fontSize
 * - spacing/padding/top → styles.spacing.padding.top
 * - spacing/margin/bottom → styles.spacing.margin.bottom
 *
 * Output example:
 * {
 *   "styles": {
 *     "color": {
 *       "background": "#ffffff",
 *       "text": "#000000"
 *     },
 *     "typography": {
 *       "fontFamily": "var(--wp--preset--font-family--system)",
 *       "fontSize": "var(--wp--preset--font-size--medium)"
 *     }
 *   }
 * }
 */
export const wpStylesGlobalProcessor: CollectionProcessor = {
  matches: (name) => isWordPressStylesCollection(name),

  process: async (collection, ctx, options) => {
    const data = await processCollectionData(collection, options);
    const converted = convertObjectKeysToCamelCase(data);

    // Ensure styles object exists
    ctx.theme.styles = ctx.theme.styles || {};

    // Deep merge the processed data into styles root
    ctx.theme.styles = deepMerge(ctx.theme.styles, converted);
  },
};
