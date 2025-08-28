import { processCollectionModeData } from "../../collection/index";
import { processButtonStyles } from "../../button/index";
import { isWordPressSettingsColorCollection } from "../../utils/index";
import type { CollectionProcessor } from "../types";

/**
 * This processor is used to process the colors collection.
 * 
 * Intentionally DO NOT merge colors into settings.custom.
 * Color collections will be surfaced via palette presets, not custom variables.
 */
export const wpSettingsColorsProcessor: CollectionProcessor = {
  matches: (name) => isWordPressSettingsColorCollection(name),
  process: async (collection, ctx, options) => {
    if (collection.modes.length === 0) return;

    const firstModeData = await processCollectionModeData(collection, collection.modes[0], options);

    if (firstModeData && "button" in firstModeData) {
      processButtonStyles(firstModeData.button as Record<string, any>, ctx.files);
    }
  },
};


