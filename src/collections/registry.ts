import { ExportOptions, VariableCollection } from "../types";
import type { ExportContext, CollectionProcessor } from "./types";
import { primitivesProcessor } from "./processors/primitives";
import { wpSettingsProcessor } from "./processors/wp-settings";
import { wpSettingsColorsProcessor } from "./processors/wp-settings-colors";
import { wpSettingsSubsetProcessor } from "./processors/wp-settings-subset";
import { wpElementsProcessor } from "./processors/wp-elements";
import { fallbackSelectedProcessor } from "./processors/fallback-selected";


// Ordered processors
export const collectionProcessors: CollectionProcessor[] = [
  primitivesProcessor,
  wpSettingsColorsProcessor,
  wpSettingsSubsetProcessor,
  wpSettingsProcessor,
  wpElementsProcessor,
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


