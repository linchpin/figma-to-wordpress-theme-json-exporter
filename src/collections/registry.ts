import { ExportOptions, VariableCollection } from "../types";
import type { ExportContext, CollectionProcessor } from "./types";
import { primitivesProcessor } from "./processors/primitives";
import { wpSettingsProcessor } from "./processors/wp-settings";
import { wpSettingsColorsProcessor } from "./processors/wp-settings-colors";
import { wpSettingsSubsetProcessor } from "./processors/wp-settings-subset";
import { wpSettingsExtendedProcessor } from "./processors/wp-settings-extended";
import { wpStylesGlobalProcessor } from "./processors/wp-styles-global";
import { wpElementsProcessor } from "./processors/wp-elements";
import { wpBlocksProcessor } from "./processors/wp-blocks";
import { fallbackSelectedProcessor } from "./processors/fallback-selected";


/**
 * Ordered collection processors for theme.json export
 *
 * Processing order is important:
 * 1. primitivesProcessor - Base design tokens → settings.custom
 * 2. wpSettingsColorsProcessor - Color presets → settings.color.palette
 * 3. wpSettingsSubsetProcessor - Core settings (layout, spacing, typography, shadow)
 * 4. wpSettingsExtendedProcessor - Extended settings (background, border, dimensions, position)
 * 5. wpSettingsProcessor - General wp.settings.* → settings or settings.custom
 * 6. wpStylesGlobalProcessor - Global styles → styles root
 * 7. wpElementsProcessor - Element styles → styles.elements
 * 8. wpBlocksProcessor - Block styles → styles.blocks
 * 9. fallbackSelectedProcessor - Catch-all for remaining collections
 */
export const collectionProcessors: CollectionProcessor[] = [
  primitivesProcessor,
  wpSettingsColorsProcessor,
  wpSettingsSubsetProcessor,
  wpSettingsExtendedProcessor,
  wpSettingsProcessor,
  wpStylesGlobalProcessor,
  wpElementsProcessor,
  wpBlocksProcessor,
  fallbackSelectedProcessor,
];

export async function dispatchCollection(
  collection: VariableCollection,
  ctx: ExportContext,
  options: ExportOptions
) {
  const name = collection.name || "";
  // We rely on the caller to pass either selected collections, or
  // we will have pre-filtered non-wp collections out at the call site.

  const processor = collectionProcessors.find((p) => p.matches(name));
  if (processor) {
    await processor.process(collection, ctx, options);
  }
}


